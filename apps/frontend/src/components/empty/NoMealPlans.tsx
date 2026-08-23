import { UtensilsCrossed } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NoMealPlansProps {
  onAdd?: () => void;
}

export function NoMealPlans({ onAdd }: NoMealPlansProps) {
  return (
    <EmptyState
      icon={UtensilsCrossed}
      title="No hay planes alimenticios"
      description="Diseña planes personalizados para tus pacientes con objetivos nutricionales específicos."
      actionLabel="Crear Plan"
      onAction={onAdd}
    />
  );
}
