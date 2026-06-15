import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Zap, MessageSquare, TrendingUp, Trophy, Shield, ArrowRight, Bot, Cpu, CheckCircle2, ChevronRight } from 'lucide-react'
import CarbonHalo from '@/components/profile/CarbonHalo'
import ParticleBackground from '@/components/ParticleBackground'

const features = [
  {
    icon: Zap,
    color: '#D29922',
    title: 'Carbon Assessment',
    desc: '5-step wizard covering transport, energy, food, shopping, and waste. Scientifically grounded with India CEA 2023 data.',
  },
  {
    icon: Bot,
    color: '#58A6FF',
    title: 'AI Agentic Coach',
    desc: 'Claude AI uses real tool-calling to ground every response in YOUR actual data — not generic advice.',
  },
  {
    icon: Trophy,
    color: '#3FB950',
    title: 'Weekly Challenges',
    desc: 'Personalized eco-challenges mapped to your highest-impact category. Track completions and earn badges.',
  },
  {
    icon: TrendingUp,
    color: '#BC8CFF',
    title: 'Progress Tracking',
    desc: 'Month-over-month trends, cumulative CO₂ saved vs. India average, and a sustainability roadmap.',
  },
  {
    icon: MessageSquare,
    color: '#F85149',
    title: 'AI Chat Assistant',
    desc: 'Ask anything: "Compare my footprint to Chennai", "Give me a 30-day plan". Full agentic tool-use.',
  },
  {
    icon: Shield,
    color: '#8B949E',
    title: 'Privacy First',
    desc: 'All data scoped to your account. JWT auth, bcrypt passwords, no data sharing.',
  },
]

const stats = [
  { value: '0.82', unit: 'kg CO₂/kWh', label: 'India Grid Factor (CEA 2023)' },
  { value: '1,900', unit: 'kg/month', label: 'India Average Footprint' },
  { value: '4', unit: 'AI Tools', label: 'Claude Agentic Tool-Use' },
  { value: '5', unit: 'Categories', label: 'Full Lifestyle Coverage' },
]

// Animated agentic demo steps
const DEMO_STEPS = [
  { tool: 'get_user_assessment', emoji: '📊', color: '#3FB950', label: 'Fetching your carbon data...', delay: 800 },
  { tool: 'get_emission_benchmarks', emoji: '🌍', color: '#58A6FF', label: 'Comparing with India averages...', delay: 1800 },
  { tool: 'get_progress_history', emoji: '📈', color: '#BC8CFF', label: 'Analyzing your trend history...', delay: 2800 },
  { tool: 'generate_challenge', emoji: '⚡', color: '#D29922', label: 'Generating personalized challenge...', delay: 3800 },
]

