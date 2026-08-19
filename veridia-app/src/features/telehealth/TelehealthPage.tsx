import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Video, Phone, PhoneOff } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

export function TelehealthPage() {
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [session, setSession] = useState<any>(null);
  const { addToast } = useToast();

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.appointments || res.data.data || res.data || [];
    },
  });

  const startMutation = useMutation({
    mutationFn: async (data: { appointmentId: string; provider: string }) => {
      const res = await api.post('/telehealth/start', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setSession(data);
      addToast('success', 'Sesión iniciada');
    },
    onError: () => {
      addToast('error', 'Error al iniciar telehealth');
    },
  });

  const endMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      await api.post(`/telehealth/${appointmentId}/end`);
    },
    onSuccess: () => {
      setSession(null);
      addToast('success', 'Sesión finalizada');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Telehealth</h1>

      {!session ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Turno</label>
              <Select
                value={selectedAppointment}
                onValueChange={setSelectedAppointment}
                options={[
                  { value: '', label: 'Seleccionar turno...' },
                  ...(appointments?.filter((a: any) => a.estado !== 'Cancelada' && a.estado !== 'Realizada').map((apt: any) => ({ value: apt.id, label: `${apt.fecha} ${apt.hora} - ${apt.paciente_nombre || 'Paciente'}` })) || []),
                ]}
              />
            </div>
            <Button onClick={() => startMutation.mutate({ appointmentId: selectedAppointment, provider: 'zoom' })} loading={startMutation.isPending} icon={<Video size={16} />}>
              Iniciar sesión
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Video className="text-success" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-text">Sesión activa</h3>
            <p className="text-text-3">ID: {session.meetingId}</p>
            <a href={session.telehealthLink} target="_blank" rel="noopener noreferrer" className="inline-block">
              <Button icon={<Phone size={16} />}>Unirse a la llamada</Button>
            </a>
            <div>
              <Button variant="danger" onClick={() => endMutation.mutate(session.appointmentId)} icon={<PhoneOff size={16} />}>
                Finalizar sesión
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
