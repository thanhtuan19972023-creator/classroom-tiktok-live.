// Lớp học vui vẻ 12A — TikTok LIVE event bridge.
// TikTok-Live-Connector is an unofficial project. Public LIVE only; NO login cookies.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { EdgeTTS } from '@andresaya/edge-tts';

const username = String(process.env.TIKTOK_USERNAME || '').trim().replace(/^@/, '').toLowerCase();
const port = Number(process.env.PORT || 10000);
const instanceId = randomUUID();
const eventHistory = [];
const recentMessageIds = new Map();
const maxEvents = 1000; // Keep extra recent events during TikTok LIVE bursts.
let lastId = 0, state = username ? 'starting' : 'not_configured';
let currentConnection = null, reconnectTimer = null, lastError = '';
let connectedSince = null, lastEventAt = null, roomId = null;
let restartingConnection=false, roomProbeInFlight=false, lastManualRestart=0;
let lastRoomProbeError='', lastRoomCheckedAt=0;
// Provider account-hour limits must not trigger rapid reconnect loops.
let rateLimitUntil=0, nextRetryAt=0, consecutiveFailures=0;

function trim(value, max=120) { return String(value ?? '').trim().slice(0,max); }
function displayUser(evt) {
  const user = evt?.user || {};
  const handle = trim(user.uniqueId || user.displayId || user.nickname || 'unknown',65);
  const nickname = trim(user.nickname || user.displayId || user.uniqueId || 'Học sinh',55);
  const userId = trim(user.id || user.userId || user.userIdStr || handle,100);
  return { userId, handle, nickname };
}
function pushEvent(type, evt, details={}) {
  // Provider-level duplicate events are possible, especially around reconnects.
  const externalId=trim(evt?.id || evt?.messageId || '',100);
  const eventKey=externalId ? type+':'+externalId : '';
  if(eventKey && recentMessageIds.has(eventKey))return;
  if(eventKey){
    recentMessageIds.set(eventKey,Date.now());
    if(recentMessageIds.size>1000){
      const cutoff=Date.now()-15*60*1000;
      for(const [k,t] of recentMessageIds)if(t<cutoff)recentMessageIds.delete(k);
      while(recentMessageIds.size>1500)recentMessageIds.delete(recentMessageIds.keys().next().value);
    }
  }
  const event={id:++lastId,type,...displayUser(evt),...details,receivedAt:Date.now()};
  eventHistory.push(event);
  if(eventHistory.length>maxEvents)eventHistory.shift();
  lastEventAt=event.receivedAt;
}
function info() {
  return {
    ready:true, source:'unofficial_tiktok_live_connector', instanceId,
    username:username ? '@'+username : null, state, connected:state==='connected',
    roomId, connectedSince, lastEventAt, lastError, cursor:lastId,
    checkingNewRoom:roomProbeInFlight, lastRoomCheckedAt, lastRoomProbeError,
    rateLimitUntil, nextRetryAt,
    time:Date.now()
  };
}
function providerRateLimited(error=''){
  return /rate[_\\s-]*limit|too many connections|retry.after|429\\b/i.test(String(error||''));
}
function noteConnectionFailure(error=''){
  consecutiveFailures=Math.min(7,consecutiveFailures+1);
  if(providerRateLimited(error)){
    // The upstream error explicitly states rate_limit_account_hour.
    // Leave the provider alone for an hour rather than hammering its connection API.
    rateLimitUntil=Math.max(rateLimitUntil,Date.now()+60*60*1000);
    console.warn('TikTok connection rate limited; backing off until',new Date(rateLimitUntil).toISOString());
  }
}
function planReconnect(waitMs=30000) {
  if(!username || reconnectTimer || restartingConnection)return;
  const now=Date.now();
  const backoff=Math.min(10*60*1000,30000*Math.pow(2,Math.min(consecutiveFailures-1,5)));
  const delay=Math.max(30000,waitMs,backoff,rateLimitUntil>now?rateLimitUntil-now:0);
  nextRetryAt=now+delay;
  reconnectTimer=setTimeout(()=>{reconnectTimer=null;nextRetryAt=0;void connectLive()},delay);
  reconnectTimer.unref?.();
}
// TikTok creates a NEW room ID every time the creator starts a new LIVE.
// Reset an old socket before binding to the new room, even if the old socket
// never sent a DISCONNECTED event.
async function restartConnection(reason='refresh TikTok room'){
  if(!username||restartingConnection||Date.now()<rateLimitUntil)return false;
  restartingConnection=true;
  if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=null}
  const old=currentConnection;
  currentConnection=null;state='disconnected';roomId=null;connectedSince=null;
  console.log('Refreshing TikTok LIVE connection:',reason);
  try{if(old)await old.disconnect()}catch(e){
    console.warn('Closing previous TikTok room:',String(e?.message||e).slice(0,100));
  }
  restartingConnection=false;
  void connectLive();
  return true;
}
// Periodically discover the creator's CURRENT room, not merely whether a
// websocket claims to be open. An old connection can outlive a LIVE restart.
async function monitorLiveRoom(){
  if(!username||restartingConnection||roomProbeInFlight)return;
  if(state!=='connected'){
    if(state!=='connecting'&&!reconnectTimer)planReconnect(1000);
    return;
  }
  const conn=currentConnection;
  if(!conn?.isConnected){
    await restartConnection('stale or closed TikTok socket');
    return;
  }
  roomProbeInFlight=true;lastRoomCheckedAt=Date.now();
  try{
    const discovered=trim(await conn.fetchRoomId(username),80);
    if(conn!==currentConnection)return;
    lastRoomProbeError='';
    if(discovered&&roomId&&discovered!==roomId){
      console.log('TikTok started a different LIVE room:',roomId,'->',discovered);
      await restartConnection('new LIVE room detected');
    }
  }catch(e){
    if(conn===currentConnection)lastRoomProbeError=trim(e?.message||e,160);
    // TikTok's discovery endpoint can be rate-limited; a single failed check
    // is not proof that an existing LIVE stopped. Keep the working socket.
  }finally{roomProbeInFlight=false}
}
const liveRoomMonitor=setInterval(()=>{void monitorLiveRoom()},60000);
liveRoomMonitor.unref?.();
async function connectLive() {
  if(!username || restartingConnection || state==='connecting' || state==='connected')return;
  if(Date.now()<rateLimitUntil){planReconnect(rateLimitUntil-Date.now());return;}
  state='connecting';lastError='';nextRetryAt=0;
  // A fresh socket is used for each retry. Only messages received after connection count.
  const conn=new TikTokLiveConnection(username,{
    processInitialData:false,
    fetchRoomInfoOnConnect:true,
    enableExtendedGiftInfo:false
  });
  currentConnection=conn;
  conn.on(WebcastEvent.CHAT, evt=>{
    if(currentConnection!==conn)return;
    pushEvent('comment',evt,{comment:trim(evt.content || evt.comment || '',180)});
  });
  conn.on(WebcastEvent.GIFT, evt=>{
    if(currentConnection!==conn)return;
    // Streak messages carry cumulative totals; do NOT count every intermediate update.
    if(evt?.gift?.type===1 && Number(evt.repeatEnd)!==1)return;
    const giftName=trim(evt?.gift?.name || evt?.extendedGiftInfo?.name || 'quà tặng',70);
    pushEvent('gift',evt,{
      giftName,quantity:Math.max(1,Math.min(10000,Number(evt?.repeatCount)||1)),
      giftId:trim(evt?.giftId || '',32)
    });
  });
  conn.on(WebcastEvent.MEMBER,evt=>{
    if(currentConnection!==conn)return;
    pushEvent('join',evt,{});
  });
  conn.on(WebcastEvent.STREAM_END,()=>{
    if(currentConnection!==conn)return;
    state='offline';roomId=null;connectedSince=null;
    console.log('Previous TikTok LIVE ended. Watching for the next LIVE.');
    planReconnect(12000);
  });
  conn.on(ControlEvent.ERROR,err=>{
    if(currentConnection!==conn)return;
    lastError=trim(err?.message||err,240);
    if(providerRateLimited(lastError))rateLimitUntil=Math.max(rateLimitUntil,Date.now()+60*60*1000);
    console.warn('TikTok connection reported an error:',lastError);
  });
  conn.on(ControlEvent.DISCONNECTED,()=>{
    if(currentConnection!==conn)return;
    state='disconnected';roomId=null;connectedSince=null;
    noteConnectionFailure(lastError);
    planReconnect(15000);
  });
  try{
    const connected=await conn.connect();
    if(currentConnection!==conn){try{await conn.disconnect()}catch{}return;}
    if(!conn.isConnected){
      state='disconnected';noteConnectionFailure(lastError);planReconnect(15000);return;
    }
    consecutiveFailures=0;rateLimitUntil=0;nextRetryAt=0;
    state='connected';roomId=trim(connected?.roomId||conn.roomId||'',80);
    connectedSince=Date.now();lastError='';lastRoomProbeError='';
    console.log('Connected to public TikTok LIVE @'+username);
  }catch(error){
    if(currentConnection!==conn)return;
    lastError=trim(error?.message||error,240);
    state=/offline|not.live|user.offline|room.is.not.live/i.test(lastError)?'offline':'error';
    roomId=null;connectedSince=null;
    console.warn('TikTok LIVE connection not ready:',lastError);
    noteConnectionFailure(lastError);
    planReconnect(state==='offline'?35000:45000);
  }
}
const allowedOrigins=new Set([
  'https://classroom-tiktok-live.vercel.app',
  'https://thanhtuan19972023-creator.github.io'
]);

