import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { FoodCreateSchema, type FoodCreate } from '@/lib/schemas';

type FormData = FoodCreate;
interface Props { open: boolean; onClose: () => void; }

export function FoodFormDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(FoodCreateSchema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/foods', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['foods'] }); reset(); onClose(); },
  });

  const input = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2]/30 transition-all';
  const label = 'block text-xs font-medium text-white/60 mb-1.5';

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo Alimento">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">Error al crear alimento.</div>}
        <div><label className={label}>Nombre *</label><input {...register('name')} autoComplete="off" className={input} placeholder="Arroz integral" />{errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Categoría</label><input {...register('category')} autoComplete="off" className={input} placeholder="Cereales" /></div>
          <div><label className={label}>Porción</label><input {...register('portion')} autoComplete="off" className={input} placeholder="100g" /></div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <div><label className={label}>Kcal</label><input type="number" {...register('kcal')} autoComplete="off" className={input} /></div>
          <div><label className={label}>Prot (g)</label><input type="number" {...register('protein')} autoComplete="off" className={input} /></div>
          <div><label className={label}>Grasas (g)</label><input type="number" {...register('fat')} autoComplete="off" className={input} /></div>
          <div><label className={label}>HC (g)</label><input type="number" {...register('carbs')} autoComplete="off" className={input} /></div>
          <div><label className={label}>Fibra (g)</label><input type="number" {...register('fiber')} autoComplete="off" className={input} /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0891B2] to-[#0E7490] rounded-lg text-sm font-bold text-white hover:shadow-lg transition-all disabled:opacity-50">{mutation.isPending ? 'Creando...' : 'Crear Alimento'}</button>
        </div>
      </form>
    </Dialog>
  );
}
