import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import type { FitnessConnection } from '@/types';

const PLATFORMS = [
  { id: 'google_fit', label: 'Google Fit', color: 'text-green-400' },
  { id: 'apple_health', label: 'Apple Health', color: 'text-red-400' },
  { id: 'fitbit', label: 'Fitbit', color: 'text-primary' },
  { id: 'samsung_health', label: 'Samsung Health', color: 'text-blue-400' },
  { id: 'garmin', label: 'Garmin', color: 'text-yellow-400' },
] as const;

export function FitnessConnectButton() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [connecting, setConnosing] = useState<string | null>(null);
  const [connections] = useState<FitnessConnection[]>([]);

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      if (!id) throw new Error('Paciente no definido');
      return api.connectFitnessPlatform(platform, id, undefined, ['read_activity', 'read_steps']);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness'] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      if (!id) throw new Error('Paciente no definido');
      return api.disconnectFitness(id, platform);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness'] });
    },
  });

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-primary" />
        <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Plataformas Fitness</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {PLATFORMS.map((p) => {
          const isConnected = connections.some((c) => c.platform === p.id && c.active);
          return (
            <button
              key={p.id}
              disabled={connecting !== null}
              onClick={() => {
                setConnosing(p.id);
                if (isConnected) {
                  disconnectMutation.mutate(p.id, { onSettled: () => setConnosing(null) });
                } else {
                  connectMutation.mutate(p.id, { onSettled: () => setConnosing(null) });
                }
              }}
              className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg transition-all group disabled:opacity-50 ${
                isConnected
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-surface-2 border-border hover:border-primary/30 hover:bg-surface-3'
              }`}
            >
              <ExternalLink size={14} className={isConnected ? 'text-success' : p.color} />
              <span className="text-xs font-medium text-text group-hover:text-primary transition-colors">{p.label}</span>
              {connectMutation.isPending && connecting === p.id && (
                <span className="text-[10px] text-primary ml-auto">...</span>
              )}
              {isConnected && !connectMutation.isPending && (
                <span className="text-[10px] text-success ml-auto">Conectado</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-text-3 mt-3">
        Las conexiones OAuth son placeholders. Al conectar se registra la vinculación para importar actividades.
      </p>
    </Card>
  );
}
