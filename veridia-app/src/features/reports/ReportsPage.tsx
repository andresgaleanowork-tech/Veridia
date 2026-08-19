import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, CalendarCheck, TrendingUp, ClipboardList, FileText } from 'lucide-react';
import api from '@/lib/api';
import type { Report, KPIData } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReportGeneratorDialog } from './ReportGeneratorDialog';

export function ReportsPage() {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'list'],
    queryFn: async (): Promise<Report[]> => {
      const res = await api.getPaginated<Report>('/reports/list');
      return res.data;
    },
  });

  const latestKpis: KPIData | undefined = reports.find((r) => r.type === 'kpis')?.result;

  const kpis = latestKpis || {
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    avgAppointmentsPerPatient: 0,
    generatedAt: new Date().toISOString(),
  };

  const kpiCards = [
    { label: 'Pacientes activos', value: kpis.totalPatients, icon: Users, color: 'text-primary' },
    { label: 'Turnos del mes', value: kpis.totalAppointments, icon: CalendarCheck, color: 'text-accent' },
    { label: 'Ingresos del mes', value: `$${kpis.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Prom. turnos/paciente', value: kpis.avgAppointmentsPerPatient, icon: ClipboardList, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Reportes y KPIs</h1>
          <p className="text-sm text-text-3 mt-1">
            Indicadores clave de la práctica
            {kpis.generatedAt && (
              <span className="ml-2 text-text-3">
                · Actualizado: {new Date(kpis.generatedAt).toLocaleString('es-ES')}
              </span>
            )}
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowDialog(true)}>
          Generar reporte
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-3 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl font-bold text-text mt-1">{kpi.value}</p>
              </div>
              <kpi.icon size={24} className={kpi.color} />
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Reportes generados</h2>
        {reportsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/5 rounded w-3/4"></div>
                  <div className="h-3 bg-white/5 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText size={32} className="text-text-3 mx-auto mb-3" />
            <p className="text-sm text-text-3">No hay reportes generados aún.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-text">{r.name}</h4>
                    <p className="text-xs text-text-3 mt-1">{r.type}</p>
                    <p className="text-[10px] text-text-3 mt-1">
                      {new Date(r.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ReportGeneratorDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onGenerated={() => qc.invalidateQueries({ queryKey: ['reports', 'list'] })}
      />
    </div>
  );
}
