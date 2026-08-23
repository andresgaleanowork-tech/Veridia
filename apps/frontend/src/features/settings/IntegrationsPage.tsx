import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Webhook as WebhookIcon } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { ApiKey, Webhook as WebhookType } from '@/types';

export function IntegrationsPage() {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const { addToast } = useToast();
  const qc = useQueryClient();

  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => { const res = await api.get('/webhooks'); return res.data.apiKeys || []; },
  });

  const { data: webhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => { return await api.getUnwrapped<WebhookType[]>('/webhooks') ?? []; },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: { name: string; scopes?: string[] }) => { return await api.post('/webhooks', data); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); addToast('success', 'API Key creada'); setShowApiKeyDialog(false); },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (data: { url: string; events: string[]; secret?: string }) => { return await api.post('/webhooks', data); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); addToast('success', 'Webhook creado'); setShowWebhookDialog(false); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Integraciones</h1>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text">API Keys</h3>
          <Button onClick={() => setShowApiKeyDialog(true)} icon={<Key size={16} />}>Nueva API Key</Button>
        </div>
        <div className="space-y-2">
          {apiKeys?.map((key: ApiKey) => (
            <div key={key.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
              <div>
                <div className="font-medium text-text">{key.name}</div>
                <div className="text-xs text-text-3">Scopes: {key.scopes?.join(', ') || 'all'}</div>
              </div>
              <div className="text-xs text-text-3">{key.lastUsedAt ? `Usada: ${new Date(key.lastUsedAt).toLocaleDateString()}` : 'Nunca usada'}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text">Webhooks</h3>
          <Button onClick={() => setShowWebhookDialog(true)} icon={<WebhookIcon size={16} />}>Nuevo Webhook</Button>
        </div>
        <div className="space-y-2">
          {webhooks?.map((webhook: WebhookType) => (
            <div key={webhook.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
              <div>
                <div className="font-medium text-text">{webhook.url}</div>
                <div className="text-xs text-text-3">Eventos: {webhook.events?.join(', ')}</div>
              </div>
              <div className={`text-xs px-2 py-1 rounded ${webhook.active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {webhook.active ? 'Activo' : 'Inactivo'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={showApiKeyDialog} onClose={() => setShowApiKeyDialog(false)} title="Nueva API Key">
        <ApiKeyForm onSubmit={(data) => createApiKeyMutation.mutate(data)} onCancel={() => setShowApiKeyDialog(false)} />
      </Dialog>

      <Dialog open={showWebhookDialog} onClose={() => setShowWebhookDialog(false)} title="Nuevo Webhook">
        <WebhookForm onSubmit={(data) => createWebhookMutation.mutate(data)} onCancel={() => setShowWebhookDialog(false)} />
      </Dialog>
    </div>
  );
}

function ApiKeyForm({ onSubmit, onCancel }: { onSubmit: (data: { name: string; scopes?: string[] }) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ name, scopes: ['read', 'write'] }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">Nombre</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi API Key" />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Crear</Button>
      </div>
    </form>
  );
}

function WebhookForm({ onSubmit, onCancel }: { onSubmit: (data: { url: string; events: string[]; secret?: string }) => void; onCancel: () => void }) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ url, events: events.split(',').map(e => e.trim()) }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">URL</label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-2 mb-2">Eventos (separados por coma)</label>
        <Input value={events} onChange={(e) => setEvents(e.target.value)} placeholder="appointment.created, payment.received" />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Crear</Button>
      </div>
    </form>
  );
}
