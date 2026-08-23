import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Scale } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/components/ui/Toast';

interface Recipe {
  id: string;
  nombre: string;
  raciones: number;
  kcal?: number;
  prot?: number;
  grasas?: number;
  hc?: number;
  fibra?: number;
  ingredientes?: string[];
}

interface ScaledRecipe {
  id: string;
  nombre: string;
  raciones: number;
  racionesOriginales: number;
  factorEscalado: number;
  kcal: number;
  prot: number;
  grasas: number;
  hc: number;
  fibra: number;
  ingredientes: Array<{ nombre: string; cantidad: number; unidad: string }>;
}

interface Props {
  recipe: Recipe;
}

export function RecipeScaler({ recipe }: Props) {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [targetServings, setTargetServings] = useState(recipe.raciones);
  const [scaled, setScaled] = useState<ScaledRecipe | null>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const scaleMutation = useMutation({
    mutationFn: async (servings: number) => {
      const res = await api.post(`/recipes/${recipe.id}/scale`, { targetServings: servings });
      return res.data as ScaledRecipe;
    },
    onSuccess: (data) => {
      setScaled(data);
      addToast('success', t('recipes.scaleSuccess'));
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: () => {
      addToast('error', t('recipes.scaleError'));
    },
  });

  const handleScale = () => {
    if (targetServings && targetServings > 0) {
      scaleMutation.mutate(targetServings);
    }
  };

  const factor = targetServings / recipe.raciones;

  const normalizeIngredient = (ing: string | { nombre: string; cantidad: number; unidad: string }): { nombre: string; cantidad: number; unidad: string } => {
    if (typeof ing === 'string') return { nombre: ing, cantidad: 1, unidad: 'unidad' };
    return ing;
  };

  const scaledIngredients = scaled?.ingredientes?.map(normalizeIngredient) || [];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        icon={<Scale size={14} />}
      >
        {t('recipes.scale')}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t('recipes.scale')}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-text-3 mb-1">{t('recipes.originalServings')}</label>
              <Input type="number" value={recipe.raciones} disabled />
            </div>
            <div>
              <label className="block text-sm text-text-3 mb-1">{t('recipes.targetServings')}</label>
              <Input
                type="number"
                min={1}
                value={targetServings}
                onChange={(e) => setTargetServings(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="block text-sm text-text-3 mb-1">{t('recipes.scaleFactor')}</label>
              <Input type="text" value={`${factor.toFixed(2)}x`} disabled />
            </div>
          </div>

          <Button onClick={handleScale} loading={scaleMutation.isPending} className="w-full">
            {t('recipes.scale')}
          </Button>

          {scaled && (
            <Card className="p-4 space-y-3">
              <h4 className="font-semibold text-text">{t('recipes.scaledIngredients')}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>{t('foods.kcal')}: {Math.round(scaled.kcal)}</div>
                <div>{t('foods.protein')}: {scaled.prot.toFixed(1)}g</div>
                <div>{t('foods.fat')}: {scaled.grasas.toFixed(1)}g</div>
                <div>{t('foods.carbs')}: {scaled.hc.toFixed(1)}g</div>
              </div>
              <div className="space-y-1">
                {scaledIngredients.map((ing, i) => (
                  <div key={i} className="text-sm flex justify-between">
                    <span>{ing.nombre}</span>
                    <span className="text-text-3">{ing.cantidad.toFixed(2)} {ing.unidad}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </Dialog>
    </>
  );
}
