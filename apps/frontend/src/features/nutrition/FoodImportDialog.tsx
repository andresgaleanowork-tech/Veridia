import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface FoodImportForm {
  name: string;
  brand: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  region: string;
  is_local: boolean;
}

interface FoodImportFormRaw {
  name: string;
  brand: string;
  category: string;
  calories_per_100g: string;
  protein_per_100g: string;
  carbs_per_100g: string;
  fat_per_100g: string;
  region: string;
  is_local: boolean;
}

export function FoodImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<FoodImportFormRaw>({
    name: '',
    brand: '',
    category: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
    region: '',
    is_local: false,
  });
  const { addToast } = useToast();
  const qc = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: FoodImportForm) => {
      return await api.post('/foods/import', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foods'] });
      addToast('success', 'Alimento importado');
      onClose();
    },
    onError: () => {
      addToast('error', 'Error al importar');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    importMutation.mutate({
      ...form,
      calories_per_100g: parseFloat(form.calories_per_100g) || 0,
      protein_per_100g: parseFloat(form.protein_per_100g) || 0,
      carbs_per_100g: parseFloat(form.carbs_per_100g) || 0,
      fat_per_100g: parseFloat(form.fat_per_100g) || 0,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Importar Alimento" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Nombre</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Marca</label>
            <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Kcal/100g</label>
            <Input type="number" value={form.calories_per_100g} onChange={(e) => setForm({ ...form, calories_per_100g: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Proteínas</label>
            <Input type="number" value={form.protein_per_100g} onChange={(e) => setForm({ ...form, protein_per_100g: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Carbos</label>
            <Input type="number" value={form.carbs_per_100g} onChange={(e) => setForm({ ...form, carbs_per_100g: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Grasas</label>
            <Input type="number" value={form.fat_per_100g} onChange={(e) => setForm({ ...form, fat_per_100g: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-2 mb-2">Región</label>
          <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Ej: LATAM, US, EU" />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={importMutation.isPending}>Importar</Button>
        </div>
      </form>
    </Dialog>
  );
}
