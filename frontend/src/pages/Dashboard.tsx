import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Leaf, Globe, Award,
  ClipboardList, ChevronRight, Zap, Car, ShoppingBag, Trash2, Bot, Trophy, Activity
} from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import CarbonHalo from '@/components/profile/CarbonHalo'
import EmissionDonut from '@/components/charts/EmissionDonut'
import MonthlyTrend from '@/components/charts/MonthlyTrend'
import RadarComparison from '@/components/charts/RadarComparison'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import GoalSetter from '@/components/GoalSetter'
import Co2Equivalents from '@/components/Co2Equivalents'
import { challengesApi } from '@/api/challenges'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'

const categoryConfig = {
  transport: { icon: Car, color: '#58A6FF', label: 'Transport' },
  energy: { icon: Zap, color: '#D29922', label: 'Energy' },
  food: { icon: Leaf, color: '#3FB950', label: 'Food' },
  shopping: { icon: ShoppingBag, color: '#BC8CFF', label: 'Shopping' },
  waste: { icon: Trash2, color: '#F85149', label: 'Waste' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
}

function EmptyState() {
  return (
    <div className="card" style={{
      gridColumn: '1 / -1',
      textAlign: 'center', padding: '4rem 2rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--primary-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem',
        boxShadow: '0 0 30px rgba(63,185,80,0.25)',
      }} className="leaf-spin-hover">
        <Leaf size={36} color="var(--primary)" />
      </div>
      <h2 style={{ marginBottom: '0.75rem' }}>Let's Calculate Your Footprint</h2>
      <p style={{ marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem' }}>
        Complete your carbon assessment to unlock your personalized dashboard with AI insights,
        charts, and weekly eco-challenges.
      </p>
      <Link to="/assessment" className="btn btn-primary btn-lg" id="cta-start-assessment">
        <ClipboardList size={18} />
        Start Your Assessment
        <ChevronRight size={18} />
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading, refetch } = useDashboard()
  const [completingId, setCompletingId] = useState<number | null>(null)
  void completingId // suppress unused warning — used indirectly via setCompletingId

  useEffect(() => {
    document.title = 'Dashboard — EcoMentor AI'
    refetch()
  }, [refetch])

  const handleCompleteChallenge = async (id: number) => {
    setCompletingId(id)
    try {
      await challengesApi.complete(id)
      await refetch()
    } finally {
      setCompletingId(null)
    }
  }

  if (isLoading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--primary-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(63,185,80,0.2)',
        }}>
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>Loading your dashboard...</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fetching your sustainability data</p>
        </div>
      </div>
    )
  }

  const assessment = data?.latest_assessment
  const hasData = assessment && assessment.total_monthly
  const monthly = assessment?.total_monthly ?? 0
  const score = assessment?.sustainability_score ?? 0

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--primary-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(63,185,80,0.25)',
          }} className="leaf-spin-hover">
            <Leaf size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Welcome back,{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {data?.user?.name?.split(' ')[0]}
              </span>{' '}
              👋
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/assessment" className="btn btn-secondary btn-sm">
            <ClipboardList size={15} />
            Reassess
          </Link>
          <Link to="/chat" className="btn btn-accent btn-sm" id="btn-ask-ai">
            Ask AI Coach
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {!hasData ? (
        <div style={{ display: 'grid' }}>
          <EmptyState />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Top row: Score card + Benchmarks + Goal */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: '280px 1fr 240px', gap: '1.5rem', alignItems: 'start' }}
            className="top-grid"
          >
            {/* Score Card */}
            <motion.div
              variants={itemVariants}
              className="card scale-hover"
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                boxShadow: '0 0 30px rgba(63,185,80,0.08)',
              }}
            >
              <CarbonHalo score={score} size={170} animated />

              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {monthly.toFixed(0)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>kg CO₂ per month</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.125rem' }}>
                  {(monthly * 12).toFixed(0)} kg/year
                </div>
              </div>

              {/* Badges */}
              {data.badges.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', justifyContent: 'center' }}>
                  {data.badges.slice(0, 4).map((badge) => (
                    <span key={badge} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                      <Award size={9} />
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Benchmark comparison + Category breakdown */}
            <motion.div
              variants={itemVariants}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {[
                {
                  label: 'vs. India Average',
                  icon: <span style={{ fontSize: '1.1rem' }}>🇮🇳</span>,
                  avg: 1900,
                  yours: monthly,
                },
                {
                  label: 'vs. Global Average',
                  icon: <Globe size={16} color="var(--accent)" />,
                  avg: 3333,
                  yours: monthly,
                },
              ].map(({ label, icon, avg, yours }) => {
                const pct = Math.abs(((avg - yours) / avg) * 100).toFixed(0)
                const better = yours < avg
                return (
                  <div key={label} className="card scale-hover" style={{
                    padding: '1.25rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {icon}
                        {label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: better ? 'var(--primary)' : 'var(--danger)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {better ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                        {pct}% {better ? 'below' : 'above'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, (yours / avg) * 100)}%`,
                            background: better
                              ? 'linear-gradient(90deg, #26a641, var(--primary))'
                              : 'linear-gradient(90deg, #da3633, var(--danger))',
                            borderRadius: 4,
                            transition: 'width 1.2s ease',
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>You: {yours.toFixed(0)} kg</span>
                          <span>Avg: {avg.toLocaleString()} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Category breakdown */}
              <div className="card scale-hover" style={{
                padding: '1.25rem',
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={14} color="var(--primary)" />
                  Category Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(categoryConfig).map(([key, cfg]) => {
                    const value = assessment[`${key}_emissions_monthly` as keyof typeof assessment] as number ?? 0
                    const total = assessment.total_monthly ?? 1
                    const pct = (value / total) * 100
                    const Icon = cfg.icon
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Icon size={14} color={cfg.color} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: 64 }}>{cfg.label}</span>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`, background: cfg.color,
                            borderRadius: 3, transition: 'width 1s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 60, textAlign: 'right' }}>
                          {value.toFixed(0)} kg
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Right column: Goal + CO2 Equivalents */}
            <motion.div
              variants={itemVariants}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <GoalSetter currentMonthly={monthly} />
              <Co2Equivalents monthlyKg={monthly} />
            </motion.div>
          </motion.div>

          {/* Charts row */}
          {hasData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="charts-grid">
              <div className="card scale-hover" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Leaf size={14} color="var(--primary)" />
                  Emission Breakdown
                </h3>
                <EmissionDonut
                  transport={assessment.transport_emissions_monthly ?? 0}
                  energy={assessment.energy_emissions_monthly ?? 0}
                  food={assessment.food_emissions_monthly ?? 0}
                  shopping={assessment.shopping_emissions_monthly ?? 0}
                  waste={assessment.waste_emissions_monthly ?? 0}
                />
              </div>

              <div className="card scale-hover" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={14} color="var(--accent)" />
                  Monthly Trend
                </h3>
                {data.progress_history.length > 0 ? (
                  <MonthlyTrend data={data.progress_history} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Complete more assessments over time to see your trend
                  </div>
                )}
              </div>

              <div className="card scale-hover" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Globe size={14} color="var(--warning)" />
                  vs. Benchmarks
                </h3>
                <RadarComparison
                  userEmissions={{
                    transport: assessment.transport_emissions_monthly ?? 0,
                    energy: assessment.energy_emissions_monthly ?? 0,
                    food: assessment.food_emissions_monthly ?? 0,
                    shopping: assessment.shopping_emissions_monthly ?? 0,
                    waste: assessment.waste_emissions_monthly ?? 0,
                  }}
                  indiaAverages={data.benchmarks.category_india_averages as { transport: number; energy: number; food: number; shopping: number; waste: number }}
                />
              </div>
            </div>
          )}

          {/* Bottom row: AI Insights + Challenges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }} className="bottom-grid">
            {/* AI Insights */}
            <div className="card scale-hover" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bot size={18} color="var(--accent)" />
                  AI Insights
                </h3>
                <Link to="/chat" className="btn btn-accent btn-sm" id="btn-chat-ai">Chat with AI</Link>
              </div>

              {data.recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.recommendations.slice(0, 1).map((rec) => (
                    <div key={rec.id} className="markdown-content" style={{ fontSize: '0.875rem', maxHeight: 320, overflowY: 'auto', paddingRight: '0.5rem' }}>
                      <ReactMarkdown>{rec.description.slice(0, 1500)}</ReactMarkdown>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
                  <p>AI analysis is being generated in the background...</p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Usually ready within 30 seconds of completing your assessment
                  </p>
                  <Link to="/chat" className="btn btn-accent btn-sm" style={{ marginTop: '1rem' }}>
                    Chat with your AI coach now
                  </Link>
                </div>
              )}
            </div>

            {/* Active Challenges */}
            <div className="card scale-hover" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Trophy size={16} color="var(--warning)" />
                  Active Challenges
                </h3>
                <Link to="/challenges" className="btn btn-secondary btn-sm">View All</Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {data.active_challenges.length > 0 ? (
                  data.active_challenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onComplete={handleCompleteChallenge}
                    />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <p>No active challenges</p>
                    <Link to="/challenges" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                      Generate a Challenge
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1200px) {
          .top-grid { grid-template-columns: 280px 1fr !important; }
          .top-grid > *:last-child { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        }
        @media (max-width: 1024px) {
          .top-grid { grid-template-columns: 1fr !important; }
          .top-grid > *:last-child { grid-column: 1 !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .top-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
