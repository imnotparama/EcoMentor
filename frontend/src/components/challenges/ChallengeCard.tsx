import { useState } from 'react'
import { CheckCircle2, Leaf, Zap, ShoppingBag, Trash2, Car, Trophy, Clock } from 'lucide-react'
import type { Challenge } from '@/api/types'

const categoryConfig = {
  transport: { icon: Car, color: '#58A6FF', bg: 'rgba(88,166,255,0.1)', border: 'rgba(88,166,255,0.3)' },
  energy: { icon: Zap, color: '#D29922', bg: 'rgba(210,153,34,0.1)', border: 'rgba(210,153,34,0.3)' },
  food: { icon: Leaf, color: '#3FB950', bg: 'rgba(63,185,80,0.1)', border: 'rgba(63,185,80,0.3)' },
  shopping: { icon: ShoppingBag, color: '#BC8CFF', bg: 'rgba(188,140,255,0.1)', border: 'rgba(188,140,255,0.3)' },
  waste: { icon: Trash2, color: '#F85149', bg: 'rgba(248,81,73,0.1)', border: 'rgba(248,81,73,0.3)' },
}

interface ChallengeCardProps {
  challenge: Challenge
  onComplete?: (id: number) => Promise<void>
}

export default function ChallengeCard({ challenge, onComplete }: ChallengeCardProps) {
  const [completing, setCompleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const category = challenge.category as keyof typeof categoryConfig
  const config = categoryConfig[category] || categoryConfig.energy
  const Icon = config.icon

  const handleComplete = async () => {
    if (!onComplete || challenge.completed || completing) return
    setCompleting(true)
    try {
      await onComplete(challenge.id)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 800)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div
      className={showCelebration ? 'celebrating-card' : ''}
      style={{
        background: challenge.completed ? 'rgba(63,185,80,0.04)' : 'var(--surface-2)',
        border: `1px solid ${challenge.completed ? 'rgba(63,185,80,0.4)' : config.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!challenge.completed) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${config.color}18`
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      {/* Subtle top glow bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: challenge.completed
          ? 'linear-gradient(90deg, transparent, #3FB950, transparent)'
          : `linear-gradient(90deg, transparent, ${config.color}80, transparent)`,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: config.bg,
          border: `1px solid ${config.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={20} color={config.color} aria-hidden="true" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: '0.9rem', color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
          }}>
            {challenge.title}
            {challenge.completed && (
              <CheckCircle2 size={15} color="#3FB950" aria-label="Completed" />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 3 }}>
            <span style={{
              fontSize: '0.7rem', color: config.color, fontWeight: 600,
              background: config.bg, border: `1px solid ${config.border}`,
              borderRadius: 10, padding: '0.1rem 0.4rem',
              fontFamily: 'var(--font-mono)',
            }}>
              {challenge.category}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <Clock size={10} />
              {challenge.duration_days} days
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '0.825rem', color: 'var(--text-secondary)',
        lineHeight: 1.6, margin: 0,
      }}>
        {challenge.description}
      </p>

      {/* Stats + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          background: 'rgba(63,185,80,0.1)',
          border: '1px solid rgba(63,185,80,0.25)',
          borderRadius: 20, padding: '0.25rem 0.625rem',
        }}>
          <Leaf size={11} color="#3FB950" />
          <span style={{ fontSize: '0.72rem', color: '#3FB950', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            ~{challenge.estimated_co2_saving_kg} kg CO₂ saved
          </span>
        </div>

        {!challenge.completed && onComplete && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="btn btn-primary btn-sm"
            aria-label={`Mark "${challenge.title}" as complete`}
            id={`btn-complete-${challenge.id}`}
          >
            {completing ? (
              <span className="spinner" style={{ width: 13, height: 13 }} />
            ) : (
              <>
                <Trophy size={13} />
                Done!
              </>
            )}
          </button>
        )}

        {challenge.completed && (
          <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} />
            {challenge.completed_at
              ? new Date(challenge.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : 'Completed'}
          </span>
        )}
      </div>

      {showCelebration && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '2.5rem',
          pointerEvents: 'none',
          zIndex: 10,
          animation: 'emoji-burst 0.7s forwards',
          display: 'flex',
          gap: '0.5rem',
        }}>
          <span>🎉</span>
          <span>🌿</span>
          <span>🌟</span>
        </div>
      )}

      <style>{`
        @keyframes scale-pulse {
          0% { transform: scale(1); }
          30% { transform: scale(1.04); border-color: #3FB950; box-shadow: 0 0 20px rgba(63, 185, 80, 0.4); }
          60% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes emoji-burst {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
          30% { transform: translate(-50%, -80%) scale(1.8) rotate(15deg); opacity: 1; }
          80% { transform: translate(-50%, -100%) scale(1.5) rotate(-15deg); opacity: 1; }
          100% { transform: translate(-50%, -120%) scale(0) rotate(0deg); opacity: 0; }
        }
        .celebrating-card {
          animation: scale-pulse 0.7s ease-in-out;
        }
      `}</style>
    </div>
  )
}
