import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import type { Analitica } from '@/types';

export function AnalyticsPage() {
  const { id: patientId } = useParams<{ id: string }>();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['analytics', patientId],
    queryFn: async (): Promise<Analitica[]> => {
      const res = await api.get(`/patients/${patientId}/analytics`);
      return res.data.analyses || res.data.data || res.data || [];
    },
    enabled: !!patientId,
  });

  const getAlertColor = (alert?: string) => {
    if (alert === 'peligro') return 'text-danger bg-danger-light border-danger/20';
    if (alert === 'advertencia') return 'text-warning bg-warning-light border-warning/20';
    return 'text-text bg-surface-2 border-border';
  };

  const getAlertIcon = (alert?: string) => {
    if (alert === 'peligro' || alert === 'advertencia') return <AlertTriangle size={12} />;
    return null;
  };

  return (
    <div className="space-y-6">
      <Link to={`/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
        <ArrowLeft size={14} /> Volver al paciente
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-text">Analíticas</h1>
        <p className="text-text-3 text-sm mt-1">Análisis clínicos y biomarcadores</p>
      </div>

      {isLoading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-3 text-sm">Cargando analíticas...</p>
        </div>
      ) : !analyses?.length ? (
        <div className="glass-card p-12 text-center">
          <FlaskConical size={32} className="text-text-3 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">Sin analíticas</h3>
          <p className="text-text-3 text-sm">No hay análisis clínicos registrados para este paciente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((a) => (
            <div key={a.id} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-text">
                    {new Date(a.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  {a.ayuno !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.ayuno ? 'bg-success-light text-success' : 'bg-surface-3 text-text-3'}`}>
                      {a.ayuno ? 'En ayunas' : 'Sin ayuno'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {a.marcadores?.map((m, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${getAlertColor(m.alerta)}`}>
                    <div className="flex-1">
                      <div className="text-xs opacity-70">{m.nombre}</div>
                      <div className="font-bold text-lg leading-tight">
                        {m.valor} <span className="text-xs font-normal opacity-70">{m.unidad || ''}</span>
                      </div>
                      {m.referencia && (
                        <div className="text-[10px] opacity-60 mt-0.5">Ref: {m.referencia}</div>
                      )}
                    </div>
                    {getAlertIcon(m.alerta) && (
                      <div className="shrink-0">{getAlertIcon(m.alerta)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
