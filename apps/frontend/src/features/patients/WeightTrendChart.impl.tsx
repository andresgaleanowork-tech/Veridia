import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightTrendChartProps {
  data: Array<{ fecha: string; value: number }>;
  metric: string;
}

export default function WeightTrendChartImpl({ data, metric }: WeightTrendChartProps) {

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="fecha"
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: metric, angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: 12 } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(11, 17, 32, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#E5E7EB',
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0891B2"
          strokeWidth={2}
          dot={{ fill: '#0891B2', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#0891B2' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
