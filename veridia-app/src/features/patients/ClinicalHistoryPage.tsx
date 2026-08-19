import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import type { ClinicalHistory } from '@/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const ClinicalHistorySchema = z.object({
  antecedentes: z.string().optional(),
  antecedentes_familiares: z.string().optional(),
  alergias: z.string().optional(),
  medicacion: z.string().optional(),
  suplementacion: z.string().optional(),
  habitos_toxicos: z.string().optional(),
  sueno: z.string().optional(),
  estres: z.string().optional(),
  ingesta_hidrica: z.string().optional(),
  observaciones: z.string().optional(),
  historial_ponderal: z.string().optional(),
  actividad_fisica: z.string().optional(),
});

export type ClinicalHistoryForm = z.infer<typeof ClinicalHistorySchema>;

export function ClinicalHistoryPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const initializedRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClinicalHistoryForm>({
    resolver: zodResolver(ClinicalHistorySchema),
    defaultValues: {
      antecedentes: '',
      antecedentes_familiares: '',
      alergias: '',
      medicacion: '',
      suplementacion: '',
      habitos_toxicos: '',
      sueno: '',
      estres: '',
      ingesta_hidrica: '',
      observaciones: '',
      historial_ponderal: '',
      actividad_fisica: '',
    },
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ['clinical-history', patientId],
    queryFn: async (): Promise<ClinicalHistory | null> => {
      const res = await api.get(`/patients/${patientId}/clinical-history`);
      return res.data.history || res.data;
    },
    enabled: !!patientId,
  });

  if (history && !initializedRef.current) {
    reset({
      antecedentes: history.antecedentes || '',
      antecedentes_familiares: history.antecedentes_familiares || '',
      alergias: history.alergias || '',
      medicacion: history.medicacion || '',
      suplementacion: history.suplementacion || '',
      habitos_toxicos: history.habitos_toxicos || '',
      sueno: history.sueno || '',
      estres: history.estres || '',
      ingesta_hidrica: history.ingesta_hidrica || '',
      observaciones: history.observaciones || '',
      historial_ponderal: JSON.stringify(history.historial_ponderal || {}, null, 2),
      actividad_fisica: JSON.stringify(history.actividad_fisica || {}, null, 2),
    });
    initializedRef.current = true;
  }

  const mutation = useMutation({
    mutationFn: async (data: ClinicalHistoryForm) => {
      const payload = {
        ...data,
        historial_ponderal: data.historial_ponderal ? JSON.parse(data.historial_ponderal) : undefined,
        actividad_fisica: data.actividad_fisica ? JSON.parse(data.actividad_fisica) : undefined,
      };
      if (history?.id) {
        return api.put(`/patients/${patientId}/clinical-history/${history.id}`, payload);
      }
      return api.post(`/patients/${patientId}/clinical-history`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-history', patientId] });
    },
  });

  const onSubmit = (data: ClinicalHistoryForm) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-text-3 text-sm">Cargando historia clínica...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Link to={`/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
        <ArrowLeft size={14} /> Volver al paciente
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Historia Clínica</h1>
          <p className="text-text-3 text-sm mt-1">Antecedentes, alergias, medicación y hábitos</p>
        </div>
        <Button type="submit" loading={mutation.isPending} icon={<Save size={14} />}>
          Guardar
        </Button>
      </div>

      {mutation.isError && (
        <div className="flex items-center gap-2 p-3 bg-danger-light border border-danger/20 rounded-lg text-danger text-sm">
          <AlertTriangle size={14} />
          Error al guardar. Intenta de nuevo.
        </div>
      )}

      {mutation.isSuccess && (
        <div className="p-3 bg-success-light border border-success/20 rounded-lg text-success text-sm">
          Historia clínica guardada correctamente.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <Input label="Antecedentes personales" {...register('antecedentes')} error={errors.antecedentes?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Antecedentes familiares" {...register('antecedentes_familiares')} error={errors.antecedentes_familiares?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Alergias" {...register('alergias')} error={errors.alergias?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Medicación actual" {...register('medicacion')} error={errors.medicacion?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Suplementación" {...register('suplementacion')} error={errors.suplementacion?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Hábitos tóxicos" {...register('habitos_toxicos')} error={errors.habitos_toxicos?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Sueño" {...register('sueno')} error={errors.sueno?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Estrés" {...register('estres')} error={errors.estres?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Ingesta hídrica" {...register('ingesta_hidrica')} error={errors.ingesta_hidrica?.message} />
        </Card>
        <Card className="p-4">
          <Input label="Observaciones" {...register('observaciones')} error={errors.observaciones?.message} />
        </Card>
      </div>

      <Card className="p-4">
        <Textarea label="Historial Ponderal (JSON)" {...register('historial_ponderal')} rows={6} className="font-mono" placeholder='{"pesos": []}' />
      </Card>

      <Card className="p-4">
        <Textarea label="Actividad Física (JSON)" {...register('actividad_fisica')} rows={6} className="font-mono" placeholder='{"tipo": "", "frecuencia": ""}' />
      </Card>
    </form>
  );
}
