import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, DollarSign, Plus, Filter, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import type { Gasto } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

const PERIOD_FILTER = [
  { value: 'month', labelKey: 'accounting.thisMonth' },
  { value: 'quarter', labelKey: 'accounting.quarter' },
  { value: 'year', labelKey: 'accounting.year' },
] as const;

export function AccountingPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [showForm, setShowForm] = useState(false);

  const { data: gastos, isLoading } = useQuery({
    queryKey: ['gastos', period],
    queryFn: async (): Promise<Gasto[]> => {
      const res = await api.get('/gastos');
      return res.data.gastos || res.data.data || res.data || [];
    },
  });

  const now = new Date();
  const filteredGastos = useMemo(() => (gastos || []).filter((g) => {
    const d = new Date(g.fecha);
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      const gq = Math.floor(d.getMonth() / 3);
      return gq === q && d.getFullYear() === now.getFullYear();
    }
    return d.getFullYear() === now.getFullYear();
  }), [gastos, period]);

  const totalGastos = useMemo(() => filteredGastos.reduce((sum, g) => sum + (g.importe || 0), 0), [filteredGastos]);

  const categorias = useMemo(() => filteredGastos.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + (g.importe || 0);
    return acc;
  }, {} as Record<string, number>), [filteredGastos]);

  const sortedCategorias = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

  const columns = useMemo<TableColumn<Gasto>[]>(() => [
    { key: 'fecha', header: 'Fecha', sortable: true, render: (row) => <span className="text-text-3">{new Date(row.fecha).toLocaleDateString('es-ES')}</span> },
    { key: 'categoria', header: 'Categoría', sortable: true, render: (row) => <Badge variant="secondary" size="sm">{row.categoria}</Badge> },
    { key: 'descripcion', header: 'Descripción', sortable: true },
    { key: 'importe', header: 'Importe', sortable: true, render: (row) => <span className="text-right font-medium text-danger">-{row.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span> },
    { key: 'metodo_pago', header: 'Método', sortable: true, render: (row) => <span className="text-text-3">{row.metodo_pago || '—'}</span> },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('accounting.title')}</h1>
          <p className="text-text-3 text-sm mt-1">{t('accounting.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          {t('accounting.newExpense')}
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border w-fit">
        {PERIOD_FILTER.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={period === p.value ? 'primary' : 'ghost'}
            onClick={() => setPeriod(p.value)}
            className={
              period === p.value
                ? ''
                : 'text-text-3 hover:text-text hover:bg-surface-3 border border-transparent'
            }
          >
            {t(p.labelKey)}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <TrendingDown size={14} className="text-danger" />
            </div>
            <span className="text-xs text-text-3">{t('accounting.totalExpenses')}</span>
          </div>
          <div className="text-xl font-bold text-text">
            {totalGastos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
              <DollarSign size={14} className="text-text-3" />
            </div>
            <span className="text-xs text-text-3">{t('accounting.categories')}</span>
          </div>
          <div className="text-xl font-bold text-text">{sortedCategorias.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-warning" />
            </div>
            <span className="text-xs text-text-3">{t('accounting.topExpense')}</span>
          </div>
          <div className="text-lg font-bold text-text">{sortedCategorias[0]?.[0] || '—'}</div>
          <div className="text-xs text-text-3">
            {sortedCategorias[0]?.[1]?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || ''}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
              <Filter size={14} className="text-text-3" />
            </div>
            <span className="text-xs text-text-3">{t('accounting.records')}</span>
          </div>
          <div className="text-xl font-bold text-text">{filteredGastos.length}</div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text mb-4">{t('accounting.expenseByCategory')}</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton variant="text" className="h-4 w-32" />
                <Skeleton variant="rect" className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : sortedCategorias.length === 0 ? (
          <p className="text-text-3 text-sm text-center py-8">{t('accounting.noExpensesPeriod')}</p>
        ) : (
          <div className="space-y-3">
            {sortedCategorias.map(([cat, total]) => {
              const pct = totalGastos > 0 ? (total / totalGastos) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text">{cat}</span>
                    <span className="text-text-3">{total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent Gastos */}
      <Card className="overflow-hidden">
        <CardHeader title={t('accounting.recentExpenses')} />
        {isLoading ? (
          <div className="p-6">
            <Table columns={columns} data={[]} keyExtractor={(r) => r.id} loading />
          </div>
        ) : (
          <Table columns={columns} data={filteredGastos.slice(0, 20)} keyExtractor={(r) => r.id} />
        )}
      </Card>
      <ExpenseFormDialog open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
