import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { RecipeCreateSchema, type RecipeCreate } from '@/lib/schemas';

const FormSchema = RecipeCreateSchema.extend({
  ingredientes: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

interface Props { open: boolean; onClose: () => void; }

export function RecipeFormDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: RecipeCreate = {
        ...data,
        ingredientes: data.ingredientes ? data.ingredientes.split(',').map((s: string) => s.trim()) : undefined,
      };
      return api.post('/recipes', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); reset(); onClose(); },
  });

  const input = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2]/30 transition-all';
  const label = 'block text-xs font-medium text-white/60 mb-1.5';

  return (
    <Dialog open={open} onClose={onClose} title="Nueva Receta">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">Error al crear receta.</div>}
        <div>
          <label className={label}>Nombre *</label>
          <input {...register('nombre')} autoComplete="off" className={input} placeholder="Ensalada mediterránea" />
          {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Categoría</label>
            <select {...register('categoria')} className={input}>
              <option value="">Seleccionar</option>
              <option value="Desayuno">Desayuno</option>
              <option value="Almuerzo">Almuerzo</option>
              <option value="Cena">Cena</option>
              <option value="Snack">Snack</option>
              <option value="Postre">Postre</option>
              <option value="Bebida">Bebida</option>
            </select>
          </div>
          <div>
            <label className={label}>Raciones</label>
            <input type="number" {...register('raciones')} autoComplete="off" className={input} placeholder="4" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div><label className={label}>Kcal</label><input type="number" {...register('kcal')} autoComplete="off" className={input} /></div>
          <div><label className={label}>Prot (g)</label><input type="number" {...register('prot')} autoComplete="off" className={input} /></div>
          <div><label className={label}>Grasas (g)</label><input type="number" {...register('grasas')} autoComplete="off" className={input} /></div>
          <div><label className={label}>HC (g)</label><input type="number" {...register('hc')} autoComplete="off" className={input} /></div>
        </div>
        <div>
          <label className={label}>Ingredientes (separados por coma)</label>
          <textarea {...register('ingredientes')} rows={2} className={input} placeholder="lechuga, tomate, aceite de oliva..." />
        </div>
        <div>
          <label className={label}>Preparación</label>
          <textarea {...register('pasos')} rows={3} className={input} placeholder="Pasos de preparación..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0891B2] to-[#0E7490] rounded-lg text-sm font-bold text-white hover:shadow-lg transition-all disabled:opacity-50">
            {mutation.isPending ? 'Creando...' : 'Crear Receta'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
