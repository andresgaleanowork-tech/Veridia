import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BodyCompositionChartProps {
  data: Array<{
    fecha: string;
    grasa_corporal: number;
    masa_muscular: number;
    water: number;
  }>;
}

const COLORS = {
  grasa_corporal: '#EF4444',
  masa_muscular: '#10B981',
  water: '#3B82F6',
};

export default function BodyCompositionChartImpl({ data }: BodyCompositionChartProps) {

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.grasa_corporal} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS.grasa_corporal} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.masa_muscular} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS.masa_muscular} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.water} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS.water} stopOpacity={0.1} />
          </linearGradient>
        </defs>
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
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(11, 17, 32, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#E5E7EB',
          }}
        />
        <Area
          type="monotone"
          dataKey="grasa_corporal"
          stroke={COLORS.grasa_corporal}
          fill="url(#colorFat)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="masa_muscular"
          stroke={COLORS.masa_muscular}
          fill="url(#colorMuscle)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="water"
          stroke={COLORS.water}
          fill="url(#colorWater)"
          stackId="1"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
