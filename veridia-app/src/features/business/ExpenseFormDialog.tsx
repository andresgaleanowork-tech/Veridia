import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { ExpenseCreateSchema, type ExpenseCreate } from '@/lib/schemas';

type FormData = ExpenseCreate;
interface Props { open: boolean; onClose: () => void; }

export function ExpenseFormDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(ExpenseCreateSchema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/gastos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gastos'] }); reset(); onClose(); },
  });

  const input = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2]/30 transition-all';
  const label = 'block text-xs font-medium text-white/60 mb-1.5';

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo Gasto">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">Error al crear gasto.</div>}
        <div><label className={label}>Categoría *</label><input {...register('categoria')} autoComplete="off" className={input} placeholder="Alquiler" />{errors.categoria && <p className="text-red-400 text-xs mt-1">{errors.categoria.message}</p>}</div>
        <div><label className={label}>Descripción *</label><input {...register('descripcion')} autoComplete="off" className={input} placeholder="Alquiler oficina agosto" />{errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion.message}</p>}</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Importe (€) *</label><input type="number" step="0.01" {...register('importe')} autoComplete="off" className={input} />{errors.importe && <p className="text-red-400 text-xs mt-1">{errors.importe.message}</p>}</div>
          <div><label className={label}>Fecha *</label><input type="date" {...register('fecha')} autoComplete="off" className={input} />{errors.fecha && <p className="text-red-400 text-xs mt-1">{errors.fecha.message}</p>}</div>
        </div>
        <div><label className={label}>Método de pago</label><select {...register('metodo_pago')} className={input}><option value="">Seleccionar</option><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Débito directo</option></select></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0891B2] to-[#0E7490] rounded-lg text-sm font-bold text-white hover:shadow-lg transition-all disabled:opacity-50">{mutation.isPending ? 'Creando...' : 'Crear Gasto'}</button>
        </div>
      </form>
    </Dialog>
  );
}
