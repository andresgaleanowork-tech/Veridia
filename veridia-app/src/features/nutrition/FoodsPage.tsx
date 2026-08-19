import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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

interface Food {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  portion?: string;
  source?: string;
  region?: string;
  is_local?: boolean;
}

export function FoodsPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: foods, isLoading } = useQuery({
    queryKey: ['foods', debouncedSearch],
    queryFn: async (): Promise<Food[]> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await api.get(`/foods?${params.toString()}`);
      return res.data.foods || res.data.data || res.data || [];
    },
  });

  const columns = useMemo<TableColumn<Food>[]>(() => [
    { key: 'name', header: t('foods.title'), sortable: true },
    { key: 'calories', header: t('foods.kcal'), sortable: true },
    { key: 'protein', header: t('foods.protein'), sortable: true },
    { key: 'fat', header: t('foods.fat'), sortable: true },
    { key: 'carbs', header: t('foods.carbs'), sortable: true },
    { key: 'fiber', header: t('foods.fiber'), sortable: true },
    { key: 'portion', header: t('foods.portion'), sortable: true },
    { key: 'source', header: t('foods.source'), sortable: true },
    { key: 'status', header: 'Estado', sortable: true },
  ], [locale]);

  const renderRow = (row: Food) => ({
    name: (
      <div>
        <div className="font-medium text-text">{row.name}</div>
        {row.category && <div className="text-[10px] text-text-3">{row.category}</div>}
      </div>
    ),
    calories: <span className="text-right font-medium text-primary block">{row.calories_per_100g ?? '—'}</span>,
    protein: <span className="text-right text-text block">{row.protein_per_100g ?? '—'}</span>,
    fat: <span className="text-right text-text block">{row.fat_per_100g ?? '—'}</span>,
    carbs: <span className="text-right text-text block">{row.carbs_per_100g ?? '—'}</span>,
    fiber: <span className="text-right text-text block">{row.fiber_per_100g ?? '—'}</span>,
    portion: <span className="text-text-3">{row.region || '—'}</span>,
    source: row.source ? (
      <span className="text-[10px] bg-surface-3 text-text-3 px-2 py-0.5 rounded">{row.source}</span>
    ) : '—',
    status: (
      <Badge variant={row.is_local ? 'success' : 'secondary'} size="sm" dot>
        {row.is_local ? 'Local' : 'Global'}
      </Badge>
    ),
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

      <Input
        type="text"
        placeholder={t('foods.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search size={16} />}
      />

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