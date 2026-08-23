import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { InvoiceCreateSchema, type InvoiceCreate } from '@/lib/schemas';

type FormData = InvoiceCreate;
interface Props { open: boolean; onClose: () => void; }

export function InvoiceFormDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(InvoiceCreateSchema), defaultValues: { estado: 'Pendiente' } });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/invoices', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); reset(); onClose(); },
  });

  const input = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all';
  const label = 'block text-xs font-medium text-white/60 mb-1.5';

  return (
    <Dialog open={open} onClose={onClose} title="Nueva Factura">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">Error al crear factura.</div>}
        <div><label className={label}>ID Paciente (UUID) *</label><input {...register('paciente_id')} autoComplete="off" className={input} placeholder="uuid del paciente" />{errors.paciente_id && <p className="text-red-400 text-xs mt-1">{errors.paciente_id.message}</p>}</div>
        <div><label className={label}>Concepto *</label><input {...register('concepto')} autoComplete="off" className={input} placeholder="Consulta nutricional" />{errors.concepto && <p className="text-red-400 text-xs mt-1">{errors.concepto.message}</p>}</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Total (€) *</label><input type="number" step="0.01" {...register('total')} autoComplete="off" className={input} />{errors.total && <p className="text-red-400 text-xs mt-1">{errors.total.message}</p>}</div>
          <div><label className={label}>Fecha</label><input type="date" {...register('fecha')} autoComplete="off" className={input} /></div>
        </div>
        <div><label className={label}>Estado</label><select {...register('estado')} className={input}><option>Pendiente</option><option>Pagada</option><option>Vencida</option><option>Anulada</option></select></div>
        <div><label className={label}>Notas</label><textarea {...register('notas')} rows={2} className={input} /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-lg text-sm font-bold text-white hover:shadow-lg transition-all disabled:opacity-50">{mutation.isPending ? 'Creando...' : 'Crear Factura'}</button>
        </div>
      </form>
    </Dialog>
  );
}
