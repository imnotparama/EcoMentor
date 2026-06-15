import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus, Award, Trophy, ClipboardList } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'
import { useChallenges } from '@/hooks/useChallenges'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import MonthlyTrend from '@/components/charts/MonthlyTrend'

const BADGE_ICONS: Record<string, string> = {
  'First Assessment': '📋',
  'Platinum Eco Warrior': '🏆',
  'Gold Contributor': '🥇',
  'Silver Steward': '🥈',
  'Bronze Beginner': '🥉',
  'Challenge Accepted': '⚡',
  '5 Challenges Completed': '🌟',
  'Eco Champion': '🌿',
  '30% Reducer': '📉',
  'Carbon Neutral Month': '💎',
}

export default function Progress() {
  const { data, isLoading, load, exportData } = useProgress()
  const { load: loadChallenges } = useChallenges()

  useEffect(() => {
    document.title = 'Progress — EcoMentor AI'
    load()
    loadChallenges()
  }, [])

  if (isLoading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    )
  }

  if (!data || data.entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--primary-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <TrendingUp size={32} color="var(--primary)" />
        </div>
        <h2 style={{ marginBottom: '0.75rem' }}>No Progress Data Yet</h2>
        <p style={{ marginBottom: '2rem' }}>Complete your first assessment to start tracking your sustainability journey.</p>
        <Link to="/assessment" className="btn btn-primary">
          <ClipboardList size={16} />
          Start Assessment
        </Link>
      </div>
    )
  }

  const entries = data.entries
  const latest = entries[entries.length - 1]
  const previous = entries.length > 1 ? entries[entries.length - 2] : null
  const delta = previous ? latest.total_monthly - previous.total_monthly : 0
  const trend = delta < -10 ? 'improving' : delta > 10 ? 'worsening' : 'stable'

  const TrendIcon = trend === 'improving' ? TrendingDown : trend === 'worsening' ? TrendingUp : Minus
  const trendColor = trend === 'improving' ? 'var(--primary)' : trend === 'worsening' ? 'var(--danger)' : 'var(--warning)'

  const chartData = entries.map(e => ({ month_year: e.month_year, total_monthly: e.total_monthly }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Progress</h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>{data.total_assessments} assessment{data.total_assessments !== 1 ? 's' : ''} completed</p>
        </div>
        <button onClick={exportData} className="btn btn-secondary btn-sm" aria-label="Download all your data as JSON">
          📥 Export My Data
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="stats-row">
        {[
          {
            label: 'Latest Score',
            value: latest.sustainability_score.toFixed(0),
            unit: '/ 100',
            color: 'var(--primary)',
          },
          {
            label: 'CO₂ This Month',
            value: latest.total_monthly.toFixed(0),
            unit: 'kg',
            color: 'var(--accent)',
          },
          {
            label: 'CO₂ Saved vs. India',
            value: data.cumulative_co2_saved.toFixed(0),
            unit: 'kg total',
            color: 'var(--primary)',
          },
          {
            label: 'Challenges Done',
            value: data.completed_challenges.length.toString(),
            unit: 'completed',
            color: 'var(--warning)',
          },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '1.25rem',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{unit}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Trend + chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }} className="trend-grid">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Monthly CO₂ Trend</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: trendColor, fontSize: '0.875rem', fontWeight: 600 }}>
              <TrendIcon size={16} />
              {trend === 'improving' ? `↓${Math.abs(delta).toFixed(0)} kg from last month` :
               trend === 'worsening' ? `↑${Math.abs(delta).toFixed(0)} kg from last month` :
               'Stable'}
            </div>
          </div>
          <MonthlyTrend data={chartData} />
        </div>

        {/* Timeline */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Month-by-Month</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[...entries].reverse().map((entry, i) => {
              const prev = i < entries.length - 1 ? [...entries].reverse()[i + 1] : null
              const d = prev ? entry.total_monthly - prev.total_monthly : 0
              return (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  background: i === 0 ? 'var(--primary-dim)' : 'var(--surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: i === 0 ? '1px solid rgba(63,185,80,0.3)' : '1px solid var(--border-subtle)',
                }}>
                  <div style={{ fontSize: '0.8rem', color: i === 0 ? 'var(--primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {entry.month_year}
                    {i === 0 && <span style={{ marginLeft: 4, fontSize: '0.65rem' }}>← Latest</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {entry.total_monthly.toFixed(0)} kg
                    </span>
                    {prev && (
                      <span style={{ fontSize: '0.7rem', color: d < 0 ? 'var(--primary)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                        {d < 0 ? '↓' : '↑'}{Math.abs(d).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Badges */}
      {data.badges.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--warning)" />
            Badges Earned
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {data.badges.map((badge) => (
              <div key={badge} style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.875rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>{BADGE_ICONS[badge] || '🏅'}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed challenges */}
      {data.completed_challenges.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={18} color="var(--primary)" />
            Completed Challenges
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }} className="challenges-grid">
            {data.completed_challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
          .trend-grid { grid-template-columns: 1fr !important; }
          .challenges-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
