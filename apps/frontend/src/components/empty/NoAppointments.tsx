import { Calendar } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NoAppointmentsProps {
  onAdd?: () => void;
}

export function NoAppointments({ onAdd }: NoAppointmentsProps) {
  return (
    <EmptyState
      icon={Calendar}
      title="No hay citas programadas"
      description="Agenda una cita para comenzar a gestionar las consultas de tus pacientes."
      actionLabel="Agendar Cita"
      onAction={onAdd}
    />
  );
}
