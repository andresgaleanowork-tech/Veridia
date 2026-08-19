import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { Tenant } from '@/types';
import { useState } from 'react';

export function TenantsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const { addToast } = useToast();
  const qc = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => { const res = await api.get('/tenants'); return res.data || []; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await api.post('/tenants', data); return res.data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); addToast('success', 'Tenant creado'); setShowDialog(false); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Tenants</h1>
        <Button onClick={() => setShowDialog(true)} icon={<Plus size={16} />}>Nuevo tenant</Button>
      </div>
      {isLoading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants?.map((tenant: Tenant) => (
            <Card key={tenant.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-text">{tenant.name}</h3>
                  <p className="text-sm text-text-3">{tenant.slug}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} title="Nuevo Tenant">
        <TenantForm onSubmit={(data: any) => createMutation.mutate(data)} onCancel={() => setShowDialog(false)} />
      </Dialog>
    </div>
  );
}

function TenantForm({ onSubmit, onCancel }: any) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ name, slug, settings: {} }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">Nombre</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Clínica ABC" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">Slug</label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="clinica-abc" />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Crear</Button>
      </div>
    </form>
  );
}
