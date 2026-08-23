import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

interface Food {
  name: string;
  portion: number;
}

interface Meal {
  type: string;
  foods: Food[];
  totalCalories: number;
}

interface GeneratedMealPlanDay {
  day: number;
  meals: Meal[];
  totalCalories: number;
}

interface GenerateMealPlanResponse {
  plan: GeneratedMealPlanDay[];
}

interface MealPlanGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  patientId?: string;
}

export function MealPlanGeneratorDialog({ open, onClose, patientId }: MealPlanGeneratorDialogProps) {
  const [objectives, setObjectives] = useState({
    calories: 2000,
    macros: { protein: 120, carbs: 200, fat: 65 },
    allergens: [] as string[],
    dietType: 'balanced',
    durationDays: 7,
  });
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlanDay[] | null>(null);
  const { addToast } = useToast();
  const qc = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (data: { calories: number; macros: { protein: number; carbs: number; fat: number }; allergens: string[]; dietType: string; durationDays: number }) => {
      const res = await api.post('/meal-plans/generator/generate', { ...data, patientId });
      return res.data as GenerateMealPlanResponse;
    },
    onSuccess: (data: GenerateMealPlanResponse) => {
      setGeneratedPlan(data.plan);
      qc.invalidateQueries({ queryKey: ['meal-plans'] });
      addToast('success', 'Plan generado exitosamente');
    },
    onError: () => {
      addToast('error', 'Error al generar plan');
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate(objectives);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Generar Plan Alimentario" size="lg">
      {!generatedPlan ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Calorías objetivo</label>
              <Input type="number" value={objectives.calories} onChange={(e) => setObjectives({ ...objectives, calories: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Duración (días)</label>
              <Input type="number" value={objectives.durationDays} onChange={(e) => setObjectives({ ...objectives, durationDays: parseInt(e.target.value) || 7 })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Proteínas (g)</label>
              <Input type="number" value={objectives.macros.protein} onChange={(e) => setObjectives({
                ...objectives,
                macros: { ...objectives.macros, protein: parseInt(e.target.value) || 0 }
              })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Carbohidratos (g)</label>
              <Input type="number" value={objectives.macros.carbs} onChange={(e) => setObjectives({
                ...objectives,
                macros: { ...objectives.macros, carbs: parseInt(e.target.value) || 0 }
              })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-2">Grasas (g)</label>
              <Input type="number" value={objectives.macros.fat} onChange={(e) => setObjectives({
                ...objectives,
                macros: { ...objectives.macros, fat: parseInt(e.target.value) || 0 }
              })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-2">Tipo de dieta</label>
            <Select
              value={objectives.dietType}
              onValueChange={(val) => setObjectives({ ...objectives, dietType: val })}
              options={[
                { value: 'balanced', label: 'Balanceada' },
                { value: 'keto', label: 'Keto' },
                { value: 'paleo', label: 'Paleo' },
                { value: 'vegetarian', label: 'Vegetariana' },
                { value: 'vegan', label: 'Vegana' },
                { value: 'low_fodmap', label: 'Low FODMAP' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleGenerate} loading={generateMutation.isPending} icon={<Sparkles size={16} />}>
              Generar Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-text-2">
            Plan generado: {generatedPlan.length} días | Total promedio: {Math.round(generatedPlan.reduce((sum: number, d: GeneratedMealPlanDay) => sum + d.totalCalories, 0) / generatedPlan.length)} kcal/día
          </div>
          {generatedPlan.map((day: GeneratedMealPlanDay) => (
            <Card key={day.day} className="p-4">
              <h4 className="font-semibold text-text mb-2">Día {day.day}</h4>
              <div className="space-y-2">
                {day.meals.map((meal: Meal, idx: number) => (
                  <div key={idx} className="text-sm">
                    <span className="text-text-3">{meal.type}:</span>
                    <span className="text-text ml-2">{meal.foods.map((f: Food) => `${f.name} (${f.portion}g)`).join(', ')}</span>
                    <span className="text-text-3 ml-2">({meal.totalCalories} kcal)</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setGeneratedPlan(null)}>Volver</Button>
            <Button onClick={onClose}>Guardar Plan</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
