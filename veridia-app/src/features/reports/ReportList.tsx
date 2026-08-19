import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Calendar } from 'lucide-react';
import api from '@/lib/api';
import type { Report } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ReportListProps {
  patientId?: string;
}

export function ReportList({ patientId }: ReportListProps) {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', 'list', patientId],
    queryFn: async (): Promise<Report[]> => {
      const res = await api.getPaginated<Report>('/reports/list' + (patientId ? `?paciente_id=${patientId}` : ''));
      return res.data;
    },
  });

  const handleDownload = async (report: Report) => {
    try {
      const blob = await api.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${report.type}_${report.id}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const getTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      paciente_completo: 'Completo',
      nutricional: 'Nutricional',
      clinico: 'Clínico',
      evolucion: 'Evolución',
      kpis: 'KPIs de práctica',
    };
    return map[t] || t;
  };

  if (isLoading) {
    return (
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
    );
  }

  if (!reports.length) {
    return (
      <Card className="p-8 text-center">
        <FileText size={32} className="text-text-3 mx-auto mb-3" />
        <p className="text-sm text-text-3">No hay informes generados.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reports.map((r) => (
        <Card key={r.id} className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text">{r.name}</h4>
              <p className="text-xs text-text-3 mt-0.5">{getTypeLabel(r.type)}</p>
              <div className="flex items-center gap-1 text-[10px] text-text-3 mt-1">
                <Calendar size={10} />
                {new Date(r.createdAt).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleDownload(r)} title="Descargar HTML">
            <Download size={14} />
          </Button>
        </Card>
      ))}
    </div>
  );
}
