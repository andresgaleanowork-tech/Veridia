import { useQuery } from '@tanstack/react-query';
import { Activity, Flame, Footprints, Clock, Zap } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import type { FitnessSummary } from '@/types';

interface FitnessSummaryWidgetProps {
  patientId: string;
}

export function FitnessSummaryWidget({ patientId }: FitnessSummaryWidgetProps) {
  const { data: summary, isLoading } = useQuery<FitnessSummary>({
    queryKey: ['fitness-summary', patientId],
    queryFn: async () => {
      return api.getFitnessSummary(patientId);
    },
    enabled: !!patientId,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Actividad Física</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-2 rounded-lg p-3 border border-border animate-pulse">
              <div className="h-3 bg-surface-3 rounded w-12 mb-2" />
              <div className="h-6 bg-surface-3 rounded w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!summary || summary.totalActivities === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Actividad Física</h3>
        </div>
        <p className="text-sm text-text-3">No hay actividades registradas. Conecta una plataforma fitness para importar datos.</p>
      </Card>
    );
  }

  const stats = [
    { label: 'Pasos', value: summary.totalSteps.toLocaleString('es-ES'), icon: Footprints, color: 'text-primary' },
    { label: 'Min. activos', value: summary.totalActiveMinutes.toLocaleString('es-ES'), icon: Clock, color: 'text-accent' },
    { label: 'Kcal', value: Math.round(summary.totalCaloriesBurned).toLocaleString('es-ES'), icon: Flame, color: 'text-warning' },
    { label: 'Duración', value: `${summary.totalDurationMinutes} min`, icon: Zap, color: 'text-info' },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Actividad Física</h3>
        </div>
        <ActivityFactorBadge factor={summary.activityFactor.factor} label={summary.activityFactor.label} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className={`flex items-center gap-1.5 text-xs text-text-3 mb-1`}>
              <stat.icon size={12} className={stat.color} />
              {stat.label}
            </div>
            <div className="text-lg font-bold text-text tabular-nums">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-text-3">
        {summary.totalActivities} actividad{summary.totalActivities !== 1 ? 'es' : ''} registrada{summary.totalActivities !== 1 ? 's' : ''}
        {summary.totalDistanceMeters > 0 && ` • ${(summary.totalDistanceMeters / 1000).toFixed(2)} km`}
      </div>
    </Card>
  );
}

function ActivityFactorBadge({ factor, label }: { factor: number; label: string }) {
  const colors: Record<string, string> = {
    sedentary: 'bg-surface-3 text-text-3',
    light: 'bg-info-light text-info',
    moderate: 'bg-success-light text-success',
    active: 'bg-warning-light text-warning',
    very_active: 'bg-danger-light text-danger',
    custom: 'bg-primary-glow text-primary border border-primary/30',
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[label] || colors.custom}`}>
      FA {factor.toFixed(2)} · {label.replace('_', ' ')}
    </span>
  );
}
