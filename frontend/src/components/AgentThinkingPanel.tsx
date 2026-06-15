import { useState } from 'react'
import { ChevronDown, ChevronUp, Cpu } from 'lucide-react'

const TOOL_META: Record<string, { label: string; emoji: string; desc: string; color: string }> = {
  get_user_assessment: {
    label: 'get_user_assessment',
    emoji: '📊',
    desc: 'Fetched your real carbon footprint data',
    color: '#3FB950',
  },
  get_emission_benchmarks: {
    label: 'get_emission_benchmarks',
    emoji: '🌍',
    desc: 'Retrieved India & global benchmarks',
    color: '#58A6FF',
  },
  get_progress_history: {
    label: 'get_progress_history',
    emoji: '📈',
    desc: 'Analyzed your historical trend data',
    color: '#BC8CFF',
  },
  generate_challenge: {
    label: 'generate_challenge',
    emoji: '⚡',
    desc: 'Created a personalized eco-challenge',
    color: '#D29922',
  },
}

interface AgentThinkingPanelProps {
  tools: string[]
  isLoading?: boolean
}

export default function AgentThinkingPanel({ tools, isLoading }: AgentThinkingPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (!isLoading && tools.length === 0) return null

  return (
    <div
      style={{
        margin: '0.5rem 0',
        background: 'rgba(63,185,80,0.05)',
        border: '1px solid rgba(63,185,80,0.2)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        fontSize: '0.8rem',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.875rem',
          color: 'var(--primary)',
          textAlign: 'left',
        }}
        aria-expanded={expanded}
        aria-label="Toggle agent tool calls"
      >
        {isLoading ? (
          <span className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(63,185,80,0.3)', borderTopColor: '#3FB950' }} />
        ) : (
          <Cpu size={14} color="var(--primary)" />
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.75rem', flex: 1 }}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Agent thinking
              <span style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'inline-block',
                      animation: `agentDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </span>
            </span>
          ) : (
            `Agent used ${tools.length} tool${tools.length !== 1 ? 's' : ''}`
          )}
        </span>
        {!isLoading && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>

      {/* Expanded tool list */}
      {expanded && !isLoading && (
        <div style={{ padding: '0 0.875rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {tools.map((tool, i) => {
            const meta = TOOL_META[tool] ?? { label: tool, emoji: '🔧', desc: 'Tool executed', color: '#8B949E' }
            return (
              <div
                key={`${tool}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.625rem',
                  background: `${meta.color}12`,
                  border: `1px solid ${meta.color}30`,
                  borderRadius: 'var(--radius-sm)',
                  animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                }}
              >
                <span style={{ fontSize: '1rem' }}>{meta.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: meta.color, fontWeight: 600 }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{meta.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes agentDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
