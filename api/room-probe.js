// Independent, non-invasive diagnostic: can Vercel's egress read the PUBLIC
// TikTok LIVE page when the Render bridge gets HTTP 403?
// One fixed creator only; never accepts arbitrary URLs or user credentials.
// Not a replacement for the LIVE WebSocket or a bypass of sign API requirements.
const CREATOR='con5doiten';
const TIMEOUT=8500;
const PUBLIC_LIVE_URL='https://www.tiktok.com/@'+CREATOR+'/live';
function pickRoomId(source){
 if(typeof source!=='string')return '';
 const signals=[
  /["']roomId["']\s*:\s*["'](\d{15,25})["']/g,
  /["']room_id["']\s*:\s*["'](\d{15,25})["']/g,
  /\bliveRoom\b.{0,150}\broomId\b["']?\s*:\s*["'](\d{15,25})/g
 ];
 for(const pat of signals){
  const matches=[...source.matchAll(pat)];
  const valid=matches.map(m=>m[1]).filter(Boolean);
  if(valid.length)return valid[0];
 }
 return '';
}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','public,s-maxage=90,stale-while-revalidate=120');
 if(req.method!=='GET'){
  res.statusCode=405;return res.end(JSON.stringify({error:'GET only'}));
 }
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),TIMEOUT);
 let output={creator:'@'+CREATOR,source:'Vercel -> public TikTok LIVE page',
  checkedAt:new Date().toISOString(),roomId:null,connected:false};
 try{
  const response=await fetch(PUBLIC_LIVE_URL,{
   redirect:'follow',signal:controller.signal,
   headers:{
    'accept':'text/html,application/xhtml+xml',
    'accept-language':'vi-VN,vi;q=0.9,en-US;q=0.7',
    'user-agent':'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36'
   }
  });
  output.status=response.status;
  output.finalHost=new URL(response.url).hostname;
  if(response.ok){
   const html=(await response.text()).slice(0,1500000);
   const id=pickRoomId(html);
   output.roomId=id||null;
   output.reason=id?'ROOM_ID_FOUND':'PUBLIC_HTML_HAS_NO_ROOM_ID';
  }else{
   output.reason=response.status===403?'TIKTOK_HTTP_403':response.status===429?'TIKTOK_HTTP_429':'TIKTOK_HTTP_'+response.status;
  }
 }catch(e){
  output.reason=e?.name==='AbortError'?'TIMEOUT':'NETWORK_ERROR';
 }finally{clearTimeout(timeout)}
 res.statusCode=200;
 return res.end(JSON.stringify(output));
}
