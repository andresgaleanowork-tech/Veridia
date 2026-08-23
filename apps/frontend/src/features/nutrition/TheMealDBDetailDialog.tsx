import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Map } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/components/ui/Toast';

interface TheMealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  [key: string]: unknown;
}

interface IngredientMap {
  name: string;
  measure: string;
  localMatches: { id: string; name: string; calories: string }[];
  selectedMatchId?: string;
}

interface TheMealDBDetailDialogProps {
  open: boolean;
  onClose: () => void;
  mealId: string;
}

export function TheMealDBDetailDialog({ open, onClose, mealId }: TheMealDBDetailDialogProps) {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [mappedIngredients, setMappedIngredients] = useState<IngredientMap[]>([]);
  const [isMapping, setIsMapping] = useState<Record<number, boolean>>({});

  const { data: meal, isLoading: mealLoading } = useQuery({
    queryKey: ['mealdb', mealId],
    queryFn: async () => {
      const res = await api.get(`/recipes/mealdb/${mealId}`);
      return res.data as TheMealDBMeal;
    },
    enabled: open && !!mealId,
  });

  const { data: mapData } = useQuery({
    queryKey: ['mealdb-map', mealId],
    queryFn: async () => {
      const res = await api.get(`/recipes/mealdb/${mealId}/ingredients/map`);
      return res.data as { ingredients: IngredientMap[] };
    },
    enabled: false,
  });

  const importMutation = useMutation({
    mutationFn: async (data: { nombre: string; ingredientes: string[]; pasos: string[]; source: string; mealdb_id: string; kcal?: number; prot?: number; grasas?: number; hc?: number; fibra?: number }) => {
      const res = await api.post('/recipes', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      addToast('success', t('common.success'), t('recipes.mealdbImportSuccess'));
      onClose();
    },
    onError: () => {
      addToast('error', t('common.error'), t('recipes.mealdbImportError'));
    },
  });

  useEffect(() => {
    if (mapData?.ingredients) {
      setMappedIngredients(mapData.ingredients);
    }
  }, [mapData]);

  useEffect(() => {
    setMappedIngredients([]);
    setIsMapping({});
  }, [mealId]);

  const handleMapIngredient = async (index: number) => {
    setIsMapping((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await api.get(`/recipes/mealdb/${mealId}/ingredients/map`);
      const data = res.data as { ingredients: IngredientMap[] };
      setMappedIngredients(data.ingredients);
    } catch {
      addToast('error', t('common.error'), 'Error al mapear ingredientes');
    } finally {
      setIsMapping((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSelectMatch = (ingredientIndex: number, matchId: string) => {
    setMappedIngredients((prev) =>
      prev.map((ing, i) =>
        i === ingredientIndex ? { ...ing, selectedMatchId: matchId } : ing
      )
    );
  };

  const ingredients = useMemo(() => {
    if (!meal) return [];
    const items: { name: string; measure: string }[] = [];
    for (let i = 1; i <= 20; i++) {
      const name = (meal as unknown as Record<string, string | undefined>)[`strIngredient${i}`];
      const measure = (meal as unknown as Record<string, string | undefined>)[`strMeasure${i}`];
      if (name && name.trim()) {
        items.push({ name: name.trim(), measure: measure?.trim() || '' });
      }
    }
    return items;
  }, [meal]);

  const steps = useMemo(() => {
    if (!meal?.strInstructions) return [];
    return meal.strInstructions
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [meal]);

  const handleImport = () => {
    if (!meal) return;
    const ingredientStrings = ingredients.map((ing) =>
      `${ing.measure} ${ing.name}`.trim()
    );
    const stepsArray = steps;
    importMutation.mutate({
      nombre: meal.strMeal,
      ingredientes: ingredientStrings,
      pasos: stepsArray,
      source: 'mealdb',
      mealdb_id: meal.idMeal,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-elevated max-h-[85vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">{meal?.strMeal || t('recipes.mealdbIngredients')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          {mealLoading ? (
            <div className="space-y-4">
              <Card className="p-6"><div className="animate-pulse space-y-3">
                <div className="h-48 bg-surface-2 rounded-lg" />
                <div className="h-4 bg-surface-2 rounded w-3/4" />
                <div className="h-4 bg-surface-2 rounded w-1/2" />
              </div></Card>
            </div>
          ) : meal ? (
            <div className="space-y-6">
              {meal.strMealThumb && (
                <img src={meal.strMealThumb} alt={meal.strMeal} className="w-full h-48 object-cover rounded-xl" />
              )}
              <div className="flex flex-wrap gap-2">
                {meal.strCategory && <Badge variant="secondary">{meal.strCategory}</Badge>}
                {meal.strArea && <Badge variant="info">{meal.strArea}</Badge>}
              </div>
              <div>
                <h3 className="text-md font-semibold text-text mb-2">{t('recipes.mealdbIngredients')}</h3>
                <div className="space-y-2">
                  {ingredients.map((ing, i) => {
                    const mapped = mappedIngredients[i];
                    return (
                      <Card key={i} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-text">{ing.measure} {ing.name}</p>
                            {mapped && mapped.localMatches.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {mapped.localMatches.map((match) => (
                                  <button
                                    key={match.id}
                                    onClick={() => handleSelectMatch(i, match.id)}
                                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                      mapped.selectedMatchId === match.id
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'bg-surface-2 border-border text-text-3 hover:text-text'
                                    }`}
                                  >
                                    {match.name} ({match.calories} {t('recipes.mealdbCalories')})
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMapIngredient(i)}
                            loading={isMapping[i]}
                          >
                            <Map size={14} /> {t('recipes.mealdbMapIngredient')}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-md font-semibold text-text mb-2">{t('recipes.mealdbInstructions')}</h3>
                <Card className="p-4">
                  <p className="text-sm text-text-2 whitespace-pre-line">{meal.strInstructions}</p>
                </Card>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleImport} loading={importMutation.isPending}>
                  {t('recipes.mealdbImport')}
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-text-3 text-sm">{t('recipes.mealdbNoResults')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
