import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, MapPin, Users, ArrowRight, Leaf } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

export default function Onboarding() {
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [householdSize, setHouseholdSize] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setUser, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Set Up Your Profile — EcoMentor AI'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const updated = await authApi.updateProfile({
        age: age ? parseInt(age) : undefined,
        city: city || undefined,
        household_size: householdSize ? parseInt(householdSize) : undefined,
      })
      setUser(updated)
      navigate('/assessment')
    } catch {
      setError('Failed to save profile. Please try again.')
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
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #26a641)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: 'var(--shadow-glow-primary)',
          }}>
            <Leaf size={28} color="#0D1117" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Welcome, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p>Tell us a bit about yourself so we can personalize your sustainability insights.</p>
        </div>

        <div
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '2rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            {/* Age */}
            <div className="form-group">
              <label htmlFor="age" className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <User size={14} aria-hidden="true" />
                  Your Age
                </span>
              </label>
              <input
                id="age"
                type="number"
                className="form-input"
                placeholder="28"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={1}
                max={120}
                aria-describedby="age-hint"
              />
              <span id="age-hint" className="form-hint">Helps us contextualize your footprint</span>
            </div>

            {/* City */}
            <div className="form-group">
              <label htmlFor="city" className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <MapPin size={14} aria-hidden="true" />
                  City
                </span>
              </label>
              <input
                id="city"
                type="text"
                className="form-input"
                placeholder="Bangalore, Mumbai, Chennai..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                aria-describedby="city-hint"
              />
              <span id="city-hint" className="form-hint">Used for regional comparisons and local tips</span>
            </div>

            {/* Household Size */}
            <div className="form-group">
              <label htmlFor="household-size" className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Users size={14} aria-hidden="true" />
                  Household Size
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {[1, 2, 3, 4, '5+'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setHouseholdSize(n === '5+' ? '5' : String(n))}
                    style={{
                      padding: '0.625rem',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid',
                      borderColor: householdSize === (n === '5+' ? '5' : String(n)) ? 'var(--primary)' : 'var(--border)',
                      background: householdSize === (n === '5+' ? '5' : String(n)) ? 'var(--primary-dim)' : 'var(--surface-2)',
                      color: householdSize === (n === '5+' ? '5' : String(n)) ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.15s',
                    }}
                    aria-pressed={householdSize === (n === '5+' ? '5' : String(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div role="alert" style={{
                background: 'var(--danger-dim)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem', fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/assessment')}
                style={{ flex: 1 }}
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ flex: 2 }}
                id="btn-save-profile"
              >
                {isLoading ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <>
                    Save & Start Assessment
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          All fields are optional. You can update them anytime in Settings.
        </p>
      </div>
    </div>
  )
}
