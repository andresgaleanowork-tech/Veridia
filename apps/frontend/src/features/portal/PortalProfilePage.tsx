import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Save, Bell } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function PortalProfilePage() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({ nombre: '', email: '', telefono: '' });
  const [notifications, setNotifications] = useState({
    appointment_reminders: true,
    meal_plan_updates: true,
    messages: true,
    weekly_checkin: true,
  });

  const { isLoading: _isLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const profileData = await api.getUnwrapped<any>('/portal/profile');
      setProfile(profileData);
      return profileData;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put('/portal/profile', profile);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-profile'] }),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-text flex items-center gap-2">
        <User size={24} /> Mi Perfil
      </h1>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text mb-4">Datos personales</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-2 mb-1">Nombre</label>
            <Input
              value={profile.nombre}
              onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-text-2 mb-1">Email</label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-text-2 mb-1">Teléfono</label>
            <Input
              value={profile.telefono}
              onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} icon={<Save size={16} />}>
            {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <Bell size={16} /> Preferencias de notificación
        </h3>
        <div className="space-y-3">
          {([
            ['appointment_reminders', 'Recordatorios de citas'],
            ['meal_plan_updates', 'Actualizaciones de plan alimentario'],
            ['messages', 'Mensajes de mi profesional'],
            ['weekly_checkin', 'Check-in semanal'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between p-3 bg-bg rounded-lg cursor-pointer">
              <span className="text-sm text-text">{label}</span>
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                className="w-4 h-4 rounded text-primary"
              />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
