import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import type { Provider } from '@/types';

export function ProvidersPage() {
  const [showDialog, setShowDialog] = useState(false);
  const { addToast } = useToast();
  const qc = useQueryClient();

  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await api.get('/providers');
      return res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/providers', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      addToast('success', 'Profesional agregado');
      setShowDialog(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Profesionales</h1>
        <Button onClick={() => setShowDialog(true)} icon={<Plus size={16} />}>Agregar profesional</Button>
      </div>
      {isLoading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers?.map((provider: Provider) => (
            <Card key={provider.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: provider.colorCalendar }}>
                  {provider.nombre?.[0]}{provider.apellidos?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-text">{provider.nombre} {provider.apellidos}</h3>
                  <p className="text-sm text-text-3">{provider.email}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} title="Agregar Profesional">
        <ProviderForm onSubmit={(data: any) => createMutation.mutate(data)} onCancel={() => setShowDialog(false)} />
      </Dialog>
    </div>
  );
}

function ProviderForm({ onSubmit, onCancel }: any) {
  const [userId, setUserId] = useState('');
  const [colorCalendar, setColorCalendar] = useState('#0891B2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ userId, colorCalendar, calendarType: 'local' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">Usuario</label>
        <Select
          value={userId}
          onValueChange={setUserId}
          options={[{ value: '', label: 'Seleccionar usuario...' }]}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">Color calendario</label>
        <input type="color" value={colorCalendar} onChange={(e) => setColorCalendar(e.target.value)} className="w-full h-10 rounded-lg" />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}
