import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { FoodFormDialog } from './FoodFormDialog';
import { FoodImportDialog } from './FoodImportDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/components/ui/Toast';

type Source = 'all' | 'BEDCA' | 'OFF' | 'USDA' | 'combined';

interface UnifiedFood {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sodium_per_100g?: number;
  sugar_per_100g?: number;
  source: 'BEDCA' | 'OFF' | 'USDA' | 'local';
  externalId?: string;
  is_local?: boolean;
  region?: string;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `food_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function extractUsdaNutrient(
  foodNutrients: { nutrientName: string; value: number; unitName?: string }[],
  name: string,
  unit?: string
): number | undefined {
  return foodNutrients.find((n) => {
    if (n.nutrientName !== name) return false;
    if (unit) return n.unitName === unit || n.unitName === unit.toUpperCase();
    return true;
  })?.value;
}

function normalizeUsdaResponse(data: unknown): UnifiedFood[] {
  const foods = (data as { foods?: unknown[] }).foods || [];
  return foods.map((f: unknown) => {
    const item = f as {
      fdcId: number;
      description: string;
      foodNutrients: { nutrientName: string; value: number; unitName?: string }[];
    };
    return {
      id: String(item.fdcId),
      name: item.description,
      calories_per_100g: extractUsdaNutrient(item.foodNutrients, 'Energy', 'kcal'),
      protein_per_100g: extractUsdaNutrient(item.foodNutrients, 'Protein'),
      carbs_per_100g: extractUsdaNutrient(item.foodNutrients, 'Carbohydrate, by difference'),
      fat_per_100g: extractUsdaNutrient(item.foodNutrients, 'Total lipid (fat)'),
      fiber_per_100g: extractUsdaNutrient(item.foodNutrients, 'Fiber, total dietary'),
      sodium_per_100g: extractUsdaNutrient(item.foodNutrients, 'Sodium, Na'),
      source: 'USDA',
      externalId: String(item.fdcId),
      is_local: false,
    };
  });
}

function normalizeOffResponse(data: unknown): UnifiedFood[] {
  const products = (data as { products?: unknown[] }).products || [];
  return products.map((p: unknown) => {
    const item = p as {
      code: string;
      product_name: string;
      product_name_es?: string;
      brands?: string;
      nutriments: Record<string, number | undefined>;
    };
    return {
      id: item.code || generateId(),
      name: item.product_name_es || item.product_name || 'Sin nombre',
      brand: item.brands,
      calories_per_100g: item.nutriments['energy-kcal_100g'],
      protein_per_100g: item.nutriments.proteins_100g,
      carbs_per_100g: item.nutriments.carbohydrates_100g,
      fat_per_100g: item.nutriments.fat_100g,
      fiber_per_100g: item.nutriments.fiber_100g,
      sodium_per_100g: item.nutriments.sodium_100g,
      sugar_per_100g: item.nutriments.sugars_100g,
      source: 'OFF',
      externalId: item.code,
      is_local: false,
    };
  });
}

export function FoodsPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [source, setSource] = useState<Source>('all');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (food: UnifiedFood) => {
      const payload: Record<string, unknown> = {
        name: food.name,
        brand: food.brand,
        category: food.category,
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fat_per_100g: food.fat_per_100g,
        fiber_per_100g: food.fiber_per_100g,
        sodium_per_100g: food.sodium_per_100g,
        sugar_per_100g: food.sugar_per_100g,
        allergens: [],
        diet_types: [],
        barcode: food.externalId,
        region: 'ES',
        is_local: true,
        source: food.source,
      };
      return api.post('/foods/import', payload);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['foods'] });
      addToast('success', t('common.success'), `${variables.name} - ${t('foods.importSuccess')}`);
      setSource('all');
    },
    onError: () => {
      addToast('error', t('common.error'), 'Error al importar alimento');
    },
  });

  const { data: foods = [], isLoading } = useQuery<UnifiedFood[]>({
    queryKey: ['foods', debouncedSearch, source],
    queryFn: async () => {
      if (source === 'combined') {
        const bedcaParams = new URLSearchParams();
        if (debouncedSearch) bedcaParams.set('search', debouncedSearch);
        const offParams = new URLSearchParams();
        if (debouncedSearch) offParams.set('q', debouncedSearch);

        const [bedcaRes, offRes, usdaRes] = await Promise.allSettled([
          api.get('/foods?' + bedcaParams.toString()),
          api.get('/foods/off/search?' + offParams.toString()),
          api.get('/foods/usda/search?' + offParams.toString()),
        ]);

        const bedca = bedcaRes.status === 'fulfilled'
          ? ((bedcaRes.value.data.foods || bedcaRes.value.data.data || bedcaRes.value.data || []) as Array<Omit<UnifiedFood, 'source'> & { source?: string }>).map((f) => ({
              ...f,
              source: (f.source as UnifiedFood['source']) || 'BEDCA',
              is_local: f.is_local ?? true,
            }))
          : [];
        const off = offRes.status === 'fulfilled' ? normalizeOffResponse(offRes.value.data) : [];
        const usda = usdaRes.status === 'fulfilled' ? normalizeUsdaResponse(usdaRes.value.data) : [];

        const merged = [...bedca, ...off, ...usda];
        const seen = new Map<string, UnifiedFood>();
        for (const food of merged) {
          const key = food.name.toLowerCase().trim();
          if (!seen.has(key)) seen.set(key, food);
        }
        return Array.from(seen.values());
      }

      if (source === 'OFF') {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        const res = await api.get('/foods/off/search?' + params.toString());
        return normalizeOffResponse(res.data);
      }

      if (source === 'USDA') {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        const res = await api.get('/foods/usda/search?' + params.toString());
        return normalizeUsdaResponse(res.data);
      }

      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await api.get('/foods?' + params.toString());
      const raw = (res.data.foods || res.data.data || res.data || []) as Array<Omit<UnifiedFood, 'source'> & { source?: string }>;
      return raw.map((f) => ({
        ...f,
        source: (f.source as UnifiedFood['source']) || 'BEDCA',
        is_local: f.is_local ?? true,
      }));
    },
  });

  const handleImport = (food: UnifiedFood) => {
    importMutation.mutate(food);
  };

  const getSourceBadgeVariant = (s: string): 'success' | 'info' | 'warning' | 'secondary' => {
    switch (s) {
      case 'BEDCA':
        return 'success';
      case 'OFF':
        return 'info';
      case 'USDA':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const sourceTabs: { key: Source; labelKey: string }[] = [
    { key: 'all', labelKey: 'foods.sourceAll' },
    { key: 'BEDCA', labelKey: 'foods.sourceBedca' },
    { key: 'OFF', labelKey: 'foods.sourceOff' },
    { key: 'USDA', labelKey: 'foods.sourceUsda' },
    { key: 'combined', labelKey: 'foods.sourceCombined' },
  ];

  const columns = useMemo<TableColumn<UnifiedFood>[]>(() => [
    { key: 'name', header: t('foods.title'), sortable: true },
    { key: 'calories', header: t('foods.kcal'), sortable: true },
    { key: 'protein', header: t('foods.protein'), sortable: true },
    { key: 'fat', header: t('foods.fat'), sortable: true },
    { key: 'carbs', header: t('foods.carbs'), sortable: true },
    { key: 'fiber', header: t('foods.fiber'), sortable: true },
    { key: 'portion', header: t('foods.portion'), sortable: true },
    { key: 'source', header: t('foods.source'), sortable: true },
    { key: 'status', header: 'Estado', sortable: true },
    { key: 'actions', header: '', sortable: false },
  ], [t]);

  const renderRow = (row: UnifiedFood) => ({
    name: (
      <div>
        <div className="font-medium text-text flex items-center gap-2">
          {row.name}
          {row.source === 'OFF' || row.source === 'USDA' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleImport(row)}
              disabled={importMutation.isPending}
            >
              Importar
            </Button>
          ) : null}
        </div>
        {row.category && <div className="text-[10px] text-text-3">{row.category}</div>}
      </div>
    ),
    calories: <span className="text-right font-medium text-primary block">{row.calories_per_100g ?? '-'}</span>,
    protein: <span className="text-right text-text block">{row.protein_per_100g ?? '-'}</span>,
    fat: <span className="text-right text-text block">{row.fat_per_100g ?? '-'}</span>,
    carbs: <span className="text-right text-text block">{row.carbs_per_100g ?? '-'}</span>,
    fiber: <span className="text-right text-text block">{row.fiber_per_100g ?? '-'}</span>,
    portion: <span className="text-text-3">{row.region || '-'}</span>,
    source: (
      <Badge variant={getSourceBadgeVariant(row.source)} size="sm">
        {row.source}
      </Badge>
    ),
    status: (
      <Badge variant={row.is_local ? 'success' : 'secondary'} size="sm" dot>
        {row.is_local ? 'Local' : 'Global'}
      </Badge>
    ),
    actions: row.source === 'OFF' || row.source === 'USDA' ? (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => handleImport(row)}
        disabled={importMutation.isPending}
      >
        Importar
      </Button>
    ) : null,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('foods.title')}</h1>
          <p className="text-text-3 text-sm mt-1">{t('foods.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border text-text rounded-lg hover:bg-surface-3 transition-colors text-sm font-medium">
            <ExternalLink size={14} /> USDA
          </a>
          <Button variant="secondary" onClick={() => setShowImport(true)} icon={<Plus size={16} />}>
            Importar alimento
          </Button>
          <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
            {t('common.createFood')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-1 bg-surface-2 p-1 rounded-lg w-fit">
          {sourceTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSource(tab.key)}
              className={[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                source === tab.key
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-3 hover:text-text',
              ].join(' ')}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <Input
          type="text"
          placeholder={t('foods.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>

      {isLoading ? (
        <Card className="p-6">
          <Table
            columns={columns}
            data={[]}
            keyExtractor={(r) => r.id}
            loading={true}
          />
        </Card>
      ) : !foods?.length ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-text mb-1">{t('common.noResults')}</h3>
          <p className="text-text-3 text-sm">
            {search ? t('foods.noResultsDesc') : t('foods.searchPlaceholderDesc')}
          </p>
        </Card>
      ) : (
        <Card className="p-0">
          <Table
            columns={columns}
            data={foods}
            keyExtractor={(r) => r.id}
            renderRow={renderRow}
          />
        </Card>
      )}
      <FoodFormDialog open={showForm} onClose={() => setShowForm(false)} />
      <FoodImportDialog open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
