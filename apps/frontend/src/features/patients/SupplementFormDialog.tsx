import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { SupplementCreateSchema, type SupplementCreate } from '@/lib/schemas';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import type { Supplement } from '@/lib/schemas';

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Supplement | null;
}

export function SupplementFormDialog({ open, onClose, initialData = null }: Props) {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplementCreate>({
    resolver: zodResolver(SupplementCreateSchema),
    defaultValues: {
      paciente_id: '',
      nombre: '',
      tipo: 'supplement',
      dosis: '',
      frecuencia: '',
      horarios: [''],
      via: '',
      fecha_inicio: '',
      fecha_fin: '',
      motivo: '',
      observaciones: '',
      activo: true,
    },
  });

  const horarios = watch('horarios');

  useEffect(() => {
    if (initialData) {
      reset({
        paciente_id: initialData.paciente_id,
        nombre: initialData.nombre,
        tipo: initialData.tipo,
        dosis: initialData.dosis,
        frecuencia: initialData.frecuencia,
        horarios: initialData.horarios?.length ? initialData.horarios : [''],
        via: initialData.via,
        fecha_inicio: initialData.fecha_inicio,
        fecha_fin: initialData.fecha_fin || '',
        motivo: initialData.motivo || '',
        observaciones: initialData.observaciones || '',
        activo: initialData.activo,
      });
    } else {
      reset({
        paciente_id: '',
        nombre: '',
        tipo: 'supplement',
        dosis: '',
        frecuencia: '',
        horarios: [''],
        via: '',
        fecha_inicio: '',
        fecha_fin: '',
        motivo: '',
        observaciones: '',
        activo: true,
      });
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: SupplementCreate) => {
      const payload = {
        ...data,
        horarios: data.horarios.filter((h) => h.trim() !== ''),
        fecha_fin: data.fecha_fin || null,
        motivo: data.motivo || null,
        observaciones: data.observaciones || null,
      };
      if (initialData) {
        return api.put(`/supplements/${initialData.id}`, payload);
      }
      return api.post('/supplements', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
      reset();
      onClose();
    },
  });

  const onSubmit = (data: SupplementCreate) => {
    mutation.mutate(data);
  };

  const inputClass = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all';
  const labelClass = 'block text-xs font-medium text-white/60 mb-1.5';
  const errorClass = 'text-red-400 text-xs mt-1';

  const addHorario = () => {
    setValue('horarios', [...horarios, '']);
  };

  const removeHorario = (index: number) => {
    setValue('horarios', horarios.filter((_, i) => i !== index));
  };

  const updateHorario = (index: number, value: string) => {
    const newHorarios = [...horarios];
    newHorarios[index] = value;
    setValue('horarios', newHorarios);
  };

  return (
    <Dialog open={open} onClose={onClose} title={initialData ? t('supplements.edit') : t('supplements.add')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mutation.isError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            Error al {initialData ? 'actualizar' : 'crear'} suplemento. Intenta de nuevo.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('supplements.name') || 'Nombre'} *</label>
            <input {...register('nombre')} aria-invalid={!!errors.nombre} aria-errormessage={errors.nombre ? 'err-nombre' : undefined} className={inputClass} placeholder="Vitamina D" />
            {errors.nombre && <p id="err-nombre" className={errorClass}>{errors.nombre.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{t('supplements.type')} *</label>
            <select {...register('tipo')} className={inputClass}>
              <option value="supplement">{t('supplements.typeSupplement')}</option>
              <option value="medication">{t('supplements.typeMedication')}</option>
              <option value="vitamin">{t('supplements.typeVitamin')}</option>
              <option value="mineral">{t('supplements.typeMineral')}</option>
            </select>
            {errors.tipo && <p className={errorClass}>{errors.tipo.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('supplements.dose')} *</label>
            <input {...register('dosis')} className={inputClass} placeholder="1000 UI" />
            {errors.dosis && <p className={errorClass}>{errors.dosis.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{t('supplements.frequency')} *</label>
            <select {...register('frecuencia')} className={inputClass}>
              <option value="Una vez al día">Una vez al día</option>
              <option value="Dos veces al día">Dos veces al día</option>
              <option value="Tres veces al día">Tres veces al día</option>
              <option value="Semanal">Semanal</option>
              <option value="Según necesidad">Según necesidad</option>
            </select>
            {errors.frecuencia && <p className={errorClass}>{errors.frecuencia.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('supplements.schedules')} *</label>
          <div className="space-y-2">
            {horarios.map((horario, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => updateHorario(index, e.target.value)}
                  className={inputClass}
                />
                {horarios.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeHorario(index)} icon={<Trash2 size={14} />} />
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addHorario} icon={<Plus size={14} />} className="mt-2">
            Agregar horario
          </Button>
          {errors.horarios && <p className={errorClass}>{errors.horarios.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Vía *</label>
            <select {...register('via')} className={inputClass}>
              <option value="oral">Oral</option>
              <option value="topical">Tópica</option>
              <option value="injectable">Inyectable</option>
              <option value="sublingual">Sublingual</option>
              <option value="other">Otra</option>
            </select>
            {errors.via && <p className={errorClass}>{errors.via.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Fecha de inicio *</label>
            <input {...register('fecha_inicio')} type="date" className={inputClass} />
            {errors.fecha_inicio && <p className={errorClass}>{errors.fecha_inicio.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fecha de fin</label>
            <input {...register('fecha_fin')} type="date" className={inputClass} />
          </div>
          <div className="flex items-end">
            <Switch
              label={t('supplements.active')}
              checked={watch('activo')}
              onChange={(checked) => setValue('activo', checked)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Motivo</label>
          <textarea {...register('motivo')} rows={2} className={inputClass} placeholder="Motivo de la prescripción..." />
        </div>

        <div>
          <label className={labelClass}>Observaciones</label>
          <textarea {...register('observaciones')} rows={2} className={inputClass} placeholder="Observaciones adicionales..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-lg text-sm font-bold text-white hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? (initialData ? 'Actualizando...' : 'Creando...') : (initialData ? 'Actualizar' : t('supplements.add'))}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
