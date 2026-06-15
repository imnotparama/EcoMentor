interface Co2EquivalentsProps {
  monthlyKg: number
}

const EQUIVALENTS = [
  { icon: '🌳', label: 'trees needed', factor: 1 / 21.77, unit: 'trees/month', desc: 'to offset your footprint' },
  { icon: '✈️', label: 'short flights', factor: 1 / 255, unit: 'flights', desc: 'equivalent (Mumbai→Delhi)' },
  { icon: '🚗', label: 'km by car', factor: 1 / 0.21, unit: 'km/month', desc: 'in a petrol vehicle' },
  { icon: '\uD83D\uDCA1', label: 'kWh electricity', factor: 1 / 0.82, unit: 'kWh/month', desc: "on India's grid" },
]

function AnimatedNumber({ value }: { value: number }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
      {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value >= 10 ? Math.round(value).toLocaleString() : value.toFixed(1)}
    </span>
  )
}

export default function Co2Equivalents({ monthlyKg }: Co2EquivalentsProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
    }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span>🌍</span> Your {monthlyKg.toFixed(0)} kg CO₂ equals...
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
        {EQUIVALENTS.map(({ icon, label, factor, desc }) => {
          const computed = monthlyKg * factor
          return (
            <div
              key={label}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.625rem 0.75rem',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)' }}
            >
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontSize: '1rem', color: 'var(--warning)' }}>
                <AnimatedNumber value={computed} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