function AgenticDemoAnimation() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return
      setStarted(true)
      observer.disconnect()

      DEMO_STEPS.forEach((step, i) => {
        setTimeout(() => {
          setVisibleSteps((prev) => [...prev, i])
        }, step.delay)
      })

      setTimeout(() => setShowResult(true), 5000)
    }, { threshold: 0.4 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  return (
    <div ref={ref} style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.75rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem',
    }}>
      {/* User query */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.5rem' }}>USER MESSAGE</div>
        <div style={{
          background: 'var(--accent-dim)', border: '1px solid rgba(88,166,255,0.2)',
          borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', color: 'var(--text-primary)',
          fontSize: '0.85rem',
        }}>
          "What's my biggest emission source and what can I do about it?"
        </div>
      </div>

      {/* Tool calls */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.625rem' }}>
          CLAUDE AUTONOMOUS TOOL CALLS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DEMO_STEPS.map((step, i) => (
            <div
              key={step.tool}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                background: visibleSteps.includes(i) ? `${step.color}12` : 'var(--surface-2)',
                border: `1px solid ${visibleSteps.includes(i) ? `${step.color}35` : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.4s ease',
                opacity: visibleSteps.includes(i) ? 1 : 0.35,
              }}
            >
              {visibleSteps.includes(i) ? (
                <CheckCircle2 size={14} color={step.color} />
              ) : (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid var(--border)` }} />
              )}
              <span style={{ color: step.color, fontWeight: 600 }}>{step.emoji} {step.tool}</span>
              {visibleSteps.includes(i) && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 'auto' }}>✓ done</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI response */}
      <div style={{
        opacity: showResult ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.5rem' }}>CLAUDE RESPONSE</div>
        <div style={{
          background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.25)',
          borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem',
          color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.7,
        }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>🌿 Energy is your #1 source</span> at{' '}
          <span style={{ color: 'var(--warning)', fontWeight: 700 }}>900 kg/month</span>, which is 45% above India's
          average of 620 kg. Your AC usage accounts for ~40% of this. I've generated a{' '}
          <span style={{ color: '#D29922', fontWeight: 600 }}>7-Day AC Reduction Challenge</span> that can save{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>73.5 kg CO₂</span> this month.
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  useEffect(() => {
    document.title = 'EcoMentor AI — Your Personal Sustainability Coach'
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <ParticleBackground count={20} />

      {/* Navigation */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)',
        padding: '0 2rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3FB950, #26a641)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(63,185,80,0.4)',
            }}>
              <Leaf size={18} color="#0D1117" aria-hidden="true" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              EcoMentor <span style={{ color: 'var(--primary)' }}>AI</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/login" className="btn btn-secondary btn-sm" id="nav-login">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm" id="nav-register">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          padding: 'clamp(4rem, 10vw, 8rem) 2rem',
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          alignItems: 'center', gap: '4rem',
          position: 'relative', zIndex: 1,
        }}
        className="hero-grid"
      >
        <div className="animate-fade-in">
          {/* Hackathon badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.25)',
            borderRadius: 20, padding: '0.375rem 0.875rem', marginBottom: '1.5rem',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3FB950', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.8rem', color: '#3FB950', fontWeight: 500 }}>
              Agentic Wars Hackathon — Challenge 3
            </span>
          </div>

          <h1 style={{ marginBottom: '1.25rem', lineHeight: 1.1 }}>
            Your Personal{' '}
            <span style={{
              background: 'linear-gradient(90deg, #3FB950, #58A6FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              AI Sustainability
            </span>{' '}
            Coach
          </h1>

          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', maxWidth: 520, lineHeight: 1.7 }}>
            Calculate your carbon footprint, get AI-powered insights using Claude's agentic tool-calling,
            complete weekly eco-challenges, and track your journey toward a sustainable lifestyle.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" id="cta-register">
              Start Your Assessment
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg" id="cta-login">
              Sign In
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'India-Specific Data', icon: '🇮🇳' },
              { label: 'Claude AI Agentic', icon: '🤖' },
              { label: 'Open Source', icon: '🌿' },
            ].map(({ label, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span>{icon}</span>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual — Carbon Halo demo */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
          position: 'relative', zIndex: 1,
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', width: 340, height: 340, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(63,185,80,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div className="animate-float">
            <CarbonHalo score={67} size={200} animated />
          </div>

          <div style={{
            background: 'rgba(22,27,34,0.8)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.5rem',
            width: '100%', maxWidth: 360,
            textAlign: 'center',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Monthly Footprint Comparison
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {[
                { label: 'You', value: '1,247', color: '#3FB950' },
                { label: 'India Avg', value: '1,900', color: '#D29922' },
                { label: 'Global Avg', value: '3,333', color: '#F85149' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '1.1rem',
                    fontWeight: 700, color,
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kg CO₂</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="stats-grid">
          {stats.map(({ value, unit, label }) => (
            <div key={label} style={{ textAlign: 'center', padding: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>{value}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{unit}</span>
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Agentic demo section — KEY DIFFERENTIATOR */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) 2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="demo-grid">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--accent-dim)', border: '1px solid rgba(88,166,255,0.3)',
              borderRadius: 20, padding: '0.375rem 0.875rem', marginBottom: '1.5rem',
            }}>
              <Cpu size={14} color="var(--accent)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500 }}>
                True Agentic AI — Not Just a Chatbot
              </span>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Claude Uses Real Tools</h2>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.8 }}>
              When you ask EcoMentor a question, Claude doesn't just make up an answer. It autonomously
              calls tools to fetch <strong style={{ color: 'var(--text-primary)' }}>your actual data</strong>,
              compare against <strong style={{ color: 'var(--text-primary)' }}>India's averages</strong>, and
              generate a <strong style={{ color: 'var(--text-primary)' }}>personalized challenge</strong> — all
              in a single agentic loop.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
              {[
                { tool: 'get_user_assessment', color: '#3FB950', desc: 'Fetches your real emission data' },
                { tool: 'get_emission_benchmarks', color: '#58A6FF', desc: 'Retrieves India & global averages' },
                { tool: 'get_progress_history', color: '#BC8CFF', desc: 'Analyzes your improvement trend' },
                { tool: 'generate_challenge', color: '#D29922', desc: 'Creates a personalized eco-challenge' },
              ].map(({ tool, color, desc }) => (
                <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
                    boxShadow: `0 0 8px ${color}`,
                  }} />
                  <code style={{ background: 'var(--surface-2)', padding: '0.2em 0.5em', borderRadius: 4, color, fontSize: '0.8em', border: `1px solid ${color}30` }}>
                    {tool}
                  </code>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="btn btn-primary btn-lg" id="cta-agentic">
              Try It Free
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Live demo animation */}
          <AgenticDemoAnimation />
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) 2rem', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Everything You Need to Go Green</h2>
          <p style={{ maxWidth: 560, margin: '0 auto' }}>
            Built for India's context — using India's actual grid emission factor, comparing against
            national averages, and providing India-specific tips and challenges.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }} className="features-grid">
          {features.map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="card"
              style={{
                transition: 'all 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-4px)'
                el.style.borderColor = color
                el.style.boxShadow = `0 8px 24px ${color}20`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.borderColor = 'var(--border)'
                el.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${color}18`,
                border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Icon size={22} color={color} aria-hidden="true" />
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: 'clamp(3rem, 8vw, 5rem) 2rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Get Started in 3 Steps</h2>
          <p style={{ marginBottom: '3rem' }}>Your personalized sustainability journey starts in minutes.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'left' }} className="steps-grid">
            {[
              { step: '01', icon: '📋', title: 'Take the Assessment', desc: 'Answer 5 categories of questions about your transport, energy, food, shopping & waste habits.' },
              { step: '02', icon: '🤖', title: 'Get AI Analysis', desc: "Claude's agentic loop fetches your data, compares to India averages, and generates a personalized report." },
              { step: '03', icon: '🌿', title: 'Track & Improve', desc: 'Complete weekly challenges, watch your score improve month-over-month, earn badges.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                    color: 'var(--primary)', background: 'var(--primary-dim)', border: '1px solid rgba(63,185,80,0.3)',
                    padding: '0.2rem 0.5rem', borderRadius: 6,
                  }}>{step}</div>
                  <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                </div>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/register" className="btn btn-primary btn-lg" id="cta-bottom">
              Start Free Now
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.825rem',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Leaf size={14} color="var(--primary)" />
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>EcoMentor AI</span>
        </div>
        <p style={{ margin: 0 }}>Built for Google Agentic Wars Hackathon — Challenge 3 · Carbon data based on IPCC 2023 &amp; India CEA 2023</p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .demo-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
