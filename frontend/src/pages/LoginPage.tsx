import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { login, register } from '../api/auth'
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

// ─── Password strength ────────────────────────────────────────────────────────
function passwordStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: '' }
  let score = 0
  if (p.length >= 6)  score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  if (score <= 1) return { score, label: 'Très faible', color: '#ef4444' }
  if (score === 2)  return { score, label: 'Faible',     color: '#f97316' }
  if (score === 3)  return { score, label: 'Moyen',      color: '#eab308' }
  if (score === 4)  return { score, label: 'Fort',       color: '#22c55e' }
  return { score, label: 'Très fort', color: '#10b981' }
}

// ─── Floating-label field ─────────────────────────────────────────────────────
function FloatField({
  label, type = 'text', value, onChange, placeholder, minLength, delay = 0,
  suffix,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minLength?: number
  delay?: number
  suffix?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0

  return (
    <motion.div
      className="lr-field"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative' }}
    >
      {/* Floating label */}
      <motion.label
        animate={{
          y:        lifted ? -10 : 0,
          scale:    lifted ? 0.78 : 1,
          color:    focused ? '#C89520' : 'rgba(255,255,255,0.32)',
          originX:  0,
          originY:  0,
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          top: '0.82rem',
          left: '1rem',
          pointerEvents: 'none',
          fontSize: '0.82rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          transformOrigin: 'left top',
          zIndex: 2,
        }}
      >
        {label}
      </motion.label>

      {/* Glow ring on focus */}
      <AnimatePresence>
        {focused && (
          <motion.span
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', inset: 0,
              borderRadius: 8,
              boxShadow: '0 0 0 3px rgba(200,149,32,0.18)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ position: 'relative' }}>
        <input
          className="lr-input"
          type={type}
          required
          minLength={minLength}
          placeholder={focused ? (placeholder ?? '') : ''}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ paddingTop: '1.45rem', paddingBottom: '0.45rem', paddingRight: suffix ? '2.8rem' : undefined }}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: '0.85rem', top: '50%',
            transform: 'translateY(-50%)', zIndex: 3,
          }}>
            {suffix}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regEmail,      setRegEmail]      = useState('')
  const [regPassword,   setRegPassword]   = useState('')
  const [regConfirm,    setRegConfirm]    = useState('')

  const [showPass,  setShowPass]  = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const shakeCtrl  = useAnimation()

  const shake = () =>
    shakeCtrl.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45 },
    })

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ email: loginEmail, password: loginPassword })
      signIn(data)
      import('../utils/jwt').then(({ decodeJwt }) => {
        const { roles } = decodeJwt(data.token)
        const isClientOnly =
          roles.includes('ROLE_USER') &&
          !roles.includes('ROLE_ADMIN') &&
          !roles.includes('ROLE_OPERATOR')
        navigate(isClientOnly ? '/shop' : '/dashboard')
      })
    } catch {
      setError('Identifiants incorrects. Veuillez réessayer.')
      shake()
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (regPassword !== regConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      shake()
      return
    }
    setLoading(true)
    try {
      await register({ email: regEmail, password: regPassword })
      setSuccess('Compte créé ! Vous pouvez maintenant vous connecter.')
      setRegEmail(''); setRegPassword(''); setRegConfirm('')
      setTimeout(() => { setTab('login'); setSuccess('') }, 2500)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } }
      setError(
        e?.response?.status === 409
          ? 'Cet email est déjà utilisé.'
          : 'Erreur lors de la création du compte.',
      )
      shake()
    } finally {
      setLoading(false)
    }
  }

  const strength = passwordStrength(regPassword)
  const passwordsMatch = regConfirm.length > 0 && regPassword === regConfirm

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" className="lr-eye" onClick={toggle}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;500;600&display=swap');

        .lr-root {
          min-height: 100vh;
          background: #0c0c18;
          display: flex; flex-direction: column;
          font-family: 'Montserrat', sans-serif;
          position: relative; overflow: hidden;
        }
        .lr-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none; will-change: transform;
        }
        .lr-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(200,149,32,.14) 0%, transparent 70%);
          top: -120px; left: -100px;
          animation: lorb1 12s ease-in-out infinite alternate;
        }
        .lr-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(59,130,246,.10) 0%, transparent 70%);
          bottom: -80px; right: -60px;
          animation: lorb2 15s ease-in-out infinite alternate;
        }
        .lr-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(168,85,247,.07) 0%, transparent 70%);
          top: 40%; right: 20%;
          animation: lorb3 10s ease-in-out infinite alternate;
        }
        @keyframes lorb1 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(60px,40px) scale(1.15)} }
        @keyframes lorb2 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(-50px,-30px) scale(1.1)} }
        @keyframes lorb3 { 0%{transform:translate(0,0)} 100%{transform:translate(30px,-40px)} }

        .lr-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(200,149,32,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,149,32,.03) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
        }
        .lr-back {
          position: absolute; top: 2rem; left: 2rem;
          display: flex; align-items: center; gap: .5rem;
          color: rgba(255,255,255,.35); font-size: .82rem;
          text-decoration: none; letter-spacing: .05em;
          transition: color .2s; z-index: 10;
        }
        .lr-back:hover { color: #C89520; }
        .lr-center {
          flex: 1; display: flex; align-items: center;
          justify-content: center; padding: 2rem;
          position: relative; z-index: 1;
        }
        .lr-card { width: 100%; max-width: 430px; }
        .lr-brand { text-align: center; margin-bottom: 2.5rem; }
        .lr-logo {
          width: 60px; height: 60px;
          background: rgba(200,149,32,.1);
          border: 1px solid rgba(200,149,32,.3);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.2rem; border-radius: 14px;
          box-shadow: 0 4px 20px rgba(200,149,32,.15), inset 0 1px 0 rgba(255,255,255,.08);
        }
        .lr-logo svg { width: 28px; height: 28px; color: #C89520; }
        .lr-title {
          font-family: 'Montserrat', sans-serif; font-size: 2.4rem;
          color: #fff; letter-spacing: .1em; line-height: 1;
        }
        .lr-sub {
          color: rgba(255,255,255,.3); font-size: .75rem;
          letter-spacing: .15em; text-transform: uppercase; margin-top: .4rem;
        }
        .lr-box {
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 20px; padding: 2.2rem;
          box-shadow:
            0 24px 64px rgba(0,0,0,.5),
            0 4px 16px rgba(0,0,0,.3),
            inset 0 1px 0 rgba(255,255,255,.07),
            inset 0 -1px 0 rgba(0,0,0,.1);
        }
        .lr-tabs {
          display: flex; margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .lr-tab {
          flex: 1; padding: .7rem; background: none; border: none;
          cursor: pointer; font-family: 'Montserrat', sans-serif;
          font-size: .8rem; font-weight: 600; letter-spacing: .1em;
          text-transform: uppercase; color: rgba(255,255,255,.28);
          transition: color .2s; position: relative;
        }
        .lr-tab.active { color: #C89520; }
        .lr-tab.active::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
          height: 2px; background: #C89520; border-radius: 1px 1px 0 0;
        }
        .lr-input {
          width: 100%; padding: .78rem 1rem;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.10);
          color: #fff; font-family: 'Montserrat', sans-serif; font-size: .9rem;
          outline: none; transition: border-color .2s, background .2s;
          box-sizing: border-box; border-radius: 8px;
        }
        .lr-input::placeholder { color: rgba(255,255,255,.18); }
        .lr-input:focus {
          border-color: rgba(200,149,32,.6);
          background: rgba(200,149,32,.05);
        }
        .lr-field { margin-bottom: 1.2rem; }
        .lr-eye {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,.22); padding: 0; display: flex;
          transition: color .2s; line-height: 1;
        }
        .lr-eye:hover { color: #C89520; }
        .lr-btn {
          width: 100%; padding: .9rem;
          background: linear-gradient(135deg, #C89520 0%, #d4a030 100%);
          border: none; color: #111; font-family: 'Montserrat', sans-serif;
          font-size: .83rem; font-weight: 700; letter-spacing: .15em;
          text-transform: uppercase; cursor: pointer;
          transition: all .2s; display: flex; align-items: center;
          justify-content: center; gap: .5rem; margin-top: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(200,149,32,.35);
        }
        .lr-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #d4a030 0%, #e0b040 100%);
          box-shadow: 0 6px 20px rgba(200,149,32,.5);
          transform: translateY(-1px);
        }
        .lr-btn:active:not(:disabled) { transform: scale(.99) translateY(0); }
        .lr-btn:disabled { opacity: .45; cursor: not-allowed; }
        .lr-btn.secondary {
          background: transparent;
          border: 1px solid rgba(200,149,32,.4);
          color: #C89520; box-shadow: none;
        }
        .lr-btn.secondary:hover:not(:disabled) {
          background: rgba(200,149,32,.08);
          border-color: rgba(200,149,32,.7);
          box-shadow: 0 4px 14px rgba(200,149,32,.18);
          transform: translateY(-1px);
        }
        .lr-error {
          background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.25);
          color: #f87171; padding: .75rem 1rem;
          font-size: .82rem; margin-bottom: 1.1rem; border-radius: 8px;
        }
        .lr-success {
          background: rgba(34,197,94,.08);
          border: 1px solid rgba(34,197,94,.25);
          color: #4ade80; padding: .75rem 1rem;
          font-size: .82rem; margin-bottom: 1.1rem; border-radius: 8px;
        }
        .lr-hint {
          font-size: .74rem; color: rgba(255,255,255,.22);
          margin-top: .5rem; line-height: 1.55;
        }
        .lr-footer {
          text-align: center; padding: 1.5rem;
          color: rgba(255,255,255,.13); font-size: .7rem;
          letter-spacing: .1em; position: relative; z-index: 1;
        }
      `}</style>

      <div className="lr-root">
        <div className="lr-orb lr-orb-1" />
        <div className="lr-orb lr-orb-2" />
        <div className="lr-orb lr-orb-3" />
        <div className="lr-grid" />

        <a href="/landing.html" className="lr-back">
           <ArrowLeft size={14} /> Retour à l'accueil
        </a>

        <div className="lr-center">
          <motion.div
            className="lr-card"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Brand */}
            <div className="lr-brand">
              <motion.div
                className="lr-logo"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                  />
                </svg>
              </motion.div>
              <motion.div
                className="lr-title"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                SFMC Bénin
              </motion.div>
              <motion.div
                className="lr-sub"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.4 }}
              >
                Plateforme de gestion industrielle
              </motion.div>
            </div>

            {/* Card */}
            <motion.div className="lr-box" animate={shakeCtrl}>
              {/* Tabs */}
              <div className="lr-tabs">
                {(['login', 'register'] as const).map(t => (
                  <button
                    key={t}
                    className={`lr-tab${tab === t ? ' active' : ''}`}
                    onClick={() => { setTab(t); setError(''); setSuccess('') }}
                  >
                    {t === 'login' ? 'Connexion' : 'Créer un compte'}
                  </button>
                ))}
              </div>

              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="lr-error"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '1.1rem' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    className="lr-success"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '1.1rem' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forms */}
              <AnimatePresence mode="wait">

                {/* ── LOGIN ── */}
                {tab === 'login' && (
                  <motion.form
                    key="login"
                    onSubmit={handleLogin}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.22 }}
                  >
                    <FloatField
                      label="Adresse e-mail"
                      type="email"
                      value={loginEmail}
                      onChange={setLoginEmail}
                      placeholder="admin@sfmc.com"
                      delay={0.05}
                    />
                    <FloatField
                      label="Mot de passe"
                      type={showPass ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={setLoginPassword}
                      placeholder="••••••••"
                      delay={0.12}
                      suffix={<EyeBtn show={showPass} toggle={() => setShowPass(v => !v)} />}
                    />

                    <motion.button
                      type="submit"
                      className="lr-btn"
                      disabled={loading}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading
                        ? <><Loader2 size={16} className="animate-spin" /> Connexion...</>
                        : 'Accéder à la plateforme'}
                    </motion.button>
                  </motion.form>
                )}

                {/* ── REGISTER ── */}
                {tab === 'register' && (
                  <motion.form
                    key="register"
                    onSubmit={handleRegister}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                  >
                    <FloatField
                      label="Adresse e-mail"
                      type="email"
                      value={regEmail}
                      onChange={setRegEmail}
                      placeholder="client@exemple.com"
                      delay={0.05}
                    />

                    <FloatField
                      label="Mot de passe"
                      type={showPass ? 'text' : 'password'}
                      value={regPassword}
                      onChange={setRegPassword}
                      placeholder="••••••••"
                      minLength={6}
                      delay={0.12}
                      suffix={<EyeBtn show={showPass} toggle={() => setShowPass(v => !v)} />}
                    />

                    {/* Password strength bar */}
                    <AnimatePresence>
                      {regPassword.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: '-0.6rem', marginBottom: '1rem', overflow: 'hidden' }}
                        >
                          <div style={{
                            height: 3, borderRadius: 2,
                            background: 'rgba(255,255,255,0.08)',
                            overflow: 'hidden', margin: '0.3rem 0 0.3rem',
                          }}>
                            <motion.div
                              animate={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }}
                              transition={{ duration: 0.3 }}
                              style={{ height: '100%', borderRadius: 2 }}
                            />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 600 }}>
                            {strength.label}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <FloatField
                      label="Confirmer le mot de passe"
                      type={showPass2 ? 'text' : 'password'}
                      value={regConfirm}
                      onChange={setRegConfirm}
                      placeholder="••••••••"
                      minLength={6}
                      delay={0.19}
                      suffix={
                        regConfirm.length > 0
                          ? (passwordsMatch
                              ? <CheckCircle2 size={16} color="#22c55e" />
                              : <XCircle     size={16} color="#ef4444" />)
                          : <EyeBtn show={showPass2} toggle={() => setShowPass2(v => !v)} />
                      }
                    />

                    <motion.p
                      className="lr-hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.28 }}
                    >
                      En vous inscrivant, vous obtenez un accès client pour passer des commandes et suivre vos factures.
                    </motion.p>

                    <motion.button
                      type="submit"
                      className="lr-btn secondary"
                      disabled={loading}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32, duration: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading
                        ? <><Loader2 size={16} className="animate-spin" /> Création...</>
                        : 'Créer mon compte'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>

        <div className="lr-footer">© 2026 SFMC BÉNIN — Tous droits réservés</div>
      </div>
    </>
  )
}
