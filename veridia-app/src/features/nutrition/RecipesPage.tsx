import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Flame, Beef, Droplets, Wheat } from 'lucide-react';
import api from '@/lib/api';
import type { Recipe } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { RecipeFormDialog } from './RecipeFormDialog';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

const CATEGORIES = [
  { value: 'Todas', labelKey: 'recipes.categoriesAll' },
  { value: 'Desayuno', labelKey: 'recipes.breakfast' },
  { value: 'Almuerzo', labelKey: 'recipes.lunch' },
  { value: 'Cena', labelKey: 'recipes.dinner' },
  { value: 'Snack', labelKey: 'recipes.snack' },
  { value: 'Postre', labelKey: 'recipes.dessert' },
  { value: 'Bebida', labelKey: 'recipes.drink' },
];

export function RecipesPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [showForm, setShowForm] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes', debouncedSearch, category],
    queryFn: async (): Promise<Recipe[]> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category !== 'Todas') params.set('category', category);
      const res = await api.get(`/recipes?${params.toString()}`);
      return res.data.recipes || res.data.data || res.data || [];
    },
  });

  const recipeItems = useMemo(() => recipes?.map((r) => (
    <Card key={r.id} className="p-5 hover:border-primary/20 hover:shadow-glow transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-text group-hover:text-primary transition-colors line-clamp-1">{r.nombre}</h3>
        {r.categoria && (
          <Badge variant="secondary" size="sm">{r.categoria}</Badge>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <NutrientBadge icon={<Flame size={12} />} label={t('foods.kcal')} value={r.kcal} color="text-primary" />
        <NutrientBadge icon={<Beef size={12} />} label={t('foods.protein')} value={r.prot} color="text-accent" />
        <NutrientBadge icon={<Droplets size={12} />} label={t('foods.fat')} value={r.grasas} color="text-warning" />
        <NutrientBadge icon={<Wheat size={12} />} label={t('foods.carbs')} value={r.hc} color="text-info" />
      </div>

      <div className="flex items-center justify-between text-xs text-text-3">
        <span>{r.raciones} {t('recipes.servings').toLowerCase()}</span>
        {r.source && <span className="bg-surface-3 px-2 py-0.5 rounded">{r.source}</span>}
      </div>

      {r.ingredientes && r.ingredientes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {r.ingredientes.slice(0, 4).map((ing, i) => (
            <span key={i} className="text-[10px] bg-surface-2 text-text-3 px-1.5 py-0.5 rounded">
              {ing}
            </span>
          ))}
          {r.ingredientes.length > 4 && (
            <span className="text-[10px] text-text-3">+{r.ingredientes.length - 4}</span>
          )}
        </div>
      )}
    </Card>
  )), [recipes, t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('recipes.title')}</h1>
          <p className="text-text-3 text-sm mt-1">{t('recipes.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          {t('common.createRecipe')}
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          type="text"
          placeholder={t('recipes.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              size="sm"
              variant={category === cat.value ? 'primary' : 'ghost'}
              onClick={() => setCategory(cat.value)}
              className={
                category === cat.value
                  ? ''
                  : 'text-text-3 hover:text-text hover:bg-surface-3 border border-transparent whitespace-nowrap'
              }
            >
              {t(cat.labelKey)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton variant="text" className="h-5 w-3/4 mb-3" />
              <div className="grid grid-cols-4 gap-2 mb-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} variant="text" className="h-4 w-full text-center" />
                ))}
              </div>
              <Skeleton variant="text" className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : !recipes?.length ? (
        <Card className="p-12 text-center">
          <p className="text-text-3 text-sm">{t('recipes.noResults')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipeItems}
        </div>
      )}
      <RecipeFormDialog open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

function NutrientBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value?: number; color: string }) {
  return (
    <div className="text-center bg-surface-2 rounded-lg p-2 border border-border">
      <div className={`flex justify-center mb-0.5 ${color}`}>{icon}</div>
      <div className="text-sm font-bold text-text">{value ?? '—'}</div>
      <div className="text-[9px] text-text-3">{label}</div>
    </div>
  );
}
