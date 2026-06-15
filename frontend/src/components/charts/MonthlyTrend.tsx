import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface MonthlyTrendProps {
  data: Array<{
    month_year: string
    total_monthly: number
  }>
  indiaAverage?: number
}

export default function MonthlyTrend({ data, indiaAverage = 1900 }: MonthlyTrendProps) {
  const chartData = data.map((d) => ({
    month: d.month_year.slice(5), // "MM"
    label: new Date(d.month_year + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    kg: Math.round(d.total_monthly),
  }))

  return (
    <div style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
            formatter={((value: unknown) => [`${value} kg CO₂`, 'Total Emissions']) as never}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          <ReferenceLine
            y={indiaAverage}
            stroke="var(--warning)"
            strokeDasharray="5 5"
            label={{ value: 'India Avg', fill: 'var(--warning)', fontSize: 10, position: 'right' }}
          />
          <Bar
            dataKey="kg"
            fill="var(--accent)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Accessible table */}
      <table className="sr-only">
        <caption>Monthly carbon emissions trend</caption>
        <thead>
          <tr><th>Month</th><th>Total Emissions (kg CO2)</th></tr>
        </thead>
        <tbody>
          {chartData.map((d) => (
            <tr key={d.label}><td>{d.label}</td><td>{d.kg}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
