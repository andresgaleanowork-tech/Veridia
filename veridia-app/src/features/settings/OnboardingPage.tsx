import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { OnboardingTemplate } from '@/types';

interface FieldDef {
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

export function OnboardingPage() {
  const [showDialog, setShowDialog] = useState(false);
  const { addToast } = useToast();
  const qc = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['onboarding-templates'],
    queryFn: async () => {
      const res = await api.get('/onboarding/templates');
      return res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/onboarding/templates', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-templates'] });
      addToast('success', 'Template creado');
      setShowDialog(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Onboarding Digital</h1>
        <Button onClick={() => setShowDialog(true)} icon={<Plus size={16} />}>Nuevo template</Button>
      </div>
      {isLoading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template: OnboardingTemplate) => (
            <Card key={template.id} className="p-4">
              <h3 className="font-semibold text-text">{template.name}</h3>
              <p className="text-sm text-text-3">{template.fields?.length || 0} campos</p>
              <p className="text-xs text-text-3 mt-1">{template.active ? 'Activo' : 'Inactivo'}</p>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} title="Nuevo Template de Onboarding">
        <OnboardingForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowDialog(false)} />
      </Dialog>
    </div>
  );
}

function OnboardingForm({ onSubmit, onCancel }: { onSubmit: (data: Record<string, unknown>) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [fields, setFields] = useState<FieldDef[]>([]);

  const addField = () => {
    setFields([...fields, { type: 'text', label: '', required: false, options: [] }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, fields, active: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">Nombre del template</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Onboarding estándar" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">Campos</label>
        {fields.map((field, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <Input value={field.label} onChange={(e) => {
              setFields(fields.map((f, i) => i === idx ? { ...f, label: e.currentTarget.value } : f));
            }} placeholder="Label" />
            <select value={field.type} onChange={(e) => {
              setFields(fields.map((f, i) => i === idx ? { ...f, type: e.currentTarget.value } : f));
            }} className="bg-surface border border-border rounded-lg px-3 py-2 text-text">
              <option value="text">Texto</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
            </select>
          </div>
        ))}
        <Button variant="secondary" onClick={addField} type="button">Agregar campo</Button>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}
