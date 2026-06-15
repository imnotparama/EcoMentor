import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface EmissionDonutProps {
  transport: number
  energy: number
  food: number
  shopping: number
  waste: number
}


export default function EmissionDonut({
  transport, energy, food, shopping, waste,
}: EmissionDonutProps) {
  const data = [
    { name: 'Transport', value: transport, color: '#58A6FF' },
    { name: 'Energy', value: energy, color: '#D29922' },
    { name: 'Food', value: food, color: '#3FB950' },
    { name: 'Shopping', value: shopping, color: '#BC8CFF' },
    { name: 'Waste', value: waste, color: '#F85149' },
  ].filter((d) => d.value > 0)

  const total = transport + energy + food + shopping + waste

  return (
    <div style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            aria-label="Emission category breakdown donut chart"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
            formatter={((value: unknown, name: unknown) => [
              `${Number(value).toFixed(1)} kg CO₂`,
              name,
            ]) as never}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '-0.5rem' }}>
        {data.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
          return (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {item.name} <span style={{ color: item.color, fontWeight: 600 }}>{pct}%</span>
              </span>
            </div>
          )
        })}
      </div>

      {/* Accessible data table */}
      <table className="sr-only">
        <caption>Carbon emission breakdown by category</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Emissions (kg CO2/month)</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td>{item.value.toFixed(1)}</td>
              <td>{total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
