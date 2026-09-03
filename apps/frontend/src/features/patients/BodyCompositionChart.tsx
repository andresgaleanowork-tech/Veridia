import { Suspense, lazy } from 'react';
import { Card } from '@/components/ui/Card';

/**
 * Carga diferida de recharts (ver nota en WeightTrendChart.tsx).
 *
 * Ambas gráficas comparten el mismo chunk de recharts: la primera que se monte
 * lo descarga y la segunda lo reutiliza desde la caché del navegador.
 */
const BodyCompositionChartImpl = lazy(() => import('./BodyCompositionChart.impl'));

interface BodyCompositionChartProps {
  data: Array<{
    fecha: string;
    grasa_corporal: number;
    masa_muscular: number;
    water: number;
  }>;
}

function ChartPlaceholder({ message }: { message?: string }) {
  if (message) {
    return (
      <Card>
        <div className="p-8 text-center text-text-3 text-sm">{message}</div>
      </Card>
    );
  }

  return (
    <div
      className="h-[320px] w-full animate-pulse rounded-lg bg-white/5"
      role="status"
      aria-label="Cargando gráfica"
    />
  );
}

export function BodyCompositionChart({ data }: BodyCompositionChartProps) {
  if (!data.length) {
    return <ChartPlaceholder message="No hay datos disponibles para mostrar" />;
  }

  return (
    <Suspense fallback={<ChartPlaceholder />}>
      <BodyCompositionChartImpl data={data} />
    </Suspense>
  );
}
