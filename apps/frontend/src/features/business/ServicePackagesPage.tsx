import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';

interface ServicePackage {
  id: number;
  name: string;
  description: string;
  sessions: number;
  price: number;
  duration_days: number;
  includes_meal_plan: boolean;
  includes_food_journal: boolean;
  includes_telehealth: boolean;
  active: boolean;
}

export function ServicePackagesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', sessions: 1, price: 0, duration_days: 30,
    includes_meal_plan: false, includes_food_journal: false, includes_telehealth: false,
  });

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['service-packages'],
    queryFn: async () => { return await api.getUnwrapped<ServicePackage[]>('/service-packages') ?? []; },
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => { return await api.getUnwrapped<any[]>('/service-packages/subscriptions') ?? []; },
  });

  const createMutation = useMutation({
    mutationFn: async () => { await api.post('/service-packages', form); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-packages'] }); setShowCreate(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/service-packages/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-packages'] }),
  });

  const resetForm = () => setForm({ name: '', description: '', sessions: 1, price: 0, duration_days: 30, includes_meal_plan: false, includes_food_journal: false, includes_telehealth: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Package size={24} /> Paquetes de Servicio
          </h1>
          <p className="text-sm text-text-3 mt-1">{packages.length} paquetes activos</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<Plus size={16} />}>
          Nuevo paquete
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-surface animate-pulse rounded-lg" />)}
        </div>
      ) : packages.length === 0 ? (
        <Card className="p-8 text-center">
          <Package size={32} className="text-text-3 mx-auto mb-3" />
          <p className="text-text-2 mb-4">No hay paquetes creados</p>
          <Button onClick={() => setShowCreate(true)} icon={<Plus size={16} />}>Crear primer paquete</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg: ServicePackage) => {
            const subCount = subscriptions.filter((s: { package_id: number; status: string }) => s.package_id === pkg.id && s.status === 'active').length;
            return (
              <Card key={pkg.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-text">{pkg.name}</h3>
                  <button onClick={() => deleteMutation.mutate(pkg.id)} className="text-text-3 hover:text-danger transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                {pkg.description && <p className="text-xs text-text-3 mb-3 line-clamp-2">{pkg.description}</p>}
                <div className="text-2xl font-bold text-primary mb-3">${pkg.price}</div>
                <div className="space-y-1 text-xs text-text-2 mb-4 flex-1">
                  <div>📋 {pkg.sessions} sesiones</div>
                  <div>📅 {pkg.duration_days} días de vigencia</div>
                  {pkg.includes_meal_plan && <div>🍽️ Plan alimentario incluido</div>}
                  {pkg.includes_food_journal && <div>📝 Journal incluido</div>}
                  {pkg.includes_telehealth && <div>📹 Telehealth incluido</div>}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-3 pt-3 border-t border-border">
                  <Users size={14} />
                  <span>{subCount} paciente{subCount !== 1 ? 's' : ''} activo{subCount !== 1 ? 's' : ''}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Crear paquete">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Nombre</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plan Inicial" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Descripción</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="4 consultas + plan alimentario" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Sesiones</label>
              <Input type="number" value={form.sessions} onChange={(e) => setForm({ ...form, sessions: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Precio ($)</label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Días</label>
              <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 30 })} />
            </div>
          </div>
          <div className="flex gap-4">
            {([
              ['includes_meal_plan', '🍽️ Plan alimentario'],
              ['includes_food_journal', '📝 Journal'],
              ['includes_telehealth', '📹 Telehealth'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="rounded" />
                {label}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>
              Crear
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
