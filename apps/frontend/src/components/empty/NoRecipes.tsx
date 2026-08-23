import { ChefHat } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NoRecipesProps {
  onAdd?: () => void;
}

export function NoRecipes({ onAdd }: NoRecipesProps) {
  return (
    <EmptyState
      icon={ChefHat}
      title="No hay recetas"
      description="Crea recetas para tus pacientes con información nutricional detallada."
      actionLabel="Crear Receta"
      onAction={onAdd}
    />
  );
}
