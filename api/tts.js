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
  if (req.method === 'GET') return res.status(200).json({ready:Boolean(process.env.ELEVENLABS_API_KEY),voice:'Duyên - cô giáo miền Nam',model:process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5'});
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
  // Duyên is the user-created female voice from ElevenLabs Voice Design.
  const duyenVoiceId = 'lfkZiOFuinB91hJ9s2uA'; // Selected user-created voice: Duyên.
  const oldTuyetVoiceId = 'xjyQliDr4k3i3iSr1wSb';
  const configuredVoiceId = process.env.ELEVENLABS_VOICE_ID;
  // Migrate automatically from the previous Tuyết voice in Vercel; a newly configured custom ID still takes priority.
  const voiceId = !configuredVoiceId || configuredVoiceId === oldTuyetVoiceId
    ? duyenVoiceId : configuredVoiceId;
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
      const code=response.status;
      let detailCode='';
      try{
        const result=await response.json();
        const detail=result?.detail;
        const rawCode=detail?.code || detail?.status || result?.code || '';
        // Only a narrow error identifier is returned. Never expose provider credentials or arbitrary error bodies.
        detailCode=typeof rawCode==='string' && /^[a-z0-9_-]{1,64}$/i.test(rawCode)?rawCode:'';
      }catch(e){}
      console.error('ElevenLabs TTS failure: status=%s code=%s',code,detailCode);
      let message='ElevenLabs chưa tạo được giọng đọc (mã '+code+').';
      if(code===400)message='Yêu cầu tạo giọng không hợp lệ (400). Kiểm tra cấu hình model và Voice ID.';
      else if(code===401)message='API Key ElevenLabs không hợp lệ (401).';
      else if(code===402)message='Không đủ credits hoặc gói ElevenLabs cần nâng cấp (402).';
      else if(code===403)message='ElevenLabs không cho tài khoản dùng giọng này qua API (403). Giọng trong Voice Library yêu cầu gói hỗ trợ API.';
      else if(code===404)message='Không tìm thấy hoặc không có quyền dùng giọng Duyên (404). Kiểm tra Voice ID trong My Voices.';
      else if(code===422)message='Cấu hình Voice ID hoặc model không hợp lệ (422).';
      else if(code===429)message='ElevenLabs giới hạn yêu cầu hoặc credits (429).';
      else if(code>=500)message='Máy chủ ElevenLabs hiện gặp lỗi ('+code+').';
      if(/free|subscription|payment|voice.*not.*available|plan|tier/i.test(detailCode))message='Gói ElevenLabs hiện không cho phép dùng giọng Tuyết qua API. Kiểm tra quyền API Text to Speech, gói hiện tại và Voice ID.';
      if(detailCode)message+=' Mã: '+detailCode+'.';
      return res.status(code===429?429:502).json({error:message,provider_status:code,provider_code:detailCode||undefined});
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
