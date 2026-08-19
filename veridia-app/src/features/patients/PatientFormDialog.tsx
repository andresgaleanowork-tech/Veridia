import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { PatientCreateSchema, type PatientCreate } from '@/lib/schemas';

type FormData = PatientCreate;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PatientFormDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(PatientCreateSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      reset();
      onClose();
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      sexo: data.sexo || undefined,
      email: data.email || undefined,
      fecha_nacimiento: data.fecha_nacimiento || undefined,
    };
    mutation.mutate(payload);
  };

  const inputClass = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2]/30 transition-all';
  const labelClass = 'block text-xs font-medium text-white/60 mb-1.5';
  const errorClass = 'text-red-400 text-xs mt-1';

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo Paciente">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mutation.isError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            Error al crear paciente. Intenta de nuevo.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input {...register('nombre')} aria-invalid={!!errors.nombre} aria-errormessage={errors.nombre ? 'err-nombre' : undefined} autoComplete="given-name" className={inputClass} placeholder="Juan" />
            {errors.nombre && <p id="err-nombre" className={errorClass}>{errors.nombre.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Apellidos *</label>
            <input {...register('apellidos')} aria-invalid={!!errors.apellidos} aria-errormessage={errors.apellidos ? 'err-apellidos' : undefined} autoComplete="family-name" className={inputClass} placeholder="García López" />
            {errors.apellidos && <p id="err-apellidos" className={errorClass}>{errors.apellidos.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>DNI</label>
            <input {...register('dni')} autoComplete="off" className={inputClass} placeholder="12345678A" />
          </div>
          <div>
            <label className={labelClass}>Sexo</label>
            <select {...register('sexo')} className={inputClass}>
              <option value="">No especificado</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fecha de nacimiento</label>
            <input {...register('fecha_nacimiento')} type="date" autoComplete="bday" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input {...register('email')} type="email" aria-invalid={!!errors.email} aria-errormessage={errors.email ? 'err-email' : undefined} autoComplete="email" className={inputClass} placeholder="juan@email.com" />
            {errors.email && <p id="err-email" className={errorClass}>{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Teléfono</label>
          <input {...register('telefono')} autoComplete="tel" className={inputClass} placeholder="+34 600 000 000" />
        </div>

        <div>
          <label className={labelClass}>Motivo de consulta</label>
          <textarea {...register('motivo_consulta')} rows={3} className={inputClass} placeholder="Descripción breve del motivo de consulta..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0891B2] to-[#0E7490] rounded-lg text-sm font-bold text-white hover:shadow-lg hover:shadow-[#0891B2]/20 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? 'Creando...' : 'Crear Paciente'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
