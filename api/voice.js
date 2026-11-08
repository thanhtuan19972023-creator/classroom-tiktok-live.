// Backup Vietnamese/Japanese neural voice endpoint for Vercel.
// The main Render bridge remains primary. No API keys or TikTok credentials are used.
import { EdgeTTS } from '@andresaya/edge-tts';

const VOICES={
  male:'vi-VN-NamMinhNeural',
  female:'vi-VN-HoaiMyNeural',
  japanese:'ja-JP-NanamiNeural',
  'japanese-male':'ja-JP-KeitaNeural'
};
const recentRequests=new Map();
let inFlight=0;
function trim(value,max){return String(value??'').trim().slice(0,max)}
function error(res,status,message){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  return res.end(JSON.stringify({error:message}));
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='GET')return error(res,200,'Voice backup ready; use POST to generate speech.');
  if(req.method!=='POST')return error(res,405,'POST only');
  const origin=String(req.headers.origin||'');
  const host=String(req.headers.host||'');
  if(origin){
    let parsed;
    try{parsed=new URL(origin)}catch{return error(res,403,'Invalid origin')}
    if(parsed.host!==host||parsed.protocol!=='https:')return error(res,403,'Origin not allowed');
  }
  const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0].trim().slice(0,100);
  const now=Date.now();
  const record=recentRequests.get(ip)||{start:now,count:0};
  if(now-record.start>60000){record.start=now;record.count=0}
  record.count++;
  recentRequests.set(ip,record);
  if(recentRequests.size>250){
    for(const [key,value] of recentRequests)if(now-value.start>120000)recentRequests.delete(key);
  }
  if(record.count>25)return error(res,429,'Too many voice requests');
  if(inFlight>=3)return error(res,429,'Voice backup is busy');
  let body=req.body;
  if(typeof body==='string'){try{body=JSON.parse(body)}catch{body={}}}
  const speech=trim(body?.text||'',390),voice=VOICES[body?.voice];
  if(!voice||!speech||speech.length>380||/[<>{}]/.test(speech))
    return error(res,400,'Invalid voice or text');
  inFlight++;
  const controller=new AbortController();
  const deadline=setTimeout(()=>controller.abort(),17000);
  try{
    const engine=new EdgeTTS({timeout:14500});
    const result=await engine.generate(speech,voice,{
      rate:voice.startsWith('ja-')?-4:voice==='vi-VN-NamMinhNeural'?14:9,
      pitch:voice.startsWith('ja-')?0:voice==='vi-VN-NamMinhNeural'?-10:-3,
      volume:95,
      outputFormat:'audio-24khz-96kbitrate-mono-mp3',
      signal:controller.signal,
      timeout:14500
    });
    const audio=Buffer.from(result.audio);
    if(audio.length<120||audio.length>1200000)throw new Error('NO_AUDIO');
    res.statusCode=200;
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Content-Length',String(audio.length));
    return res.end(audio);
  }catch(e){
    console.warn('Vercel neural voice backup failed:',String(e?.code||e?.name||'error').slice(0,50));
    return error(res,502,'Voice backup unavailable; use device Vietnamese voice.');
  }finally{clearTimeout(deadline);inFlight--}
}
