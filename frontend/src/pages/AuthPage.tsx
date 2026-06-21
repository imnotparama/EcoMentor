import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { formatError } from '@/utils/formatError'

interface AuthPageProps {
  mode: 'login' | 'register'
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  useEffect(() => {
    document.title = isLogin ? 'Sign In — EcoMentor AI' : 'Create Account — EcoMentor AI'
  }, [isLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = isLogin
        ? await authApi.login(email, password)
        : await authApi.register(email, password, name)

      setUser(response.user, response.access_token)
      navigate(isLogin ? '/dashboard' : '/onboarding')
    } catch (err: unknown) {
      setError(
        formatError(
          err,
          isLogin ? 'Invalid email or password' : 'Registration failed. Please try again.'
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3FB950, #26a641)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow-primary)',
            }}>
              <Leaf size={26} color="#0D1117" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                EcoMentor AI
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isLogin ? 'Welcome back' : 'Start your sustainability journey'}
              </div>
            </div>
          </Link>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Maya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                aria-required="true"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete={isLogin ? 'email' : 'email'}
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder={isLogin ? '••••••••' : 'Min. 8 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                aria-required="true"
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                background: 'var(--danger-dim)', border: '1px solid rgba(248,81,73,0.3)',
                borderRadius: 'var(--radius-md)', padding: '0.75rem',
                fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem' }}
            id={isLogin ? 'btn-login' : 'btn-register'}
          >
            {isLoading ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {isLogin ? (
            <>Don't have an account?{' '}<Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign Up</Link></>
          ) : (
            <>Already have an account?{' '}<Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign In</Link></>
          )}
        </div>

        {!isLogin && (
          <div style={{
            marginTop: '1.5rem', padding: '1rem',
            background: 'var(--primary-dim)',
            border: '1px solid rgba(63,185,80,0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem', color: 'var(--text-secondary)',
          }}>
            🌱 Demo accounts available: <strong style={{ color: 'var(--text-primary)' }}>maya@demo.ecomentor.ai</strong> / demo1234
          </div>
        )}
      </div>
    </div>
  )
}
