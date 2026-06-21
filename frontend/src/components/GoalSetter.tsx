import { useState, useEffect } from 'react'
import { Target, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface GoalSetterProps {
  currentMonthly: number
}

const PRESETS = [
  { label: '5% reduction', factor: 0.95 },
  { label: '10% reduction', factor: 0.90 },
  { label: '20% reduction', factor: 0.80 },
  { label: 'India average', factor: null, fixed: 1900 },
]

export default function GoalSetter({ currentMonthly }: GoalSetterProps) {
  const [goal, setGoal] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const userId = useAuthStore((s) => s.user?.id)
  const storageKey = userId ? `ecomentor_goal_${userId}` : 'ecomentor_goal_guest'

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) setGoal(Number(saved))
    else setGoal(null)
  }, [storageKey])

  const saveGoal = (value: number) => {
    setGoal(value)
    localStorage.setItem(storageKey, String(value))
    setEditing(false)
  }

  const clearGoal = () => {
    setGoal(null)
    localStorage.removeItem(storageKey)
  }

  const achieved = goal ? currentMonthly <= goal : false
  const remaining = goal ? Math.max(0, currentMonthly - goal) : 0

  return (
    <div style={{
      background: 'var(--surface)',
      border: achieved ? '1px solid rgba(63,185,80,0.5)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      boxShadow: achieved ? '0 0 20px rgba(63,185,80,0.1)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {achieved ? (
            <CheckCircle2 size={18} color="var(--primary)" />
          ) : (
            <Target size={18} color={goal ? 'var(--accent)' : 'var(--text-secondary)'} />
          )}
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Monthly Goal
          </span>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
          aria-label={editing ? 'Close goal editor' : 'Edit goal'}
        >
          {editing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {!goal ? (
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.875rem' }}>
            Set a monthly CO₂ target to track your progress.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="btn btn-secondary btn-sm"
            id="btn-set-goal"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Target size={14} />
            Set Your Goal
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: achieved ? 'var(--primary)' : 'var(--text-primary)' }}>
              {goal.toFixed(0)} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: achieved ? 'var(--primary)' : 'var(--text-muted)', fontWeight: achieved ? 600 : 400 }}>
              {achieved ? '🎉 Goal Reached!' : `${remaining.toFixed(0)} kg to go`}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden', marginBottom: '0.375rem' }}>
            <div style={{
              height: '100%',
              width: achieved ? '100%' : `${Math.max(5, (goal / currentMonthly) * 100)}%`,
              background: achieved ? 'var(--primary)' : 'linear-gradient(90deg, var(--accent), var(--primary))',
              borderRadius: 4,
              transition: 'width 0.8s ease',
              boxShadow: achieved ? '0 0 8px var(--primary)' : 'none',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>Goal: {goal.toFixed(0)} kg</span>
            <span>Current: {currentMonthly.toFixed(0)} kg</span>
          </div>
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
            Quick Presets
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.375rem', marginBottom: '0.875rem' }}>
            {PRESETS.map(({ label, factor, fixed }) => {
              const target = fixed ?? Math.round(currentMonthly * (factor ?? 1))
              return (
                <button
                   key={label}
                   onClick={() => saveGoal(target)}
                   style={{
                     background: 'var(--surface-2)', border: '1px solid var(--border)',
                     borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.5rem',
                     cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)',
                     transition: 'all 0.15s', textAlign: 'left',
                   }}
                   onMouseOver={(e) => {
                     (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'
                     ;(e.currentTarget as HTMLElement).style.color = 'var(--primary)'
                   }}
                   onMouseOut={(e) => {
                     (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                     ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                   }}
                >
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{target.toFixed(0)} kg/mo</div>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              className="form-input"
              placeholder="Custom (kg/month)"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{ flex: 1, fontSize: '0.85rem' }}
              aria-label="Custom monthly CO2 goal in kg"
            />
            <button
              onClick={() => { if (inputVal) saveGoal(Number(inputVal)) }}
              className="btn btn-primary btn-sm"
              disabled={!inputVal}
            >Set</button>
          </div>
          {goal && (
            <button
              onClick={clearGoal}
              style={{ marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'underline' }}
            >
              Clear goal
            </button>
          )}
        </div>
      )}
    </div>
  )
}
