import { Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import ConstructionScene3D from '../components/ConstructionScene3D'

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
    num: '01',
    color: '#C89520',
    title: 'Commandes',
    desc: 'Créez et suivez chaque commande client en temps réel. De la réception à la livraison.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    num: '02',
    color: '#3b82f6',
    title: 'Production',
    desc: 'Pilotez chaque lot de fabrication. Planification, démarrage et suivi en temps réel.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    num: '03',
    color: '#22c55e',
    title: 'Inventaire',
    desc: 'Stock en temps réel par entrepôt. Alertes automatiques avant toute rupture critique.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    num: '04',
    color: '#a855f7',
    title: 'Facturation',
    desc: 'Factures générées automatiquement à la validation. Suivi des paiements intégré.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
]

const MATERIALS = ['Ciment', 'Briques', 'Acier', 'Gravier', 'Sable']

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [navScrolled, setNavScrolled] = useState(false)

  const statsRef = useRef<HTMLDivElement>(null)
  const statsOn = useInView(statsRef, { once: true, margin: '-80px' })

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const c0 = useCountUp(500, statsOn)
  const c1 = useCountUp(4, statsOn, 800)
  const c2 = useCountUp(100, statsOn)
  const c3 = useCountUp(24, statsOn, 1000)

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        /* NAV */
        .ln { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 1.6rem 4rem; display: flex; align-items: center; justify-content: space-between; transition: all .35s; }
        .ln.s { background: rgba(8,8,12,.92); padding: 1rem 4rem; border-bottom: 1px solid rgba(255,255,255,.06); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
        .ln-logo { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; letter-spacing: .15em; color: #fff; cursor: pointer; }
        .ln-logo b { color: #C89520; }
        .ln-links { display: flex; align-items: center; gap: 3rem; }
        .ln-link { font-family: 'Barlow', sans-serif; font-size: .75rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.4); background: none; border: none; cursor: pointer; transition: color .2s; }
        .ln-link:hover { color: #fff; }
        .ln-cta { font-family: 'Barlow', sans-serif; font-size: .73rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: #111; background: #C89520; border: none; padding: .6rem 1.8rem; cursor: pointer; transition: all .2s; }
        .ln-cta:hover { background: #d4a030; transform: translateY(-1px); }

        /* HERO */
        .lh { min-height: 100vh; background: #07070e; display: grid; grid-template-columns: 52% 48%; position: relative; overflow: hidden; }
        .lh::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 70% at 25% 50%, rgba(200,149,32,.06) 0%, transparent 65%); pointer-events: none; z-index: 1; }
        .lh-left { display: flex; flex-direction: column; justify-content: center; padding: 9rem 3rem 6rem 6rem; position: relative; z-index: 2; }
        .lh-tag { display: inline-flex; align-items: center; gap: .7rem; font-family: 'Barlow', sans-serif; font-size: .68rem; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #C89520; margin-bottom: 2.2rem; }
        .lh-tag::before { content: ''; width: 24px; height: 1px; background: #C89520; flex-shrink: 0; }
        .lh-right { position: relative; background: #050510; overflow: hidden; }

        /* STATS */
        .ls { background: #fff; display: grid; grid-template-columns: repeat(4,1fr); }
        .ls-item { padding: 3.5rem 2.5rem; border-right: 1px solid #f0ede8; position: relative; overflow: hidden; cursor: default; }
        .ls-item:last-child { border-right: none; }
        .ls-item::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; transform: scaleX(0); transform-origin: left; transition: transform .6s ease; }
        .ls-item:nth-child(1)::after { background: #C89520; }
        .ls-item:nth-child(2)::after { background: #3b82f6; }
        .ls-item:nth-child(3)::after { background: #22c55e; }
        .ls-item:nth-child(4)::after { background: #a855f7; }
        .ls-item.on::after { transform: scaleX(1); }
        .ls-n { font-family: 'Bebas Neue', sans-serif; font-size: clamp(3rem,4.5vw,4.5rem); line-height: 1; }
        .ls-n b { color: inherit; font: inherit; }
        .ls-l { font-family: 'Barlow', sans-serif; font-size: .7rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #999; margin-top: .5rem; }

        /* FEATURES */
        .lf { background: #0a0a12; padding: 7rem 6rem; }
        .lf-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5rem; gap: 2rem; }
        .lf-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2.8rem,4vw,4.2rem); color: #fff; letter-spacing: .03em; line-height: 1; }
        .lf-title span { color: #C89520; }
        .lf-hint { font-family: 'Barlow', sans-serif; font-size: .82rem; font-weight: 300; color: rgba(255,255,255,.3); max-width: 260px; text-align: right; line-height: 1.8; }
        .lf-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: rgba(255,255,255,.06); border-radius: 16px; overflow: hidden; }

        /* PROCESS */
        .lp { background: #f5f2ec; padding: 7rem 6rem; }
        .lp-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2.5rem,3.5vw,3.8rem); color: #111; letter-spacing: .03em; margin-bottom: 4rem; text-align: center; }
        .lp-title span { color: #C89520; }
        .lp-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 2.5rem; }

        /* CTA */
        .lc { background: #0d0d18; padding: 6rem; display: flex; align-items: center; justify-content: space-between; gap: 3rem; border-top: 1px solid rgba(200,149,32,.18); position: relative; overflow: hidden; }
        .lc::before { content: 'SFMC'; font-family: 'Bebas Neue', sans-serif; font-size: 18rem; color: rgba(255,255,255,.012); position: absolute; right: -2rem; top: 50%; transform: translateY(-50%); pointer-events: none; line-height: 1; }
        .lc h2 { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2.5rem,4vw,4rem); color: #fff; letter-spacing: .03em; line-height: 1; }
        .lc h2 span { color: #C89520; }
        .lc p { font-family: 'Barlow', sans-serif; font-size: .88rem; font-weight: 300; color: rgba(255,255,255,.4); margin-top: .8rem; line-height: 1.7; }
        .lc-btn { font-family: 'Barlow', sans-serif; font-size: .78rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: #111; background: #C89520; border: 2px solid #C89520; padding: 1.1rem 3rem; cursor: pointer; white-space: nowrap; transition: all .2s; flex-shrink: 0; }
        .lc-btn:hover { background: transparent; color: #C89520; transform: translateY(-2px); }

        /* FOOTER */
        .lfoo { background: #060610; padding: 2.5rem 6rem; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,.05); }
        .lfoo-logo { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: .15em; color: rgba(255,255,255,.25); }
        .lfoo-logo b { color: #C89520; }
        .lfoo-copy { font-family: 'Barlow', sans-serif; font-size: .68rem; color: rgba(255,255,255,.18); letter-spacing: .1em; }

        /* PING */
        @keyframes lping { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(200,149,32,.7)} 70%{opacity:.6;box-shadow:0 0 0 10px rgba(200,149,32,0)} }
        .lpingdot { animation: lping 2s infinite; }
        @keyframes lscrollpulse { 0%,100%{transform:scaleY(1);opacity:.6} 50%{transform:scaleY(1.3);opacity:1} }
        .lscrollline { width:1px;height:40px;background:linear-gradient(to bottom,rgba(200,149,32,0),#C89520);animation:lscrollpulse 2s infinite; }

        @media (max-width: 900px) {
          .lh { grid-template-columns: 1fr; }
          .lh-right { display: none; }
          .lh-left { padding: 8rem 2rem 4rem; }
          .ln { padding: 1.2rem 1.5rem; }
          .ln.s { padding: .8rem 1.5rem; }
          .ln-links { gap: 1.5rem; }
          .ls { grid-template-columns: 1fr 1fr; }
          .ls-item { border-bottom: 1px solid #f0ede8; }
          .lf { padding: 4rem 2rem; }
          .lf-grid { grid-template-columns: 1fr 1fr; }
          .lf-head { flex-direction: column; align-items: flex-start; }
          .lf-hint { text-align: left; max-width: 100%; }
          .lp { padding: 4rem 2rem; }
          .lp-grid { grid-template-columns: 1fr; }
          .lc { flex-direction: column; padding: 4rem 2rem; text-align: center; }
          .lfoo { flex-direction: column; gap: .8rem; padding: 2rem; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className={`ln${navScrolled ? ' s' : ''}`}>
        <div className="ln-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          SFMC <b>·</b> BÉNIN
        </div>
        <div className="ln-links">
          <button className="ln-link" onClick={() => scrollTo('modules')}>Modules</button>
          <button className="ln-link" onClick={() => scrollTo('process')}>Processus</button>
          <button className="ln-cta" onClick={() => navigate('/login')}>Connexion</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lh">
        {/* LEFT — text content */}
        <div className="lh-left">
          <motion.div
            className="lh-tag"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Matériaux · Production · Livraison
          </motion.div>

          <div style={{ fontFamily: "'Bebas Neue', sans-serif", lineHeight: 0.92, letterSpacing: '.01em' }}>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'block', fontSize: 'clamp(4.5rem,8.5vw,8rem)', color: '#fff' }}
            >
              Gérez
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'block', fontSize: 'clamp(4.5rem,8.5vw,8rem)', color: '#C89520' }}
            >
              Tout.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'block', fontSize: 'clamp(4.5rem,8.5vw,8rem)', color: 'rgba(255,255,255,.12)' }}
            >
              Ici.
            </motion.span>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: '.95rem',
              fontWeight: 300,
              color: 'rgba(255,255,255,.5)',
              lineHeight: 1.8,
              marginTop: '2rem',
              maxWidth: 400,
            }}
          >
            Commandes, production, inventaire et facturation — centralisés dans une seule plateforme pensée pour SFMC Bénin.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', marginTop: '3rem' }}
          >
            <button
              onClick={() => navigate('/login')}
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: '.78rem',
                fontWeight: 700,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: '#111',
                background: '#C89520',
                border: '2px solid #C89520',
                padding: '1rem 2.8rem',
                cursor: 'pointer',
                transition: 'all .2s',
              }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.background = 'transparent'
                t.style.color = '#C89520'
                t.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.background = '#C89520'
                t.style.color = '#111'
                t.style.transform = 'translateY(0)'
              }}
            >
              Accéder à la plateforme
            </button>
            <button
              onClick={() => scrollTo('modules')}
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: '.75rem',
                fontWeight: 600,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.35)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '.5rem',
                transition: 'color .2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.35)')}
            >
              Découvrir
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                <path d="M8 3v10M3 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '3rem',
              left: '6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '.8rem',
              fontFamily: "'Barlow', sans-serif",
              fontSize: '.65rem',
              fontWeight: 600,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.2)',
            }}
          >
            <div className="lscrollline" />
            <span>Défiler</span>
          </motion.div>
        </div>

        {/* RIGHT — 3D scene + glassmorphism cards */}
        <div className="lh-right">
          {/* 3D canvas fills the panel */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <Suspense fallback={null}>
              <ConstructionScene3D />
            </Suspense>
          </div>

          {/* Overlay: glassmorphism data cards */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

            {/* System active badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ position: 'absolute', top: '4%', right: '5%', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <div
                className="lpingdot"
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#C89520', flexShrink: 0 }}
              />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)' }}>
                Système actif
              </span>
            </motion.div>

            {/* Card: Commandes */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: '12%',
                right: '8%',
                background: 'rgba(8,8,18,.7)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(200,149,32,.28)',
                borderRadius: 14,
                padding: '18px 22px',
                minWidth: 138,
                boxShadow: '0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)',
              }}
            >
              <div style={{ fontSize: 9, fontFamily: "'Barlow', sans-serif", fontWeight: 700, letterSpacing: '.18em', color: 'rgba(200,149,32,.85)', textTransform: 'uppercase', marginBottom: 8 }}>Commandes</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: '#fff', letterSpacing: '.04em', lineHeight: 1 }}>247</div>
              <div style={{ fontSize: 10, color: 'rgba(34,197,94,.85)', marginTop: 6, fontFamily: "'Barlow', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>↑</span><span>+12% ce mois</span>
              </div>
            </motion.div>

            {/* Card: Stock */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: '40%',
                left: '6%',
                background: 'rgba(8,8,18,.7)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(59,130,246,.28)',
                borderRadius: 14,
                padding: '18px 22px',
                minWidth: 125,
                boxShadow: '0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)',
              }}
            >
              <div style={{ fontSize: 9, fontFamily: "'Barlow', sans-serif", fontWeight: 700, letterSpacing: '.18em', color: 'rgba(59,130,246,.85)', textTransform: 'uppercase', marginBottom: 8 }}>Stock</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: '#fff', letterSpacing: '.04em', lineHeight: 1 }}>98%</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 6, fontFamily: "'Barlow', sans-serif" }}>Disponible</div>
            </motion.div>

            {/* Card: Production */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                bottom: '18%',
                right: '10%',
                background: 'rgba(8,8,18,.7)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(168,85,247,.28)',
                borderRadius: 14,
                padding: '18px 22px',
                minWidth: 125,
                boxShadow: '0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)',
              }}
            >
              <div style={{ fontSize: 9, fontFamily: "'Barlow', sans-serif", fontWeight: 700, letterSpacing: '.18em', color: 'rgba(168,85,247,.85)', textTransform: 'uppercase', marginBottom: 8 }}>Production</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: '#fff', letterSpacing: '.04em', lineHeight: 1 }}>12</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 6, fontFamily: "'Barlow', sans-serif" }}>Lots actifs</div>
            </motion.div>

            {/* Material category pills at the bottom */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              style={{
                position: 'absolute',
                bottom: '5%',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 8,
                flexWrap: 'nowrap',
              }}
            >
              {MATERIALS.map((m, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.5)',
                    background: 'rgba(255,255,255,.06)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 20,
                    padding: '5px 13px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div ref={statsRef} className="ls">
        {[
          { n: c0, suf: '+', label: 'Commandes traitées', color: '#C89520' },
          { n: c1, suf: '', label: 'Modules intégrés', color: '#3b82f6' },
          { n: c2, suf: '%', label: 'Traçabilité totale', color: '#22c55e' },
          { n: c3, suf: '/7', label: 'Disponibilité', color: '#a855f7' },
        ].map((s, i) => (
          <motion.div
            key={i}
            className={`ls-item${statsOn ? ' on' : ''}`}
            style={{ transitionDelay: `${i * 0.1}s` }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
          >
            <div className="ls-n" style={{ color: s.color }}>
              {s.n}
              <b style={{ fontSize: '0.65em', opacity: 0.7 }}>{s.suf}</b>
            </div>
            <div className="ls-l">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── FEATURES / MODULES ── */}
      <section className="lf" id="modules">
        <div className="lf-head">
          <motion.h2
            className="lf-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            Quatre modules.<br /><span>Une vision.</span>
          </motion.h2>
          <motion.p
            className="lf-hint"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.15 }}
          >
            Chaque module couvre un flux précis. Ensemble, ils gèrent l'intégralité de vos opérations industrielles.
          </motion.p>
        </div>

        <div className="lf-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ background: 'linear-gradient(135deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,.02) 100%)', y: -4 }}
              style={{
                padding: '2.8rem 2rem',
                background: 'linear-gradient(135deg, rgba(255,255,255,.045) 0%, rgba(255,255,255,.015) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderTop: `2px solid ${f.color}`,
                transition: 'background .25s',
                cursor: 'default',
              }}
            >
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '4rem',
                  lineHeight: 1,
                  color: 'rgba(255,255,255,.05)',
                  marginBottom: '.8rem',
                }}
              >
                {f.num}
              </div>
              <div
                style={{
                  height: 2,
                  width: 36,
                  background: f.color,
                  borderRadius: 1,
                  marginBottom: '1.4rem',
                }}
              />
              <div style={{ color: f.color, marginBottom: '1.2rem' }}>{f.icon}</div>
              <div
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: '.95rem',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '.7rem',
                  letterSpacing: '.03em',
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: '.8rem',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,.42)',
                  lineHeight: 1.75,
                }}
              >
                {f.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="lp" id="process">
        <motion.h2
          className="lp-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          Comment ça <span>fonctionne</span> ?
        </motion.h2>

        <div className="lp-grid">
          {[
            {
              n: '01',
              title: 'Créez un compte',
              desc: "Inscription rapide en tant que client. Accès immédiat au catalogue produits.",
              color: '#C89520',
            },
            {
              n: '02',
              title: 'Passez une commande',
              desc: "Sélectionnez vos matériaux, renseignez l'adresse de livraison, confirmez.",
              color: '#3b82f6',
            },
            {
              n: '03',
              title: 'Suivez en temps réel',
              desc: 'Notifications à chaque étape. Facture générée automatiquement à la validation.',
              color: '#22c55e',
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              style={{
                background: '#ffffff',
                borderRadius: 22,
                padding: '2.8rem 2.2rem',
                textAlign: 'center',
                boxShadow:
                  '8px 8px 24px rgba(160,140,100,.22), -4px -4px 14px rgba(255,255,255,.92), inset 0 2px 3px rgba(255,255,255,.55)',
                border: '1px solid rgba(200,149,32,.08)',
                cursor: 'default',
                transition: 'box-shadow .25s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: s.color,
                  borderRadius: '22px 22px 0 0',
                  opacity: 0.7,
                }}
              />
              <div
                style={{
                  width: 50,
                  height: 50,
                  border: `2px solid ${s.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1.2rem',
                  color: s.color,
                  borderRadius: 12,
                  background: `rgba(${s.color === '#C89520' ? '200,149,32' : s.color === '#3b82f6' ? '59,130,246' : '34,197,94'},.08)`,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: '.9rem',
                  fontWeight: 700,
                  color: '#111',
                  letterSpacing: '.04em',
                  marginBottom: '.6rem',
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: '.8rem',
                  fontWeight: 400,
                  color: '#888',
                  lineHeight: 1.7,
                }}
              >
                {s.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lc">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2>Prêt à <span>démarrer</span> ?</h2>
          <p>Rejoignez la plateforme et prenez le contrôle de vos opérations dès aujourd'hui.</p>
        </motion.div>
        <motion.button
          className="lc-btn"
          onClick={() => navigate('/login')}
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Accéder à la plateforme
        </motion.button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lfoo">
        <div className="lfoo-logo">SFMC <b>·</b> BÉNIN</div>
        <div className="lfoo-copy">© 2026 — Société de Fabrication de Matériaux de Construction</div>
      </footer>
    </>
  )
}
