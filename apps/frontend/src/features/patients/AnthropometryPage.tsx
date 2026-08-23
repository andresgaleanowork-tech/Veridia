import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import type { Antropometria } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useLocale } from '@/hooks/useLocale';
import { useTranslation } from '@/i18n/useTranslation';
import { WeightTrendChart } from './WeightTrendChart';

const AnthropometrySchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  peso: z.coerce.number().optional(),
  altura: z.coerce.number().optional(),
  cintura: z.coerce.number().optional(),
  cadera: z.coerce.number().optional(),
  pantorrilla: z.coerce.number().optional(),
  grasa_corporal: z.coerce.number().optional(),
  masa_muscular: z.coerce.number().optional(),
  grasa_visceral: z.coerce.number().optional(),
  metodo: z.string().optional(),
});

type AnthropometryFormData = z.infer<typeof AnthropometrySchema>;

export function AnthropometryPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [showForm, setShowForm] = useState(false);
  const [trendMetric, setTrendMetric] = useState<string>('peso');
  const [trendFrom, setTrendFrom] = useState<string>('');
  const [trendTo, setTrendTo] = useState<string>('');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnthropometryFormData>({
    resolver: zodResolver(AnthropometrySchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      peso: undefined,
      altura: undefined,
      cintura: undefined,
      cadera: undefined,
      pantorrilla: undefined,
      grasa_corporal: undefined,
      masa_muscular: undefined,
      grasa_visceral: undefined,
      metodo: '',
    },
  });

  const peso = useWatch({ control, name: 'peso' });
  const altura = useWatch({ control, name: 'altura' });

  const { data: measurements, isLoading } = useQuery({
    queryKey: ['anthropometry', patientId],
    queryFn: async (): Promise<Antropometria[]> => {
      const res = await api.get(`/patients/${patientId}/anthropometry`);
      return res.data.measurements || res.data.data || res.data || [];
    },
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: AnthropometryFormData) => {
      const payload = {
        fecha: data.fecha,
        peso: data.peso || undefined,
        altura: data.altura || undefined,
        cintura: data.cintura || undefined,
        cadera: data.cadera || undefined,
        pantorrilla: data.pantorrilla || undefined,
        grasa_corporal: data.grasa_corporal || undefined,
        masa_muscular: data.masa_muscular || undefined,
        grasa_visceral: data.grasa_visceral || undefined,
        metodo: data.metodo || undefined,
      };
      return api.post(`/patients/${patientId}/anthropometry`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anthropometry', patientId] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (measurementId: string) => {
      return api.delete(`/patients/${patientId}/anthropometry/${measurementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anthropometry', patientId] });
    },
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['anthropometry-trends', patientId, trendMetric, trendFrom, trendTo],
    queryFn: async (): Promise<Array<{ fecha: string; value: number }>> => {
      const params = new URLSearchParams({ metric: trendMetric });
      if (trendFrom) params.set('from', trendFrom);
      if (trendTo) params.set('to', trendTo);
      const res = await api.get(`/clinical/patients/${patientId}/anthropometry/trends?${params.toString()}`);
      return res.data.data || res.data || [];
    },
    enabled: !!patientId && !!trendMetric,
  });

  const calculateIMC = () => {
    if (peso && altura && altura > 0) {
      return (peso / ((altura / 100) ** 2)).toFixed(1);
    }
    return null;
  };

  const imc = calculateIMC();

  const onSubmit = (data: AnthropometryFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Link to={`/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
        <ArrowLeft size={14} /> Volver al paciente
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Antropometría</h1>
          <p className="text-text-3 text-sm mt-1">Mediciones corporales y composición</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={14} />}
          onClick={() => setShowForm(!showForm)}
        >
          Nueva Medición
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text">Nueva Medición Antropométrica</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input
                label="Fecha"
                type="date"
                error={errors.fecha?.message}
                {...register('fecha')}
              />
              <Input
                label="Peso (kg)"
                type="number"
                step="any"
                error={errors.peso?.message}
                {...register('peso')}
              />
              <Input
                label="Altura (cm)"
                type="number"
                step="any"
                error={errors.altura?.message}
                {...register('altura')}
              />
              <Input
                label="Cintura (cm)"
                type="number"
                step="any"
                error={errors.cintura?.message}
                {...register('cintura')}
              />
              <Input
                label="Cadera (cm)"
                type="number"
                step="any"
                error={errors.cadera?.message}
                {...register('cadera')}
              />
              <Input
                label="Pantorrilla (cm)"
                type="number"
                step="any"
                error={errors.pantorrilla?.message}
                {...register('pantorrilla')}
              />
              <Input
                label="Grasa Corporal (%)"
                type="number"
                step="any"
                error={errors.grasa_corporal?.message}
                {...register('grasa_corporal')}
              />
              <Input
                label="Masa Muscular (kg)"
                type="number"
                step="any"
                error={errors.masa_muscular?.message}
                {...register('masa_muscular')}
              />
              <Input
                label="Grasa Visceral"
                type="number"
                step="any"
                error={errors.grasa_visceral?.message}
                {...register('grasa_visceral')}
              />
              <Input
                label="Método"
                error={errors.metodo?.message}
                {...register('metodo')}
                placeholder="BIA, DEXA, Cinta..."
              />
            </div>
            {imc && (
              <div className="flex items-center gap-2 p-3 bg-surface-2 rounded-lg border border-border">
                <span className="text-text-3 text-sm">IMC calculado:</span>
                <span className="text-text font-bold">{imc} kg/m²</span>
                <Badge variant={parseFloat(imc) < 18.5 ? 'warning' : parseFloat(imc) < 25 ? 'success' : parseFloat(imc) < 30 ? 'warning' : 'danger'}>
                  {parseFloat(imc) < 18.5 ? 'Bajo peso' : parseFloat(imc) < 25 ? 'Normal' : parseFloat(imc) < 30 ? 'Sobrepeso' : 'Obesidad'}
                </Badge>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowForm(false); reset(); }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
                icon={<Save size={14} />}
              >
                Guardar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Measurements List */}
      {isLoading ? (
        <Card>
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-text-3 text-sm">Cargando mediciones...</p>
          </div>
        </Card>
      ) : !measurements?.length ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-text-3 text-sm">No hay mediciones antropométricas registradas.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {measurements.map((m) => (
            <Card key={m.id}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-text">{new Date(m.fecha).toLocaleDateString('es-ES')}</span>
                    {m.metodo && <span className="text-xs text-text-3 bg-surface-3 px-2 py-0.5 rounded">{m.metodo}</span>}
                  </div>
                  <button onClick={() => deleteMutation.mutate(m.id)} className="p-1.5 hover:bg-surface-3 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 size={14} className="text-text-3 hover:text-danger" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <DataCell label="Peso" value={m.peso ? `${m.peso} kg` : null} />
                  <DataCell label="Altura" value={m.altura ? `${m.altura} cm` : null} />
                  <DataCell label="IMC" value={m.imc ? `${m.imc}` : null} highlight />
                  <DataCell label="Cintura" value={m.cintura ? `${m.cintura} cm` : null} />
                  <DataCell label="Cadera" value={m.cadera ? `${m.cadera} cm` : null} />
                  <DataCell label="Pantorrilla" value={m.pantorrilla ? `${m.pantorrilla} cm` : null} />
                  <DataCell label="Grasa" value={m.grasa_corporal ? `${m.grasa_corporal}%` : null} />
                  <DataCell label="Masa muscular" value={m.masa_muscular ? `${m.masa_muscular} kg` : null} />
                  <DataCell label="Grasa visceral" value={m.grasa_visceral ? `${m.grasa_visceral}` : null} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title={t('anthropometry.trends')}
          description={t('anthropometry.trendsSubtitle')}
        />
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={trendFrom}
                onChange={(e) => setTrendFrom(e.target.value)}
                label={t('anthropometry.from')}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={trendTo}
                onChange={(e) => setTrendTo(e.target.value)}
                label={t('anthropometry.to')}
                className="w-auto"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'peso', label: t('anthropometry.weight') },
              { id: 'imc', label: t('anthropometry.bmi') },
              { id: 'grasa_corporal', label: t('anthropometry.bodyFat') },
              { id: 'masa_muscular', label: t('anthropometry.muscleMass') },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={trendMetric === tab.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTrendMetric(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {trendLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-text-3 text-sm">Cargando evolución...</p>
            </div>
          ) : (
            <WeightTrendChart
              data={(trendData || []).map((d: Record<string, unknown>) => ({
                fecha: String(d.fecha || ''),
                value: Number(d.value || 0),
              }))}
              metric={trendMetric}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function DataCell({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-text-3 text-xs">{label}:</span>{' '}
      <span className={`font-medium ${highlight ? 'text-primary' : 'text-text'}`}>{value}</span>
    </div>
  );
}
