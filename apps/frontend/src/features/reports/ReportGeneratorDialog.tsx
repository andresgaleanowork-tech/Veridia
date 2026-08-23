import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calendar } from 'lucide-react';
import api from '@/lib/api';
import type { ReportType, Patient } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ReportTemplateSelector } from './ReportTemplateSelector';

interface ReportGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  patient?: Patient;
  onGenerated?: () => void;
}

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'paciente_completo', label: 'Informe Completo' },
  { value: 'nutricional', label: 'Informe Nutricional' },
  { value: 'clinico', label: 'Informe Clínico' },
  { value: 'evolucion', label: 'Evolución' },
  { value: 'kpis', label: 'KPIs de práctica' },
];

export function ReportGeneratorDialog({ open, onClose, patient, onGenerated }: ReportGeneratorDialogProps) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<ReportType>('paciente_completo');
  const [plantilla, setPlantilla] = useState('default');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [titulo, setTitulo] = useState('');
  const [name, setName] = useState('KPIs de práctica');

  const kpiMutation = useMutation({
    mutationFn: (payload: { name: string; type: string; params?: Record<string, unknown> }) =>
      api.generatePracticeKPIReport(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports', 'list'] });
      onGenerated?.();
      onClose();
    },
  });

  const patientMutation = useMutation({
    mutationFn: () => {
      if (!patient) throw new Error('Paciente requerido');
      return api.generateReport({
        paciente_id: patient.id,
        tipo,
        plantilla,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        titulo: titulo || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      onGenerated?.();
      onClose();
    },
  });

  const isKpi = tipo === 'kpis';
  const mutation = isKpi ? kpiMutation : patientMutation;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isKpi) {
      kpiMutation.mutate({ name, type: 'kpis', params: {} });
    } else {
      patientMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Generar Informe" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs text-text-3 mb-1 block">Tipo de informe</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ReportType)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          >
            {REPORT_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>

        {isKpi ? (
          <div>
            <label className="text-xs text-text-3 mb-1 block">Nombre del reporte</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del reporte" />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-text-3 mb-1 block">Plantilla</label>
              <ReportTemplateSelector selectedTemplate={plantilla} onSelect={setPlantilla} reportType={tipo} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-3 mb-1 block">Fecha inicio</label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  leftIcon={<Calendar size={14} />}
                />
              </div>
              <div>
                <label className="text-xs text-text-3 mb-1 block">Fecha fin</label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  leftIcon={<Calendar size={14} />}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-text-3 mb-1 block">Título personalizado</label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Opcional" />
            </div>
          </>
        )}

        {mutation.isError && (
          <p className="text-xs text-danger">{(mutation.error as Error).message}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" icon={<FileText size={14} />} disabled={mutation.isPending}>
            {mutation.isPending ? 'Generando...' : 'Generar Informe'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
