import { Users } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NoPatientsProps {
  onAdd?: () => void;
}

export function NoPatients({ onAdd }: NoPatientsProps) {
  return (
    <EmptyState
      icon={Users}
      title="No hay pacientes"
      description="Comienza agregando tu primer paciente para gestionar su historial clínico y planes nutricionales."
      actionLabel="Agregar Paciente"
      onAction={onAdd}
    />
  );
}
