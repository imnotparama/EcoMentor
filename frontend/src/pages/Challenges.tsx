import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, RefreshCw, Plus } from 'lucide-react'
import { useChallenges } from '@/hooks/useChallenges'
import ChallengeCard from '@/components/challenges/ChallengeCard'

export default function Challenges() {
  const { challenges, isLoading, error, load, complete, generate } = useChallenges()

  useEffect(() => {
    document.title = 'Challenges — EcoMentor AI'
    load()
  }, [])

  const active = challenges.filter((c) => !c.completed)
  const completed = challenges.filter((c) => c.completed)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Trophy size={24} color="var(--warning)" />
            Eco Challenges
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {completed.length} completed · {active.length} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={load} className="btn btn-secondary btn-sm" aria-label="Refresh challenges">
            <RefreshCw size={14} />
          </button>
          <button onClick={generate} className="btn btn-primary btn-sm" id="btn-generate-challenge" aria-label="Generate a new challenge">
            <Plus size={15} />
            New Challenge
          </button>
        </div>
      </div>

      {isLoading && challenges.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      )}

      {error && (
        <div role="alert" style={{ background: 'var(--danger-dim)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Active Challenges</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="challenges-grid">
            {active.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onComplete={complete} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Completed</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="challenges-grid">
            {completed.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
          </div>
        </div>
      )}

      {challenges.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <Trophy size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.75rem' }}>No challenges yet</h2>
          <p style={{ marginBottom: '2rem' }}>Complete your assessment first, then generate a personalized challenge.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/assessment" className="btn btn-secondary">Take Assessment</Link>
            <button onClick={generate} className="btn btn-primary">Generate Challenge</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .challenges-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
