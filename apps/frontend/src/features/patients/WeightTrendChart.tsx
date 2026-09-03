import { Suspense, lazy } from 'react';
import { Card } from '@/components/ui/Card';

/**
 * Carga diferida de recharts.
 *
 * recharts pesa ~360 kB sin comprimir y solo se usa en dos gráficas. Con un
 * import estático entraba entero en el chunk de AnthropometryPage, así que la
 * página tardaba en pintar aunque el usuario no llegara a ver la gráfica.
 *
 * El componente real vive en `WeightTrendChart.impl.tsx` y se pide con
 * `lazy()`, de modo que la librería viaja en su propio chunk y solo se
 * descarga cuando hay datos que representar.
 */
const WeightTrendChartImpl = lazy(() => import('./WeightTrendChart.impl'));

interface WeightTrendChartProps {
  data: Array<{ fecha: string; value: number }>;
  metric: string;
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

export function WeightTrendChart({ data, metric }: WeightTrendChartProps) {
  // Sin datos no hace falta bajar recharts.
  if (!data.length) {
    return <ChartPlaceholder message="No hay datos disponibles para mostrar" />;
  }

  return (
    <Suspense fallback={<ChartPlaceholder />}>
      <WeightTrendChartImpl data={data} metric={metric} />
    </Suspense>
  );
}
