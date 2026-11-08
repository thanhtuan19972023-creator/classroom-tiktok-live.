// Lớp học vui vẻ 12A — TikTok LIVE event bridge.
// TikTok-Live-Connector is an unofficial project. Public LIVE only; NO login cookies.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

const username = String(process.env.TIKTOK_USERNAME || '').trim().replace(/^@/, '').toLowerCase();
const port = Number(process.env.PORT || 10000);
const instanceId = randomUUID();
const eventHistory = [];
const recentMessageIds = new Map();
const maxEvents = 350;
let lastId = 0, state = username ? 'starting' : 'not_configured';
let currentConnection = null, reconnectTimer = null, lastError = '';
let connectedSince = null, lastEventAt = null, roomId = null;

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
    time:Date.now()
  };
}
function planReconnect(waitMs=30000) {
  if(!username || reconnectTimer)return;
  reconnectTimer=setTimeout(()=>{reconnectTimer=null;void connectLive()},waitMs);
  reconnectTimer.unref?.();
}
async function connectLive() {
  if(!username || state==='connecting' || state==='connected')return;
  state='connecting';lastError='';
  // A fresh socket is used for each retry. Only messages received after connection count.
  const conn=new TikTokLiveConnection(username,{
    processInitialData:false,
    fetchRoomInfoOnConnect:true,
    enableExtendedGiftInfo:false
  });
  currentConnection=conn;
  conn.on(WebcastEvent.CHAT, evt=>{
    pushEvent('comment',evt,{comment:trim(evt.content || evt.comment || '',180)});
  });
  conn.on(WebcastEvent.GIFT, evt=>{
    // Streak messages carry cumulative totals; do NOT count every intermediate update.
    if(evt?.gift?.type===1 && Number(evt.repeatEnd)!==1)return;
    const giftName=trim(evt?.gift?.name || evt?.extendedGiftInfo?.name || 'quà tặng',70);
    pushEvent('gift',evt,{
      giftName,quantity:Math.max(1,Math.min(10000,Number(evt?.repeatCount)||1)),
      giftId:trim(evt?.giftId || '',32)
    });
  });
  conn.on(WebcastEvent.MEMBER,evt=>{
    pushEvent('join',evt,{});
  });
  conn.on(ControlEvent.ERROR,err=>{
    lastError=trim(err?.message||err,240);
    console.warn('TikTok connection reported an error:',lastError);
  });
  conn.on(ControlEvent.DISCONNECTED,()=>{
    if(currentConnection!==conn)return;
    state='disconnected';roomId=null;connectedSince=null;
    planReconnect(20000);
  });
  try{
    const connected=await conn.connect();
    if(currentConnection!==conn){try{await conn.disconnect()}catch{}return;}
    state='connected';roomId=trim(connected?.roomId||conn.roomId||'',80);
    connectedSince=Date.now();lastError='';
    console.log('Connected to public TikTok LIVE @'+username);
  }catch(error){
    if(currentConnection!==conn)return;
    lastError=trim(error?.message||error,240);
    state=/offline|not.live|user.offline|room.is.not.live/i.test(lastError)?'offline':'error';
    roomId=null;connectedSince=null;
    console.warn('TikTok LIVE connection not ready:',lastError);
    planReconnect(state==='offline'?35000:45000);
  }
}
const allowedOrigins=new Set([
  'https://classroom-tiktok-live.vercel.app',
  'https://thanhtuan19972023-creator.github.io'
]);
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
    headers['Access-Control-Allow-Methods']='GET, OPTIONS';
    headers['Access-Control-Allow-Headers']='Content-Type';
  }
  if(req.method==='OPTIONS'){
    res.writeHead(204,headers);res.end();return;
  }
  if(req.method!=='GET'){res.writeHead(405,headers);res.end('{"error":"GET only"}');return;}
  const url=new URL(req.url||'/', 'http://localhost');
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
    const events=eventHistory.filter(event=>event.id>since).slice(-limit);
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
  clearTimeout(reconnectTimer);
  if(currentConnection)void currentConnection.disconnect().catch(()=>{});
}
process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);
