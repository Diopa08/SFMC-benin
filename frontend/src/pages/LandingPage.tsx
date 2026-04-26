import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 4)
      setVal(Math.floor(ease * target))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setVal(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])
  return val
}

const FEATURES = [
  {
    num: '01', color: '#C89520',
    title: 'Commandes',
    desc: 'Créez et suivez chaque commande client en temps réel. De la réception à la livraison.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:26,height:26}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/></svg>
  },
  {
    num: '02', color: '#3b82f6',
    title: 'Production',
    desc: 'Pilotez chaque lot de fabrication. Planification, démarrage et suivi en temps réel.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:26,height:26}}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/></svg>
  },
  {
    num: '03', color: '#22c55e',
    title: 'Inventaire',
    desc: 'Stock en temps réel par entrepôt. Alertes automatiques avant toute rupture critique.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:26,height:26}}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
  },
  {
    num: '04', color: '#a855f7',
    title: 'Facturation',
    desc: 'Factures générées automatiquement à la validation. Suivi des paiements intégré.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:26,height:26}}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
  },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const statsRef = useRef<HTMLDivElement>(null)
  const [statsOn, setStatsOn] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const [featVisible, setFeatVisible] = useState([false,false,false,false])
  const featRefs = useRef<(HTMLDivElement|null)[]>([])
  const [heroLoaded, setHeroLoaded] = useState(false)

  useEffect(() => { if (isAuthenticated) navigate('/dashboard') }, [isAuthenticated, navigate])
  useEffect(() => { const t = setTimeout(() => setHeroLoaded(true), 80); return () => clearTimeout(t) }, [])
  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsOn(true) }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    const obs = featRefs.current.map((el, i) => {
      if (!el) return null
      const o = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) setFeatVisible(p => { const n=[...p]; n[i]=true; return n })
      }, { threshold: 0.15 })
      o.observe(el); return o
    })
    return () => obs.forEach(o => o?.disconnect())
  }, [])

  const c0 = useCountUp(500, statsOn)
  const c1 = useCountUp(4,   statsOn, 800)
  const c2 = useCountUp(100, statsOn)
  const c3 = useCountUp(24,  statsOn, 1000)

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}

        /* ── NAV ── */
        .n{position:fixed;top:0;left:0;right:0;z-index:100;padding:1.6rem 4rem;display:flex;align-items:center;justify-content:space-between;transition:all .35s}
        .n.s{background:rgba(10,10,10,.92);padding:1rem 4rem;border-bottom:1px solid rgba(255,255,255,.06);backdrop-filter:blur(16px)}
        .n-logo{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.15em;color:#fff;cursor:pointer}
        .n-logo b{color:#C89520}
        .n-links{display:flex;align-items:center;gap:3rem}
        .n-link{font-family:'Barlow',sans-serif;font-size:.75rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.4);background:none;border:none;cursor:pointer;transition:color .2s}
        .n-link:hover{color:#fff}
        .n-cta{font-family:'Barlow',sans-serif;font-size:.73rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#111;background:#C89520;border:none;padding:.6rem 1.8rem;cursor:pointer;transition:all .2s}
        .n-cta:hover{background:#d4a030;transform:translateY(-1px)}

        /* ── HERO ── */
        .h{min-height:100vh;background:#0a0a0a;display:grid;grid-template-columns:55% 45%;position:relative;overflow:hidden}
        .h-left{display:flex;flex-direction:column;justify-content:center;padding:9rem 3rem 6rem 6rem;position:relative;z-index:2}
        .h-tag{display:inline-flex;align-items:center;gap:.7rem;font-family:'Barlow',sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#C89520;margin-bottom:2.2rem;opacity:0;transform:translateY(12px);transition:opacity .7s,transform .7s}
        .h-tag.in{opacity:1;transform:translateY(0)}
        .h-tag::before{content:'';width:24px;height:1px;background:#C89520;flex-shrink:0}
        .h-title{font-family:'Bebas Neue',sans-serif;line-height:.92;letter-spacing:.01em;opacity:0;transform:translateY(20px);transition:opacity .8s .1s,transform .8s .1s}
        .h-title.in{opacity:1;transform:translateY(0)}
        .h-t1{font-size:clamp(4.5rem,8.5vw,8rem);color:#fff;display:block}
        .h-t2{font-size:clamp(4.5rem,8.5vw,8rem);color:#C89520;display:block}
        .h-t3{font-size:clamp(4.5rem,8.5vw,8rem);color:rgba(255,255,255,.15);display:block}
        .h-sub{font-family:'Barlow',sans-serif;font-size:.95rem;font-weight:300;color:rgba(255,255,255,.55);line-height:1.8;margin-top:2rem;max-width:400px;opacity:0;transform:translateY(16px);transition:opacity .8s .25s,transform .8s .25s}
        .h-sub.in{opacity:1;transform:translateY(0)}
        .h-actions{display:flex;align-items:center;gap:1.8rem;margin-top:3rem;opacity:0;transform:translateY(16px);transition:opacity .8s .4s,transform .8s .4s}
        .h-actions.in{opacity:1;transform:translateY(0)}
        .btn-main{font-family:'Barlow',sans-serif;font-size:.78rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#111;background:#C89520;border:2px solid #C89520;padding:1rem 2.8rem;cursor:pointer;transition:all .2s}
        .btn-main:hover{background:transparent;color:#C89520;transform:translateY(-2px)}
        .btn-ghost{font-family:'Barlow',sans-serif;font-size:.75rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.35);background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:.5rem;transition:color .2s}
        .btn-ghost:hover{color:#fff}
        .h-scroll{position:absolute;bottom:3rem;left:6rem;display:flex;align-items:center;gap:.8rem;font-family:'Barlow',sans-serif;font-size:.65rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.2);opacity:0;transition:opacity .8s .8s}
        .h-scroll.in{opacity:1}
        .h-scroll-line{width:1px;height:40px;background:linear-gradient(to bottom,rgba(200,149,32,0),#C89520);animation:scrollpulse 2s infinite}
        @keyframes scrollpulse{0%,100%{transform:scaleY(1);opacity:.6}50%{transform:scaleY(1.3);opacity:1}}

        /* ── HERO RIGHT ── */
        .h-right{position:relative;background:#060606;overflow:hidden}
        .h-right::before{content:'';position:absolute;inset:0;background:
          radial-gradient(ellipse 70% 60% at 60% 40%,rgba(200,149,32,.07) 0%,transparent 65%),
          repeating-linear-gradient(0deg,transparent,transparent 47px,rgba(200,149,32,.05) 47px,rgba(200,149,32,.05) 48px),
          repeating-linear-gradient(90deg,transparent,transparent 47px,rgba(200,149,32,.05) 47px,rgba(200,149,32,.05) 48px)}
        .h-right-svg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:4rem 3rem}
        .h-badge{position:absolute;top:2.5rem;right:2.5rem;display:flex;align-items:center;gap:.5rem}
        .h-badge-dot{width:6px;height:6px;border-radius:50%;background:#C89520;animation:ping 2s infinite}
        @keyframes ping{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(200,149,32,.6)}70%{opacity:.6;box-shadow:0 0 0 8px rgba(200,149,32,0)}}
        .h-badge-text{font-family:'Barlow',sans-serif;font-size:.62rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.25)}
        .h-foot{position:absolute;bottom:2.5rem;left:2.5rem;right:2.5rem;border-top:1px solid rgba(255,255,255,.06);padding-top:1rem;font-family:'Barlow',sans-serif;font-size:.62rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.18)}
        @keyframes draw{to{stroke-dashoffset:0}}
        .dl{stroke-dasharray:800;stroke-dashoffset:800;animation:draw 3s ease forwards}
        .dl2{stroke-dasharray:500;stroke-dashoffset:500;animation:draw 2.5s .3s ease forwards}
        .dl3{stroke-dasharray:300;stroke-dashoffset:300;animation:draw 2s .6s ease forwards}
        .df{opacity:0;animation:fadeIn .8s 1.5s ease forwards}
        @keyframes fadeIn{to{opacity:1}}

        /* ── STATS ── */
        .st{background:#fff;display:grid;grid-template-columns:repeat(4,1fr)}
        .st-item{padding:3.5rem 2.5rem;border-right:1px solid #f0ede8;position:relative;overflow:hidden}
        .st-item:last-child{border-right:none}
        .st-item::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;transform:scaleX(0);transform-origin:left;transition:transform .6s ease}
        .st-item:nth-child(1)::after{background:#C89520}
        .st-item:nth-child(2)::after{background:#3b82f6}
        .st-item:nth-child(3)::after{background:#22c55e}
        .st-item:nth-child(4)::after{background:#a855f7}
        .st-item.on::after{transform:scaleX(1)}
        .st-n{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,4.5vw,4.5rem);color:#111;line-height:1}
        .st-n b{color:inherit;font:inherit}
        .st-l{font-family:'Barlow',sans-serif;font-size:.7rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#999;margin-top:.5rem}

        /* ── FEATURES ── */
        .ft{background:#0d0d0d;padding:7rem 6rem}
        .ft-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:5rem;gap:2rem}
        .ft-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.8rem,4vw,4.2rem);color:#fff;letter-spacing:.03em;line-height:1}
        .ft-title span{color:#C89520}
        .ft-hint{font-family:'Barlow',sans-serif;font-size:.82rem;font-weight:300;color:rgba(255,255,255,.3);max-width:260px;text-align:right;line-height:1.8}
        .ft-grid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(255,255,255,.07)}
        .ft-card{padding:2.8rem 2rem;border-right:1px solid rgba(255,255,255,.07);opacity:0;transform:translateY(28px);transition:opacity .65s,transform .65s,background .25s}
        .ft-card:last-child{border-right:none}
        .ft-card.vis{opacity:1;transform:translateY(0)}
        .ft-card:nth-child(2){transition-delay:.1s}
        .ft-card:nth-child(3){transition-delay:.2s}
        .ft-card:nth-child(4){transition-delay:.3s}
        .ft-card:hover{background:rgba(255,255,255,.025)}
        .ft-num{font-family:'Bebas Neue',sans-serif;font-size:4rem;line-height:1;color:rgba(255,255,255,.06);margin-bottom:.8rem}
        .ft-bar{height:2px;width:36px;margin-bottom:1.4rem;border-radius:1px}
        .ft-ico{margin-bottom:1.2rem}
        .ft-name{font-family:'Barlow',sans-serif;font-size:.95rem;font-weight:700;color:#fff;margin-bottom:.7rem;letter-spacing:.03em}
        .ft-desc{font-family:'Barlow',sans-serif;font-size:.8rem;font-weight:300;color:rgba(255,255,255,.45);line-height:1.75}

        /* ── PROCESS ── */
        .pr{background:#f7f4ef;padding:7rem 6rem}
        .pr-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,3.5vw,3.8rem);color:#111;letter-spacing:.03em;margin-bottom:4rem;text-align:center}
        .pr-title span{color:#C89520}
        .pr-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:3rem;position:relative}
        .pr-steps::before{content:'';position:absolute;top:2.2rem;left:calc(16.66% + 2rem);right:calc(16.66% + 2rem);height:1px;background:linear-gradient(to right,#C89520,rgba(200,149,32,.3),rgba(200,149,32,.1))}
        .pr-step{text-align:center}
        .pr-step-circle{width:44px;height:44px;border:2px solid #C89520;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-family:'Bebas Neue',sans-serif;font-size:1.1rem;color:#C89520;background:#f7f4ef;position:relative;z-index:1}
        .pr-step-title{font-family:'Barlow',sans-serif;font-size:.85rem;font-weight:700;color:#111;letter-spacing:.05em;margin-bottom:.5rem}
        .pr-step-desc{font-family:'Barlow',sans-serif;font-size:.78rem;font-weight:400;color:#888;line-height:1.7}

        /* ── CTA ── */
        .ct{background:#111;padding:6rem;display:flex;align-items:center;justify-content:space-between;gap:3rem;border-top:1px solid rgba(200,149,32,.2);position:relative;overflow:hidden}
        .ct::before{content:'SFMC';font-family:'Bebas Neue',sans-serif;font-size:18rem;color:rgba(255,255,255,.015);position:absolute;right:-2rem;top:50%;transform:translateY(-50%);letter-spacing:.05em;pointer-events:none;line-height:1}
        .ct-left h2{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,4vw,4rem);color:#fff;letter-spacing:.03em;line-height:1}
        .ct-left h2 span{color:#C89520}
        .ct-left p{font-family:'Barlow',sans-serif;font-size:.88rem;font-weight:300;color:rgba(255,255,255,.4);margin-top:.8rem;line-height:1.7}
        .ct-btn{font-family:'Barlow',sans-serif;font-size:.78rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#111;background:#C89520;border:2px solid #C89520;padding:1.1rem 3rem;cursor:pointer;white-space:nowrap;transition:all .2s;flex-shrink:0}
        .ct-btn:hover{background:transparent;color:#C89520;transform:translateY(-2px)}

        /* ── FOOTER ── */
        .fo{background:#080808;padding:2.5rem 6rem;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,.05)}
        .fo-logo{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:.15em;color:rgba(255,255,255,.25)}
        .fo-logo b{color:#C89520}
        .fo-copy{font-family:'Barlow',sans-serif;font-size:.68rem;color:rgba(255,255,255,.18);letter-spacing:.1em}

        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .h{grid-template-columns:1fr}.h-right{display:none}
          .h-left{padding:8rem 2rem 4rem}.h-scroll{left:2rem}
          .n{padding:1.2rem 1.5rem}.n.s{padding:.8rem 1.5rem}
          .n-links{gap:1.5rem}
          .st{grid-template-columns:1fr 1fr}
          .st-item{border-bottom:1px solid #f0ede8}
          .ft{padding:4rem 2rem}.ft-grid{grid-template-columns:1fr 1fr}
          .ft-head{flex-direction:column;align-items:flex-start}
          .ft-hint{text-align:left;max-width:100%}
          .ft-card:nth-child(2){border-right:none}.ft-card:nth-child(3){border-right:1px solid rgba(255,255,255,.07)}
          .pr{padding:4rem 2rem}.pr-steps{grid-template-columns:1fr}.pr-steps::before{display:none}
          .ct{flex-direction:column;padding:4rem 2rem;text-align:center}
          .fo{flex-direction:column;gap:.8rem;padding:2rem}
        }
      `}</style>

      {/* NAV */}
      <nav className={`n${navScrolled?' s':''}`}>
        <div className="n-logo" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          SFMC <b>·</b> BÉNIN
        </div>
        <div className="n-links">
          <button className="n-link" onClick={() => scrollTo('modules')}>Modules</button>
          <button className="n-link" onClick={() => scrollTo('process')}>Processus</button>
          <button className="n-cta" onClick={() => navigate('/login')}>Connexion</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="h">
        <div className="h-left">
          <div className={`h-tag${heroLoaded?' in':''}`}>Plateforme de gestion industrielle</div>
          <div className={`h-title${heroLoaded?' in':''}`}>
            <span className="h-t1">Gérez</span>
            <span className="h-t2">Tout.</span>
            <span className="h-t3">Ici.</span>
          </div>
          <p className={`h-sub${heroLoaded?' in':''}`}>
            Commandes, production, inventaire et facturation — centralisés dans une seule plateforme pensée pour SFMC Bénin.
          </p>
          <div className={`h-actions${heroLoaded?' in':''}`}>
            <button className="btn-main" onClick={() => navigate('/login')}>
              Accéder à la plateforme
            </button>
            <button className="btn-ghost" onClick={() => scrollTo('modules')}>
              Découvrir
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:13,height:13}}>
                <path d="M8 3v10M3 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className={`h-scroll${heroLoaded?' in':''}`}>
            <div className="h-scroll-line"/>
            <span>Défiler</span>
          </div>
        </div>

        <div className="h-right">
          <div className="h-badge">
            <div className="h-badge-dot"/>
            <span className="h-badge-text">Système actif</span>
          </div>
          <div className="h-right-svg">
            <svg viewBox="0 0 460 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:460}}>
              {/* Main factory building */}
              <rect x="60" y="180" width="200" height="180" fill="rgba(200,149,32,.04)" stroke="rgba(200,149,32,.7)" strokeWidth="1.5" className="dl"/>
              {/* Roof line */}
              <path d="M60 180 L160 120 L260 180" fill="rgba(200,149,32,.03)" stroke="rgba(200,149,32,.5)" strokeWidth="1.5" className="dl2"/>
              {/* Windows row 1 */}
              {[0,1,2].map(i=><rect key={i} x={82+i*60} y={200} width={36} height={30} fill="none" stroke="rgba(200,149,32,.35)" strokeWidth="1" className="df"/>)}
              {/* Windows row 2 */}
              {[0,1,2].map(i=><rect key={i} x={82+i*60} y={248} width={36} height={30} fill="none" stroke="rgba(200,149,32,.25)" strokeWidth="1" className="df"/>)}
              {/* Door */}
              <rect x="136" y="300" width="48" height="60" fill="rgba(200,149,32,.06)" stroke="rgba(200,149,32,.45)" strokeWidth="1" className="df"/>
              <line x1="160" y1="300" x2="160" y2="360" stroke="rgba(200,149,32,.2)" strokeWidth="1" className="df"/>

              {/* Chimney */}
              <rect x="230" y="120" width="18" height="62" fill="rgba(200,149,32,.04)" stroke="rgba(200,149,32,.6)" strokeWidth="1.2" className="dl2"/>
              {/* Smoke trails */}
              <path d="M239 118 Q233 98 240 80 Q246 64 238 50" stroke="rgba(200,149,32,.2)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M233 118 Q224 96 231 76 Q237 58 229 44" stroke="rgba(200,149,32,.12)" strokeWidth="1" fill="none" strokeLinecap="round"/>

              {/* Side warehouse */}
              <rect x="276" y="220" width="130" height="140" fill="rgba(200,149,32,.03)" stroke="rgba(200,149,32,.5)" strokeWidth="1.2" className="dl2"/>
              <path d="M276 220 L341 175 L406 220" fill="none" stroke="rgba(200,149,32,.4)" strokeWidth="1.2" className="dl3"/>
              {[0,1].map(i=><rect key={i} x={296+i*56} y={238} width={34} height={28} fill="none" stroke="rgba(200,149,32,.22)" strokeWidth="1" className="df"/>)}
              <rect x="296" y="284" width="34" height={28} fill="none" stroke="rgba(200,149,32,.22)" strokeWidth="1" className="df"/>
              <rect x="352" y="284" width="34" height={28} fill="none" stroke="rgba(200,149,32,.22)" strokeWidth="1" className="df"/>

              {/* Crane vertical */}
              <line x1="390" y1="60" x2="390" y2="220" stroke="rgba(200,149,32,.5)" strokeWidth="2" strokeLinecap="round" className="dl"/>
              {/* Crane horizontal */}
              <line x1="310" y1="60" x2="420" y2="60" stroke="rgba(200,149,32,.5)" strokeWidth="2" strokeLinecap="round" className="dl2"/>
              {/* Crane cable */}
              <line x1="340" y1="60" x2="340" y2="100" stroke="rgba(200,149,32,.3)" strokeWidth="1.5" strokeDasharray="4 3" className="df"/>
              {/* Hook */}
              <path d="M337 100 Q337 112 341 114 Q345 116 344 108" stroke="rgba(200,149,32,.4)" strokeWidth="1.2" fill="none" className="df"/>
              {/* Crane base */}
              <rect x="383" y="220" width="14" height="140" fill="rgba(200,149,32,.05)" stroke="rgba(200,149,32,.3)" strokeWidth="1" className="df"/>

              {/* Ground */}
              <line x1="30" y1="360" x2="430" y2="360" stroke="rgba(200,149,32,.2)" strokeWidth="1"/>
              {/* Ground shadow */}
              <line x1="60" y1="365" x2="260" y2="365" stroke="rgba(200,149,32,.08)" strokeWidth="3"/>
              <line x1="276" y1="365" x2="406" y2="365" stroke="rgba(200,149,32,.08)" strokeWidth="2"/>

              {/* Dimension lines */}
              <line x1="40" y1="178" x2="40" y2="362" stroke="rgba(200,149,32,.15)" strokeWidth="1" strokeDasharray="3 4"/>
              <line x1="35" y1="180" x2="45" y2="180" stroke="rgba(200,149,32,.3)" strokeWidth="1"/>
              <line x1="35" y1="360" x2="45" y2="360" stroke="rgba(200,149,32,.3)" strokeWidth="1"/>
              <text x="26" y="275" fill="rgba(200,149,32,.25)" fontSize="7.5" fontFamily="monospace" transform="rotate(-90,26,275)">15.0 m</text>
              <line x1="60" y1="168" x2="260" y2="168" stroke="rgba(200,149,32,.15)" strokeWidth="1" strokeDasharray="3 4"/>
              <line x1="60" y1="163" x2="60" y2="173" stroke="rgba(200,149,32,.3)" strokeWidth="1"/>
              <line x1="260" y1="163" x2="260" y2="173" stroke="rgba(200,149,32,.3)" strokeWidth="1"/>
              <text x="155" y="163" fill="rgba(200,149,32,.25)" fontSize="7.5" fontFamily="monospace" textAnchor="middle">30.0 m</text>

              {/* Corner points */}
              {([[60,180],[260,180],[60,360],[260,360]] as [number,number][]).map(([x,y],i)=>(
                <circle key={i} cx={x} cy={y} r="3" fill="#C89520" opacity=".5"/>
              ))}

              {/* Floating data cards */}
              <g className="df">
                <rect x="20" y="60" width="100" height="52" rx="2" fill="rgba(200,149,32,.08)" stroke="rgba(200,149,32,.25)" strokeWidth="1"/>
                <text x="30" y="79" fill="rgba(200,149,32,.5)" fontSize="7" fontFamily="monospace" fontWeight="bold">COMMANDES</text>
                <text x="30" y="96" fill="rgba(255,255,255,.7)" fontSize="16" fontFamily="'Bebas Neue',sans-serif" letterSpacing="1">247</text>
                <text x="70" y="103" fill="rgba(34,197,94,.6)" fontSize="7" fontFamily="monospace">+12%</text>
              </g>
              <g className="df" style={{animationDelay:'.3s'}}>
                <rect x="335" y="145" width="95" height="48" rx="2" fill="rgba(59,130,246,.08)" stroke="rgba(59,130,246,.25)" strokeWidth="1"/>
                <text x="345" y="162" fill="rgba(59,130,246,.6)" fontSize="7" fontFamily="monospace" fontWeight="bold">STOCK</text>
                <text x="345" y="179" fill="rgba(255,255,255,.7)" fontSize="16" fontFamily="'Bebas Neue',sans-serif" letterSpacing="1">98%</text>
              </g>
              <g className="df" style={{animationDelay:'.6s'}}>
                <rect x="20" y="280" width="28" height="28" rx="2" fill="rgba(200,149,32,.1)" stroke="rgba(200,149,32,.3)" strokeWidth="1"/>
                <text x="34" y="299" fill="rgba(200,149,32,.6)" fontSize="11" fontFamily="monospace" textAnchor="middle">▲</text>
              </g>
            </svg>
          </div>
          <div className="h-foot">Plan d'usine · SFMC Bénin v1.0 · Système actif</div>
        </div>
      </section>

      {/* STATS */}
      <section className="st" ref={statsRef}>
        {[
          { n: c0, suf: '+', label: 'Commandes traitées', color: '#C89520' },
          { n: c1, suf: '',  label: 'Modules intégrés',   color: '#3b82f6' },
          { n: c2, suf: '%', label: 'Traçabilité totale',  color: '#22c55e' },
          { n: c3, suf: '/7',label: 'Disponibilité',       color: '#a855f7' },
        ].map((s, i) => (
          <div key={i} className={`st-item${statsOn?' on':''}`} style={{transitionDelay:`${i*0.1}s`}}>
            <div className="st-n" style={{color: s.color}}>
              {s.n}<b style={{fontSize:'0.65em',opacity:.7}}>{s.suf}</b>
            </div>
            <div className="st-l">{s.label}</div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="ft" id="modules">
        <div className="ft-head">
          <h2 className="ft-title">Quatre modules.<br/><span>Une vision.</span></h2>
          <p className="ft-hint">Chaque module couvre un flux précis. Ensemble, ils gèrent l'intégralité de vos opérations industrielles.</p>
        </div>
        <div className="ft-grid">
          {FEATURES.map((f, i) => (
            <div key={i} ref={el=>{featRefs.current[i]=el}} className={`ft-card${featVisible[i]?' vis':''}`}>
              <div className="ft-num">{f.num}</div>
              <div className="ft-bar" style={{background:f.color}}/>
              <div className="ft-ico" style={{color:f.color}}>{f.icon}</div>
              <div className="ft-name">{f.title}</div>
              <div className="ft-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="pr" id="process">
        <h2 className="pr-title">Comment ça <span>fonctionne</span> ?</h2>
        <div className="pr-steps">
          {[
            { n:'01', title:'Créez un compte', desc:'Inscription rapide en tant que client. Accès immédiat au catalogue produits.' },
            { n:'02', title:'Passez une commande', desc:'Sélectionnez vos produits, renseignez l\'adresse de livraison, confirmez.' },
            { n:'03', title:'Suivez en temps réel', desc:'Recevez des notifications à chaque étape. Facture générée automatiquement.' },
          ].map((s,i)=>(
            <div key={i} className="pr-step">
              <div className="pr-step-circle">{s.n}</div>
              <div className="pr-step-title">{s.title}</div>
              <div className="pr-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="ct">
        <div className="ct-left">
          <h2>Prêt à <span>démarrer</span> ?</h2>
          <p>Rejoignez la plateforme et prenez le contrôle de vos opérations dès aujourd'hui.</p>
        </div>
        <button className="ct-btn" onClick={() => navigate('/login')}>
          Accéder à la plateforme
        </button>
      </section>

      {/* FOOTER */}
      <footer className="fo">
        <div className="fo-logo">SFMC <b>·</b> BÉNIN</div>
        <div className="fo-copy">© 2026 — Société de Fabrication de Matériaux de Construction</div>
      </footer>
    </>
  )
}
