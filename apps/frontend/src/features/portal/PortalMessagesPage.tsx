import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';

interface PortalMessage {
  id: string;
  contenido: string;
  created_at: string;
}

export function PortalMessagesPage() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: async () => {
      return await api.getUnwrapped<PortalMessage[]>('/portal/messages') ?? [];
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
          {messages.map((msg: PortalMessage) => (
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
