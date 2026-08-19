import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, FileText } from 'lucide-react';
import api from '@/lib/api';
import type { Invoice } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { InvoiceFormDialog } from './InvoiceFormDialog';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

const STATUS_FILTER = [
  { value: 'all', labelKey: 'invoices.all' },
  { value: 'Pendiente', labelKey: 'common.pending' },
  { value: 'Pagada', labelKey: 'common.paid' },
  { value: 'Vencida', labelKey: 'common.overdue' },
  { value: 'Anulada', labelKey: 'common.void' },
];

export function InvoicesPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', debouncedSearch, status],
    queryFn: async (): Promise<Invoice[]> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status !== 'all') params.set('status', status);
      const res = await api.get(`/invoices?${params.toString()}`);
      return res.data.invoices || res.data.data || res.data || [];
    },
  });

  const totalPendiente = useMemo(() => invoices?.filter((i) => i.estado === 'Pendiente').reduce((sum, i) => sum + (i.total || 0), 0) || 0, [invoices]);
  const totalCobrado = useMemo(() => invoices?.filter((i) => i.estado === 'Pagada').reduce((sum, i) => sum + (i.total || 0), 0) || 0, [invoices]);

  const statusBadge = (estado: string) => {
    const variant = estado === 'Pagada' ? 'success' : estado === 'Pendiente' ? 'warning' : estado === 'Vencida' ? 'danger' : 'secondary';
    return <Badge variant={variant} size="sm" dot>{estado}</Badge>;
  };

  const columns = useMemo<TableColumn<Invoice>[]>(() => [
    { key: 'numero', header: 'Nº Factura', sortable: true, render: (row) => <span className="font-mono font-medium text-primary">{row.numero}</span> },
    { key: 'paciente_nombre', header: 'Paciente', sortable: true },
    { key: 'fecha', header: 'Fecha', sortable: true, render: (row) => <span className="text-text-3">{new Date(row.fecha).toLocaleDateString('es-ES')}</span> },
    { key: 'total', header: 'Total', sortable: true, render: (row) => <span className="text-right font-bold text-text">{(row.total || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span> },
    { key: 'estado', header: 'Estado', sortable: true, render: (row) => statusBadge(row.estado) },
    { key: 'pagos', header: 'Pagos', render: (row) => <span className="text-text-3">{row.pagos?.length || 0}</span> },
  ], [statusBadge]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('invoices.title')}</h1>
          <p className="text-text-3 text-sm mt-1">{t('invoices.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          {t('invoices.newInvoice')}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-text-3 mb-1">{t('invoices.totalInvoiced')}</div>
          <div className="text-xl font-bold text-text">
            {(totalPendiente + totalCobrado).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text-3 mb-1">{t('invoices.pendingCollection')}</div>
          <div className="text-xl font-bold text-warning">
            {totalPendiente.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text-3 mb-1">{t('invoices.collected')}</div>
          <div className="text-xl font-bold text-success">
            {totalCobrado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </div>
        </Card>
      </div>

      <div className="flex gap-3">
        <Input
          type="text"
          placeholder={t('invoices.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border">
          {STATUS_FILTER.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={status === s.value ? 'primary' : 'ghost'}
              onClick={() => setStatus(s.value)}
              className={
                status === s.value
                  ? ''
                  : 'text-text-3 hover:text-text hover:bg-surface-3 border border-transparent whitespace-nowrap'
              }
            >
              {t(s.labelKey)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card className="p-6">
          <Table columns={columns} data={[]} keyExtractor={(r) => r.id} loading />
        </Card>
      ) : !invoices?.length ? (
        <Card className="p-12 text-center">
          <FileText size={32} className="text-text-3 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">{t('invoices.noInvoices')}</h3>
          <p className="text-text-3 text-sm">{t('invoices.noInvoicesDesc')}</p>
        </Card>
      ) : (
        <Card className="p-0">
          <Table columns={columns} data={invoices} keyExtractor={(r) => r.id} />
        </Card>
      )}
      <InvoiceFormDialog open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
