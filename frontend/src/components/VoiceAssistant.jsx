import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import api, { setClerkTokenGetter } from '../api/api';

const VAPI_PUBLIC_KEY  = import.meta.env.VITE_VAPI_PUBLIC_KEY  || '';
const VAPI_BACKEND_URL = import.meta.env.VITE_VAPI_BACKEND_URL || window.location.origin;

export default function VoiceAssistant({ mode = 'dashboard', ticketId = '', ticketTitle = '' }) {
  const [callStatus, setCallStatus]     = useState('idle');
  const [isExpanded, setIsExpanded]     = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  const [lastSpeaker, setLastSpeaker]   = useState('');

  const vapiRef      = useRef(null);
  const { getToken } = useAuth();
  const { tenantSlug } = useTenant();

  /* ── Inject keyframes once ────────────────────────────────────────────── */
  useEffect(() => {
    const id = 'vapi-robot-styles-v2';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes robotHover  { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-10px) rotate(1.5deg)} }
      @keyframes robotBigHover { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      @keyframes glowBreath  { 0%,100%{opacity:.4;transform:scale(.95)} 50%{opacity:.9;transform:scale(1.05)} }
      @keyframes overlayIn   { from{opacity:0} to{opacity:1} }
      @keyframes popIn       { from{transform:scale(.25) translateY(120px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
      @keyframes subtitleIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes ripplePulse { 0%{box-shadow:0 0 0 0 rgba(99,202,255,.6)} 70%{box-shadow:0 0 0 20px rgba(99,202,255,0)} 100%{box-shadow:0 0 0 0 rgba(99,202,255,0)} }
      @keyframes waveBar     { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
      @keyframes dotBlink    { 0%,80%,100%{opacity:0} 40%{opacity:1} }
    `;
    document.head.appendChild(s);
  }, []);

  /* ── Init Vapi ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) return;
    let vapi = null;
    let dead = false;

    (async () => {
      try {
        setClerkTokenGetter(getToken);
        const { default: Vapi } = await import('@vapi-ai/web');
        if (dead) return;
        vapi = new Vapi(VAPI_PUBLIC_KEY);
        vapiRef.current = vapi;
        vapi.on('call-start',   () => { if (!dead) setCallStatus('active'); });
        vapi.on('call-end',     () => { if (!dead) { setCallStatus('idle'); setSubtitleText(''); setLastSpeaker(''); }});
        vapi.on('speech-start', () => { if (!dead) setCallStatus('speaking'); });
        vapi.on('speech-end',   () => { if (!dead) setCallStatus('active'); });
        vapi.on('message', msg => {
          if (!dead && msg.type === 'transcript') {
            setSubtitleText(msg.transcript);
            setLastSpeaker(msg.role === 'assistant' ? 'ai' : 'user');
          }
        });
        vapi.on('error', e => {
          if (dead) return;
          console.error('[VA] error', e);
          setCallStatus('error');
          setTimeout(() => { if (!dead) setCallStatus('idle'); }, 3000);
        });
      } catch (e) { if (!dead) setCallStatus('error'); }
    })();

    return () => { dead = true; try { vapi?.stop(); } catch (_) {} };
  }, [getToken]);  

  /* ── Start / stop ─────────────────────────────────────────────────────── */
  const startCall = async () => {
    setIsExpanded(true);
    setCallStatus('connecting');

    let slug = tenantSlug || '';
    if (!slug) { try { slug = (await api.get('/vapi/config')).data.tenantSlug || ''; } catch (_) {} }

    const systemPrompt = [
      'You are an AI voice assistant for a SaaS ticketing platform.',
      `tenant:${slug}`,
      'Help the admin understand their ticket queue and issues.',
      'Keep responses under 3 sentences.',
      'Never use markdown, bullet points, or special characters.',
      'Start the conversation by greeting the user and briefly summarizing their ticket status.',
    ].join('\n');

    try {
      await vapiRef.current.start({
        transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' },
        model: {
          provider: 'custom-llm',
          url: `${VAPI_BACKEND_URL}/api/vapi/llm`,
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }],
        },
        voice: { provider: 'openai', voiceId: 'alloy' },
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 300,
      });
    } catch (e) {
      console.error('[VA] start failed', e);
      setCallStatus('error');
      setIsExpanded(false);
      setTimeout(() => setCallStatus('idle'), 3000);
    }
  };

  const stopCall = () => {
    try { vapiRef.current?.stop(); } catch (_) {}
    setCallStatus('idle');
    setIsExpanded(false);
    setSubtitleText('');
    setLastSpeaker('');
  };

  const handleBubbleClick = () => {
    if (isExpanded) { stopCall(); return; }
    startCall();
  };

  const isLive     = ['active','speaking','connecting'].includes(callStatus);
  const isSpeaking = callStatus === 'speaking';
  const isConnecting = callStatus === 'connecting';

  /* ────────────────────────────────────────────────────────────── RENDER */
  return (
    <>
      {/* ═══ FULL-SCREEN MODAL ═══════════════════════════════════════════ */}
      {isExpanded && (
        <div style={{
          position:'fixed', inset:0, zIndex:9998,
          background:'rgba(2,4,20,.6)',
          backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
          animation:'overlayIn .3s ease',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            position:'relative',
            width:'90%', maxWidth:'480px',
            background:'linear-gradient(to bottom, rgba(15,23,42,.92), rgba(5,10,35,.98))',
            border:'1px solid rgba(139,92,246,0.3)',
            borderRadius:'28px',
            boxShadow:'0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15)',
            padding:'40px 24px',
            display:'flex', flexDirection:'column', alignItems:'center',
            overflow:'hidden'
          }}>
          {/* Background ambient orbs */}
          <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
            <div style={{position:'absolute',top:'20%',left:'30%',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle, rgba(99,202,255,.12) 0%, transparent 70%)',animation:'glowBreath 4s ease-in-out infinite'}} />
            <div style={{position:'absolute',bottom:'20%',right:'25%',width:'300px',height:'300px',borderRadius:'50%',background:'radial-gradient(circle, rgba(139,92,246,.08) 0%, transparent 70%)',animation:'glowBreath 5s ease-in-out infinite reverse'}} />
          </div>

          {/* ── Robot image — big, centered ── */}
          <div
            onClick={handleBubbleClick}
            style={{
              position:'relative', zIndex:1, cursor:'pointer',
              animation:'robotBigHover 3.5s ease-in-out infinite, popIn .5s cubic-bezier(.34,1.56,.64,1)',
              filter: isSpeaking
                ? 'drop-shadow(0 0 50px rgba(99,202,255,1)) drop-shadow(0 0 100px rgba(99,202,255,.6))'
                : 'drop-shadow(0 0 30px rgba(99,202,255,.7)) drop-shadow(0 0 60px rgba(99,202,255,.35))',
              transition:'filter .4s ease',
            }}
          >
            <img src="/ai_robot_avatar.png" alt="AI" style={{width:'220px',height:'220px',objectFit:'contain',userSelect:'none',pointerEvents:'none'}} />

            {/* wave bars at bottom */}
            {isSpeaking && (
              <div style={{position:'absolute',bottom:'-2px',left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'flex-end',gap:'3px'}}>
                {[.2,.5,.9,.5,.2,.7,.4,.2,.6].map((d,i) => (
                  <div key={i} style={{width:'4px',height:'24px',background:'linear-gradient(to top,#63caff,#c3efff)',borderRadius:'3px',animation:`waveBar .6s ${d*.12}s infinite ease-in-out`}} />
                ))}
              </div>
            )}
          </div>

          {/* Status pill */}
          <div style={{
            position:'relative',zIndex:1,marginTop:'20px',
            display:'flex',alignItems:'center',gap:'8px',
            padding:'7px 20px',borderRadius:'50px',
            background: isLive ? 'rgba(99,202,255,.12)' : 'rgba(255,255,255,.06)',
            border:`1px solid ${isLive ? 'rgba(99,202,255,.4)' : 'rgba(255,255,255,.1)'}`,
            color: isLive ? '#63caff' : 'rgba(255,255,255,.5)',
            fontSize:'12px',fontWeight:700,letterSpacing:'.08em',fontFamily:'system-ui,sans-serif',
          }}>
            {isConnecting && <span style={{display:'flex',gap:'3px'}}>{[0,.15,.3].map(d=><span key={d} style={{width:'5px',height:'5px',borderRadius:'50%',background:'#63caff',display:'inline-block',animation:`dotBlink 1.2s ${d}s infinite`}}/>)}</span>}
            {isLive && !isConnecting && <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#63caff',display:'inline-block',animation:'ripplePulse 1.5s infinite'}}/>}
            {isConnecting ? 'Connecting...' : isSpeaking ? 'Speaking...' : isLive ? 'Listening...' : 'Ready'}
          </div>

          {/* Subtitle card */}
          {subtitleText ? (
            <div key={subtitleText} style={{
              position:'relative',zIndex:1,marginTop:'28px',
              padding:'20px 32px',maxWidth:'580px',width:'88%',
              background:'rgba(255,255,255,.05)',
              border:'1px solid rgba(255,255,255,.1)',
              borderRadius:'20px',
              backdropFilter:'blur(12px)',
              animation:'subtitleIn .25s ease',
              textAlign:'center',fontFamily:'system-ui,sans-serif',
            }}>
              <div style={{fontSize:'10px',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:lastSpeaker==='ai'?'#63caff':'#a78bfa',marginBottom:'10px'}}>
                {lastSpeaker==='ai' ? '🤖  AI Assistant' : '🎤  You'}
              </div>
              <div style={{fontSize:'18px',fontWeight:500,color:'rgba(255,255,255,.93)',lineHeight:'1.65'}}>
                {subtitleText}
              </div>
            </div>
          ) : (
            <div style={{
              position:'relative',zIndex:1,marginTop:'28px',
              padding:'16px 32px',maxWidth:'400px',width:'88%',
              textAlign:'center',color:'rgba(255,255,255,.25)',
              fontSize:'14px',fontFamily:'system-ui,sans-serif',fontStyle:'italic',
            }}>
              {isConnecting ? 'Starting conversation…' : 'Speak to see subtitles here'}
            </div>
          )}

          {/* Stop button */}
          <button
            onClick={stopCall}
            style={{
              position:'relative',zIndex:1,marginTop:'32px',
              padding:'11px 32px',borderRadius:'50px',
              border:'1px solid rgba(255,255,255,.15)',
              background:'rgba(255,255,255,.07)',
              color:'rgba(255,255,255,.65)',
              fontSize:'14px',fontWeight:600,cursor:'pointer',
              fontFamily:'system-ui,sans-serif',transition:'all .2s ease',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,80,80,.2)';e.currentTarget.style.borderColor='rgba(255,100,100,.4)';e.currentTarget.style.color='#ff8888';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.07)';e.currentTarget.style.borderColor='rgba(255,255,255,.15)';e.currentTarget.style.color='rgba(255,255,255,.65)';}}
          >
            ✕ &nbsp; End Chat
          </button>
          </div>
        </div>
      )}

      {/* ═══ FLOATING BUBBLE (always visible when collapsed) ════════════ */}
      {!isExpanded && (
        <div
          title="Chat with AI"
          onClick={handleBubbleClick}
          style={{
            position:'fixed',bottom:'24px',right:'24px',zIndex:9999,
            width:'72px',height:'72px',
            borderRadius:'50%',
            overflow:'hidden',
            cursor:'pointer',
            animation:'robotHover 3.5s ease-in-out infinite',
            transition:'transform .2s ease',
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.12)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';}}
        >
          <img
            src="/ai_robot_avatar.png"
            alt="Ask AI"
            style={{width:'100%',height:'100%',objectFit:'cover',userSelect:'none',display:'block'}}
          />

          {/* Live indicator when call is active */}
          {isLive && (
            <div style={{
              position:'absolute',top:'4px',right:'4px',
              width:'12px',height:'12px',borderRadius:'50%',
              background:'#63caff',border:'2px solid rgba(0,0,0,.8)',
              animation:'ripplePulse 1.5s infinite',
            }}/>
          )}

          {/* "Ask AI" label */}
          <div style={{
            position:'absolute',bottom:'-22px',left:'50%',transform:'translateX(-50%)',
            whiteSpace:'nowrap',fontSize:'10px',fontWeight:800,letterSpacing:'.1em',
            color:'rgba(99,202,255,.9)',fontFamily:'system-ui,sans-serif',
            textTransform:'uppercase',pointerEvents:'none',
            textShadow:'0 0 12px rgba(99,202,255,.6)',
          }}>
            Ask AI
          </div>
        </div>
      )}
    </>
  );
}
