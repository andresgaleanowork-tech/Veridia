import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['professional-notifications'],
    queryFn: async () => {
      return await api.getUnwrapped<{ notifications: Notification[]; unread: number }>('/notifications?limit=50');
    },
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professional-notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professional-notifications'] }),
  });

  const notifications: Notification[] = data?.notifications || [];
  const unread = data?.unread || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Bell size={24} /> Notificaciones
          </h1>
          {unread > 0 && <p className="text-sm text-text-3 mt-1">{unread} sin leer</p>}
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={() => markAllRead.mutate()} icon={<CheckCheck size={16} />}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface animate-pulse rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell size={32} className="text-text-3 mx-auto mb-3" />
          <p className="text-text-2">No tenés notificaciones</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead.mutate(n.id)}
              className={`p-4 flex items-start gap-3 cursor-pointer transition-colors rounded-lg ${
                !n.read ? 'border-l-2 border-l-primary bg-primary/5' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                n.type === 'adherence_alert' ? 'bg-warning/10 text-warning' :
                n.type === 'new_message' ? 'bg-info/10 text-info' :
                'bg-primary/10 text-primary'
              }`}>
                {n.read ? <Check size={14} /> : <Bell size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-text">{n.title}</span>
                  {!n.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                </div>
                <p className="text-xs text-text-3 mt-1 line-clamp-2">{n.body}</p>
                <span className="text-[10px] text-text-3 mt-1 block">{formatTimeAgo(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}
