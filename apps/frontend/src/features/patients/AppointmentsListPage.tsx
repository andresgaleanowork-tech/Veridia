import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import api from '@/lib/api';
import type { Appointment } from '@/types';

export function AppointmentsListPage() {
  const { id: patientId } = useParams<{ id: string }>();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: async (): Promise<Appointment[]> => {
      const res = await api.get(`/patients/${patientId}/appointments`);
      return res.data.appointments || res.data.data || res.data || [];
    },
    enabled: !!patientId,
  });

  const statusColors: Record<string, string> = {
    Pendiente: 'bg-warning-light text-warning border-warning/20',
    Confirmada: 'bg-info-light text-info border-info/20',
    Realizada: 'bg-success-light text-success border-success/20',
    'No asistió': 'bg-danger-light text-danger border-danger/20',
    Cancelada: 'bg-surface-3 text-text-3 border-border',
  };

  const tipoColors: Record<string, string> = {
    'Primera consulta': 'bg-primary/10 text-primary',
    'Seguimiento': 'bg-accent/10 text-accent',
    'Control': 'bg-info/10 text-info',
    'Urgencia': 'bg-danger/10 text-danger',
  };

  return (
    <div className="space-y-6">
      <Link to={`/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
        <ArrowLeft size={14} /> Volver al paciente
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-text">Citas</h1>
        <p className="text-text-3 text-sm mt-1">Historial de citas del paciente</p>
      </div>

      {isLoading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-3 text-sm">Cargando citas...</p>
        </div>
      ) : !appointments?.length ? (
        <div className="glass-card p-12 text-center">
          <Calendar size={32} className="text-text-3 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">Sin citas</h3>
          <p className="text-text-3 text-sm">No hay citas registradas para este paciente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((c) => (
            <div key={c.id} className="glass-card p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start gap-4">
                {/* Date badge */}
                <div className="text-center min-w-[56px] bg-surface-2 rounded-lg p-2 border border-border">
                  <div className="text-[10px] text-text-3 uppercase">{new Date(c.fecha).toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                  <div className="text-2xl font-bold text-primary leading-tight">{new Date(c.fecha).getDate()}</div>
                  <div className="text-[10px] text-text-3">{new Date(c.fecha).toLocaleDateString('es-ES', { month: 'short' })}</div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text">{c.asunto || c.tipo || 'Consulta'}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[c.estado] || 'bg-surface-3 text-text-3 border-border'}`}>
                      {c.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> {c.hora}</span>
                    <span>{c.duracion || 30} min</span>
                    {c.precio && <span>{c.precio} €</span>}
                  </div>
                  {c.tipo && c.tipo !== c.asunto && (
                    <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${tipoColors[c.tipo] || 'bg-surface-3 text-text-3'}`}>
                      {c.tipo}
                    </span>
                  )}
                  {c.nota && (
                    <p className="mt-2 text-xs text-text-3 bg-surface-2 rounded-lg px-3 py-2 line-clamp-2">{c.nota}</p>
                  )}
                </div>

                {/* Price */}
                {c.precio && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-text">{c.precio}€</div>
                    <div className="text-[10px] text-text-3">{c.pago || 'Pendiente'}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
