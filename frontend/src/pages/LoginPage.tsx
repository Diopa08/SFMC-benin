import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { login, register } from '../api/auth'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ email: loginEmail, password: loginPassword })
      signIn(data)
      // Redirection selon le rôle
      import('../utils/jwt').then(({ decodeJwt }) => {
        const { roles } = decodeJwt(data.token)
        const isClientOnly = roles.includes('ROLE_USER') &&
          !roles.includes('ROLE_ADMIN') && !roles.includes('ROLE_OPERATOR')
        navigate(isClientOnly ? '/shop' : '/dashboard')
      })
    } catch {
      setError('Identifiants incorrects. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (regPassword !== regConfirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    try {
      await register({ email: regEmail, password: regPassword })
      setSuccess('Compte créé ! Vous pouvez maintenant vous connecter.')
      setRegEmail(''); setRegPassword(''); setRegConfirm('')
      setTimeout(() => { setTab('login'); setSuccess('') }, 2500)
    } catch (err: any) {
      setError(err?.response?.status === 409 ? 'Cet email est déjà utilisé.' : 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;500;600&display=swap');
        .login-root { min-height: 100vh; background: #111; display: flex; flex-direction: column;  position: relative; overflow: hidden; }
        .login-root::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(200,149,32,0.12) 0%, transparent 70%); pointer-events: none; }
        .login-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(200,149,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,149,32,0.04) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; }
        .login-back { position: absolute; top: 2rem; left: 2rem; display: flex; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.4); font-size: 0.85rem; text-decoration: none; letter-spacing: 0.05em; transition: color 0.2s; z-index: 10; }
        .login-back:hover { color: #C89520; }
        .login-center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 1; }
        .login-card { width: 100%; max-width: 420px; }
        .login-brand { text-align: center; margin-bottom: 2.5rem; }
        .login-logo { width: 56px; height: 56px; border: 2px solid #C89520; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.2rem; }
        .login-logo svg { width: 28px; height: 28px; color: #C89520; }
        .login-title {  font-size: 2.4rem; color: #fff; letter-spacing: 0.1em; line-height: 1; }
        .login-sub { color: rgba(255,255,255,0.35); font-size: 0.78rem; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 0.4rem; }
        .login-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 2rem; }
        .login-tabs { display: flex; gap: 0; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .login-tab { flex: 1; padding: 0.7rem; background: none; border: none; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); transition: color 0.2s; position: relative; }
        .login-tab.active { color: #C89520; }
        .login-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #C89520; }
        .login-label { display: block; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 0.5rem; }
        .login-input { width: 100%; padding: 0.75rem 1rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-family: 'Montserrat', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s, background 0.2s; box-sizing: border-box; }
        .login-input::placeholder { color: rgba(255,255,255,0.2); }
        .login-input:focus { border-color: #C89520; background: rgba(200,149,32,0.05); }
        .login-input-wrap { position: relative; }
        .login-eye { position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.25); padding: 0; display: flex; transition: color 0.2s; }
        .login-eye:hover { color: #C89520; }
        .login-field { margin-bottom: 1.2rem; }
        .login-btn { width: 100%; padding: 0.85rem; background: #C89520; border: none; color: #111; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; transition: background 0.2s, transform 0.1s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; }
        .login-btn:hover:not(:disabled) { background: #d4a030; }
        .login-btn:active:not(:disabled) { transform: scale(0.99); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-btn.secondary { background: transparent; border: 1px solid #C89520; color: #C89520; }
        .login-btn.secondary:hover:not(:disabled) { background: rgba(200,149,32,0.1); }
        .login-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 0.75rem 1rem; font-size: 0.82rem; margin-bottom: 1.2rem; }
        .login-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; padding: 0.75rem 1rem; font-size: 0.82rem; margin-bottom: 1.2rem; }
        .login-hint { font-size: 0.75rem; color: rgba(255,255,255,0.25); margin-top: 0.5rem; line-height: 1.5; }
        .login-footer { text-align: center; padding: 1.5rem; color: rgba(255,255,255,0.15); font-size: 0.72rem; letter-spacing: 0.1em; position: relative; z-index: 1; }
      `}</style>

      <div className="login-root">
        <div className="login-grid" />

        <Link to="/" className="login-back">
          <ArrowLeft size={14} />
          Retour à l'accueil
        </Link>

        <div className="login-center">
          <div className="login-card">
            <div className="login-brand">
              <div className="login-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <div className="login-title">SFMC Bénin</div>
              <div className="login-sub">Plateforme de gestion industrielle</div>
            </div>

            <div className="login-box">
              <div className="login-tabs">
                <button className={`login-tab ${tab === 'login' ? 'active' : ''}`}
                  onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
                  Connexion
                </button>
                <button className={`login-tab ${tab === 'register' ? 'active' : ''}`}
                  onClick={() => { setTab('register'); setError(''); setSuccess('') }}>
                  Créer un compte
                </button>
              </div>

              {error && <div className="login-error">{error}</div>}
              {success && <div className="login-success">{success}</div>}

              {tab === 'login' && (
                <form onSubmit={handleLogin}>
                  <div className="login-field">
                    <label className="login-label">Adresse e-mail</label>
                    <input className="login-input" type="email" required
                      placeholder="admin@sfmc.com"
                      value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                  </div>
                  <div className="login-field">
                    <label className="login-label">Mot de passe</label>
                    <div className="login-input-wrap">
                      <input className="login-input" type={showPass ? 'text' : 'password'} required
                        placeholder="••••••••" style={{ paddingRight: '2.5rem' }}
                        value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                      <button type="button" className="login-eye" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : 'Accéder à la plateforme'}
                  </button>
                </form>
              )}

              {tab === 'register' && (
                <form onSubmit={handleRegister}>
                  <div className="login-field">
                    <label className="login-label">Adresse e-mail</label>
                    <input className="login-input" type="email" required
                      placeholder="client@exemple.com"
                      value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                  </div>
                  <div className="login-field">
                    <label className="login-label">Mot de passe</label>
                    <div className="login-input-wrap">
                      <input className="login-input" type={showPass ? 'text' : 'password'} required minLength={6}
                        placeholder="••••••••" style={{ paddingRight: '2.5rem' }}
                        value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                      <button type="button" className="login-eye" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="login-field">
                    <label className="login-label">Confirmer le mot de passe</label>
                    <input className="login-input" type="password" required minLength={6}
                      placeholder="••••••••"
                      value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
                  </div>
                  <p className="login-hint">En vous inscrivant, vous obtenez un accès client pour passer des commandes et suivre vos factures.</p>
                  <button type="submit" className="login-btn secondary" disabled={loading}>
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Création...</> : 'Créer mon compte'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="login-footer">© 2026 SFMC BÉNIN — Tous droits réservés</div>
      </div>
    </>
  )
}
