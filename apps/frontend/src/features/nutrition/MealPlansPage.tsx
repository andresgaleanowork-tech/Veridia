import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, FileText, Copy, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import type { MealPlan, Patient } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { MealPlanFormDialog } from './MealPlanFormDialog';
import { MealPlanGeneratorDialog } from './MealPlanGeneratorDialog';
import { ReportGeneratorDialog } from '@/features/reports/ReportGeneratorDialog';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

const STATUS_FILTER = [
  { value: 'Todos', labelKey: 'common.all' },
  { value: 'activo', labelKey: 'common.active' },
  { value: 'inactivo', labelKey: 'common.inactive' },
  { value: 'borrador', labelKey: 'common.draft' },
] as const;

export function MealPlansPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);
  const [showReport, setShowReport] = useState(false);
  const qc = useQueryClient();
  const debouncedSearch = useDebounce(search, 300);

  const duplicateMutation = useMutation({
    mutationFn: (plan: MealPlan) => api.post('/meal-plans', { ...plan, id: undefined, nombre: `${plan.nombre} (copia)`, estado: 'borrador' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['meal-plans', debouncedSearch, status],
    queryFn: async (): Promise<MealPlan[]> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status !== 'Todos') params.set('status', status);
      const res = await api.get(`/meal-plans?${params.toString()}`);
      return res.data.plans || res.data.data || res.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('mealPlans.title')}</h1>
          <p className="text-text-3 text-sm mt-1">{t('mealPlans.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowGenerator(true)} icon={<Sparkles size={16} />}>
            Generar plan automático
          </Button>
          <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
            {t('mealPlans.newPlan')}
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          type="text"
          placeholder={t('mealPlans.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border">
          {STATUS_FILTER.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={status === s.value ? 'primary' : 'ghost'}
              onClick={() => setStatus(s.value)}
              className={
                status === s.value
                  ? ''
                  : 'text-text-3 hover:text-text hover:bg-surface-3 border border-transparent whitespace-nowrap'
              }
            >
              {t(s.labelKey)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton variant="text" className="h-5 w-3/4 mb-2" />
              <Skeleton variant="text" className="h-3 w-1/2 mb-3" />
              <div className="grid grid-cols-4 gap-2 mb-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} variant="text" className="h-4 w-full text-center" />
                ))}
              </div>
              <Skeleton variant="text" className="h-3 w-1/4" />
            </Card>
          ))}
        </div>
      ) : !plans?.length ? (
        <Card className="p-12 text-center">
          <FileText size={32} className="text-text-3 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">{t('mealPlans.noPlans')}</h3>
          <p className="text-text-3 text-sm">{t('mealPlans.noPlansDesc')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((p) => (
            <Card key={p.id} className="p-5 hover:border-primary/20 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-text group-hover:text-primary transition-colors">
                    {p.nombre || `Plan ${p.paciente_nombre || ''}`}
                  </h3>
                  <p className="text-xs text-text-3 mt-0.5">{p.paciente_nombre}</p>
                </div>
                <Badge variant={p.estado === 'activo' ? 'success' : p.estado === 'borrador' ? 'warning' : 'secondary'} size="sm">
                  {p.estado}
                </Badge>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <MacroBadge label="Kcal" value={p.kcal_objetivo} />
                <MacroBadge label="Prot" value={p.prot_g} unit="g" />
                <MacroBadge label="Grasas" value={p.grasas_g} unit="g" />
                <MacroBadge label="HC" value={p.hc_g} unit="g" />
              </div>

              <div className="flex items-center justify-between text-xs text-text-3">
                <span>{new Date(p.fecha_creacion).toLocaleDateString('es-ES')}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5"
                    title="Generar informe"
                    onClick={(e) => {
                      e.preventDefault();
                      api.get(`/patients/${p.paciente_id}`).then(res => {
                        setReportPatient(res.data);
                        setShowReport(true);
                      }).catch(() => {});
                    }}
                  >
                    <FileText size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5"
                    title={t('mealPlans.duplicate')}
                    onClick={(e) => { e.preventDefault(); duplicateMutation.mutate(p); }}
                  >
                    <Copy size={12} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <MealPlanFormDialog open={showForm} onClose={() => setShowForm(false)} />
      <MealPlanGeneratorDialog open={showGenerator} onClose={() => setShowGenerator(false)} />
      {showReport && reportPatient && (
        <ReportGeneratorDialog open={showReport} onClose={() => setShowReport(false)} patient={reportPatient} />
      )}
    </div>
  );
}

function MacroBadge({ label, value, unit }: { label: string; value?: number; unit?: string }) {
  return (
    <div className="text-center bg-surface-2 rounded-lg p-2 border border-border">
      <div className="text-sm font-bold text-text">{value ?? '—'}</div>
      <div className="text-[9px] text-text-3">{label}{unit ? ` (${unit})` : ''}</div>
    </div>
  );
}
