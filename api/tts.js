// Optional ElevenLabs TTS backend. Deploy with Vercel; never place the API key in browser code.
const windows = new Map();
function cors(origin, request){
  const host = String(request.headers.host || '').toLowerCase();
  const allowed = ['https://thanhtuan19972023-creator.github.io', 'https://' + host];
  if (process.env.ALLOWED_TTS_ORIGIN) allowed.push(process.env.ALLOWED_TTS_ORIGIN);
  if (origin && !allowed.includes(origin)) return false;
  return true;
}
export default async function handler(req, res){
  const origin = String(req.headers.origin || '');
  if (!cors(origin, req)) return res.status(403).json({error:'Origin not permitted'});
  res.setHeader('Access-Control-Allow-Origin', origin || 'https://thanhtuan19972023-creator.github.io');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return res.status(200).json({ready:Boolean(process.env.ELEVENLABS_API_KEY),voice:'Tuyết - miền Nam',model:process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5'});
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (!process.env.ELEVENLABS_API_KEY)
    return res.status(503).json({error:'AI voice has not been configured'});
  let body = req.body || {};
  if (typeof body === 'string') {try {body = JSON.parse(body)} catch {return res.status(400).json({error:'Invalid JSON'})}}
  const input = String(body.text || '').trim();
  if (!input || input.length > 450) return res.status(400).json({error:'Text must have 1-450 characters'});
  // Best-effort per-instance limit; also set a hard credit quota on the ElevenLabs key.
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  if (windows.size > 1000) for (const [id, v] of windows) if (now-v.at > 60000) windows.delete(id);
  const record = windows.get(ip) || {at: now,count:0};
  if (now - record.at >= 60000) {record.at=now;record.count=0}
  record.count++;windows.set(ip,record);
  if (record.count > 12) return res.status(429).json({error:'Rate limit reached'});
  const model = process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5';
  // Tuyet - Southern Vietnamese Storyteller (public ElevenLabs library voice).
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'xjyQliDr4k3i3iSr1wSb';
  try{
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' +
      encodeURIComponent(voiceId) + '?output_format=mp3_44100_128', {
      method:'POST',
      headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({
        text:input,
        model_id:model,
        language_code:'vi',
        voice_settings:{stability:0.46,similarity_boost:0.76,style:0.28,use_speaker_boost:true}
      }),
      signal:AbortSignal.timeout(15000)
    });
    if(!response.ok){
      const details=await response.text();
      console.error('TTS provider error',response.status,details.slice(0,160));
      return res.status(response.status===429?429:502).json({error:'Voice provider unavailable'});
    }
    const audio=Buffer.from(await response.arrayBuffer());
    if(audio.length > 4000000) return res.status(502).json({error:'Audio too large'});
    res.setHeader('Content-Type','audio/mpeg');
    return res.status(200).send(audio);
  }catch(error){
    console.error('TTS error',String(error));
    return res.status(502).json({error:'Could not generate audio'});
  }
}
