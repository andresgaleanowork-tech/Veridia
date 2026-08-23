import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ReportTemplate, ReportType } from '@/types';

interface ReportTemplateSelectorProps {
  selectedTemplate: string;
  onSelect: (template: string) => void;
  reportType: ReportType;
}

export function ReportTemplateSelector({ selectedTemplate, onSelect, reportType }: ReportTemplateSelectorProps) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['report-templates', reportType],
    queryFn: async (): Promise<ReportTemplate[]> => {
      const all = await api.getReportTemplates();
      return all.filter((t) => t.tipo === reportType && t.activo);
    },
    enabled: !!reportType,
  });

  if (isLoading) return <div className="text-sm text-text-3">Cargando plantillas...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.nombre)}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedTemplate === t.nombre
              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
              : 'border-white/10 bg-surface-2 hover:border-primary/30'
          }`}
        >
          <div className="text-sm font-semibold text-text">{t.nombre}</div>
          {t.descripcion && <div className="text-xs text-text-3 mt-1">{t.descripcion}</div>}
        </button>
      ))}
      {!templates.length && (
        <div className="text-sm text-text-3 col-span-full">No hay plantillas disponibles para este tipo.</div>
      )}
    </div>
  );
}
