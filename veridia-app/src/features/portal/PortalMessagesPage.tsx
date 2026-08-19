import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';

export function PortalMessagesPage() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: async () => {
      const res = await api.get('/portal/messages');
      return res.data || [];
    },
  });

  if (isLoading) return <div className="space-y-4">Cargando mensajes...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Mensajes</h1>
      {!messages?.length ? (
        <Card className="p-8 text-center text-text-3">No hay mensajes</Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((msg: any) => (
            <Card key={msg.id} className="p-4">
              <p className="text-text">{msg.contenido}</p>
              <p className="text-xs text-text-3 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
