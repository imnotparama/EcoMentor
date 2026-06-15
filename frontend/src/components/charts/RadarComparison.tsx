import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface RadarComparisonProps {
  userEmissions: {
    transport: number
    energy: number
    food: number
    shopping: number
    waste: number
  }
  indiaAverages: {
    transport: number
    energy: number
    food: number
    shopping: number
    waste: number
  }
}

export default function RadarComparison({ userEmissions, indiaAverages }: RadarComparisonProps) {
  // Normalize: user performance as % of India average (100 = same as India, 0 = zero emissions)
  const data = [
    {
      category: 'Transport',
      user: Math.min(100, (userEmissions.transport / indiaAverages.transport) * 100),
      india: 100,
    },
    {
      category: 'Energy',
      user: Math.min(100, (userEmissions.energy / indiaAverages.energy) * 100),
      india: 100,
    },
    {
      category: 'Food',
      user: Math.min(100, (userEmissions.food / indiaAverages.food) * 100),
      india: 100,
    },
    {
      category: 'Shopping',
      user: Math.min(100, (userEmissions.shopping / indiaAverages.shopping) * 100),
      india: 100,
    },
    {
      category: 'Waste',
      user: Math.min(100, (userEmissions.waste / indiaAverages.waste) * 100),
      india: 100,
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          />
          <Radar
            name="India Average"
            dataKey="india"
            stroke="var(--border)"
            fill="var(--border)"
            fillOpacity={0.2}
          />
          <Radar
            name="You"
            dataKey="user"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.3}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
            formatter={((value: unknown, name: unknown) => [
              `${Number(value).toFixed(0)}% of India avg`,
              name,
            ]) as never}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
        Lower % = Better performance vs. India average
      </p>

      {/* Accessible table */}
      <table className="sr-only">
        <caption>Your emissions vs India average by category</caption>
        <thead>
          <tr><th>Category</th><th>Your Emissions (kg)</th><th>India Average (kg)</th><th>% of Average</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.category}>
              <td>{d.category}</td>
              <td>{userEmissions[d.category.toLowerCase() as keyof typeof userEmissions]?.toFixed(1)}</td>
              <td>{indiaAverages[d.category.toLowerCase() as keyof typeof indiaAverages]}</td>
              <td>{d.user.toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