const voiceRequests=new Map();
let voiceInFlight=0;
// Cache frequently repeated question and Japanese word clips for multiple
// Android/iPhone viewers; capped to avoid exhausting the free Render RAM.
const neuralSpeechCache=new Map();
// Public Edge Read Aloud neural voices are not an official paid API. The
// connection may be throttled or change; the browser has a local TTS fallback.
async function handleFreeNeuralVoice(req,res,headers){
  const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();
  const now=Date.now();
  const usage=voiceRequests.get(ip)||{start:now,count:0};
  if(now-usage.start>60000){usage.start=now;usage.count=0}
  usage.count++;
  voiceRequests.set(ip,usage);
  if(voiceRequests.size>500){
    for(const [addr,record] of voiceRequests)if(now-record.start>120000)voiceRequests.delete(addr);
  }
  if(usage.count>45){
    res.writeHead(429,headers);
    res.end(JSON.stringify({error:'Tạm quá nhiều lượt tạo giọng, chuyển sang giọng trên điện thoại.'}));
    return;
  }
  let raw='',size=0;
  try{
    for await(const chunk of req){
      size+=chunk.length;
      if(size>4500)throw new Error('input_too_large');
      raw+=chunk.toString('utf8');
    }
  }catch(e){
    res.writeHead(413,headers);res.end('{"error":"Nội dung quá dài"}');return;
  }
  let data;
  try{data=JSON.parse(raw)}catch(e){data={}}
  const speech=trim(data.text||'',390);
  // Select the native language for every Japanese word or sentence. Keep
  // Vietnamese narration on the existing review-film voices.
  const voice=data.voice==='japanese'?'ja-JP-NanamiNeural':
    data.voice==='japanese-male'?'ja-JP-KeitaNeural':
    data.voice==='female'?'vi-VN-HoaiMyNeural':'vi-VN-NamMinhNeural';
  if(!speech||speech.length>380||/[<>{}]/.test(speech)){
    res.writeHead(400,headers);
    res.end('{"error":"Nội dung đọc không hợp lệ hoặc quá dài"}');return;
  }
  const cacheKey=voice+'\u0000'+speech;
  const cached=neuralSpeechCache.get(cacheKey);
  if(cached){
    neuralSpeechCache.delete(cacheKey);neuralSpeechCache.set(cacheKey,cached);
    res.writeHead(200,{...headers,'Content-Type':'audio/mpeg',
      'Content-Length':cached.length,'Cache-Control':'no-store'});
    res.end(cached);
    return;
  }
  if(voiceInFlight>=4){
    res.writeHead(429,headers);
    res.end('{"error":"Máy chủ đang tạo nhiều đoạn giọng cùng lúc. Hãy thử lại sau."}');
    return;
  }
  voiceInFlight++;
  try{
    const engine=new EdgeTTS({timeout:20000});
    const result=await engine.generate(speech,voice,{
      rate:voice.startsWith('ja-JP-')?-4:voice==='vi-VN-NamMinhNeural'?14:9,
      pitch:voice.startsWith('ja-JP-')?0:voice==='vi-VN-NamMinhNeural'?-10:-3,
      volume:95,
      outputFormat:'audio-24khz-96kbitrate-mono-mp3'
    });
    const audio=Buffer.from(result.audio);
    if(audio.length<120||audio.length>1200000)throw new Error('empty_or_oversized_audio');
    neuralSpeechCache.set(cacheKey,audio);
    while(neuralSpeechCache.size>36)
      neuralSpeechCache.delete(neuralSpeechCache.keys().next().value);
    if(!res.writableEnded){
      res.writeHead(200,{...headers,'Content-Type':'audio/mpeg',
        'Content-Length':audio.length,'Cache-Control':'no-store'});
      res.end(audio);
    }
  }catch(e){
    console.warn('Free neural TTS unavailable:',String(e?.code||e?.message||e).slice(0,130));
    if(!res.writableEnded){
      res.writeHead(502,headers);
      res.end('{"error":"Giọng Neural miễn phí tạm gián đoạn. Game sẽ dùng giọng điện thoại."}');
    }
  }finally{voiceInFlight--}
}
function handler(req,res){
  const origin=trim(req.headers.origin||'',250);
  if(origin && !allowedOrigins.has(origin)){
    res.writeHead(403,{'Content-Type':'application/json; charset=utf-8'});
    res.end(JSON.stringify({error:'Website không được phép kết nối.'}));return;
  }
  const headers={
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options':'nosniff',
    'Vary':'Origin'
  };
  if(origin){
    headers['Access-Control-Allow-Origin']=origin;
    headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers']='Content-Type';
  }
  if(req.method==='OPTIONS'){
    res.writeHead(204,headers);res.end();return;
  }
  const url=new URL(req.url||'/', 'http://localhost');
  if(url.pathname==='/api/voice'){
    if(req.method!=='POST'){res.writeHead(405,headers);res.end('{"error":"POST only"}');return;}
    void handleFreeNeuralVoice(req,res,headers);return;
  }
  // The game's "Kết nối LIVE thật" button can recover a stuck previous room.
  // Require its approved browser origin and cap calls to once per 30 seconds.
  if(url.pathname==='/api/reconnect'){
    if(req.method!=='POST'){res.writeHead(405,headers);res.end('{"error":"POST only"}');return}
    if(!origin||!allowedOrigins.has(origin)){
      res.writeHead(403,headers);res.end('{"error":"Game origin required"}');return
    }
    if(!username){
      res.writeHead(503,headers);res.end('{"error":"TIKTOK_USERNAME not configured"}');return
    }
    if(Date.now()<rateLimitUntil){
      res.writeHead(429,headers);
      res.end(JSON.stringify({error:'TikTok đang giới hạn kết nối. Máy chủ sẽ tự thử lại sau.',retryAfterSeconds:Math.ceil((rateLimitUntil-Date.now())/1000)}));
      return
    }
    if(Date.now()-lastManualRestart<30000){
      res.writeHead(429,headers);res.end('{"error":"Reconnect cooldown active"}');return
    }
    lastManualRestart=Date.now();
    if(restartingConnection){
      res.writeHead(202,headers);res.end('{"ok":true,"state":"reconnecting"}');return
    }
    void restartConnection('game reconnect button');
    res.writeHead(202,headers);res.end('{"ok":true,"state":"reconnecting"}');return;
  }
  if(req.method!=='GET'){res.writeHead(405,headers);res.end('{"error":"GET only"}');return;}
  if(url.pathname==='/health' || url.pathname==='/'){
    res.writeHead(200,headers);
    res.end(JSON.stringify({service:'12A LIVE Bridge',...info()}));return;
  }
  if(url.pathname==='/api/status'){
    res.writeHead(200,headers);res.end(JSON.stringify(info()));return;
  }
  if(url.pathname==='/api/events'){
    const since=Math.max(0,Number(url.searchParams.get('after'))||0);
    const limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit'))||60));
    // Return the OLDEST unread events first. Taking the newest 100 was
    // silently dropping early correct answers when a wave of viewers joined.
    const events=eventHistory.filter(event=>event.id>since).slice(0,limit);
    res.writeHead(200,headers);res.end(JSON.stringify({
      instanceId,cursor:lastId,state,connected:state==='connected',events
    }));return;
  }
  res.writeHead(404,headers);res.end('{"error":"Not found"}');
}
http.createServer(handler).listen(port,'0.0.0.0',()=>{
  console.log('Lớp học vui vẻ 12A bridge ready on port',port,'username:',username?'@'+username:'not set');
  if(username)void connectLive();
});
function shutdown(){
  clearInterval(liveRoomMonitor);
  clearTimeout(reconnectTimer);
  if(currentConnection)void currentConnection.disconnect().catch(()=>{});
}
process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);
