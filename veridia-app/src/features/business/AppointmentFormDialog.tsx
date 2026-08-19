import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { AppointmentCreateSchema, type AppointmentCreate } from '@/lib/schemas';
import { useQuery } from '@tanstack/react-query';
import type { Provider } from '@/types';

type FormData = AppointmentCreate;
interface Props { open: boolean; onClose: () => void; }

export function AppointmentFormDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>({ resolver: zodResolver(AppointmentCreateSchema) });
  const selectedProviderId = watch('provider_id');

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await api.get('/providers');
      return res.data || [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/appointments', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); reset(); onClose(); },
  });

  const input = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2]/30 transition-all';
  const label = 'block text-xs font-medium text-white/60 mb-1.5';

  const selectedProvider = providers?.find((p: Provider) => p.id === selectedProviderId);
  const eventColor = selectedProvider?.colorCalendar || watch('color') || '#0891B2';

  return (
    <Dialog open={open} onClose={onClose} title="Nueva Cita">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">Error al crear cita.</div>}
        <div><label className={label}>ID Paciente (UUID) *</label><input {...register('paciente_id')} autoComplete="off" className={input} placeholder="uuid del paciente" />{}</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Fecha *</label><input type="date" {...register('fecha')} autoComplete="off" className={input} />{}</div>
          <div><label className={label}>Hora *</label><input type="time" {...register('hora')} autoComplete="off" className={input} />{}</div>
        </div>
        <div>
          <label className={label}>Profesional</label>
          <select {...register('provider_id')} className={input}>
            <option value="">Sin asignar</option>
            {providers?.map((p: Provider) => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className={label}>Color</label>
          <input type="color" value={eventColor} onChange={(e) => setValue('color', e.target.value)} className="h-9 w-12 rounded cursor-pointer bg-transparent border border-white/10" />
          <span className="text-xs text-white/40">Color del turno</span>
        </div>
        <div><label className={label}>Tipo</label><input {...register('tipo')} autoComplete="off" className={input} placeholder="Primera consulta" /></div>
        <div><label className={label}>Notas</label><textarea {...register('nota')} rows={2} className={input} /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0891B2] to-[#0E7490] rounded-lg text-sm font-bold text-white hover:shadow-lg transition-all disabled:opacity-50">{mutation.isPending ? 'Creando...' : 'Crear Cita'}</button>
        </div>
      </form>
    </Dialog>
  );
}
