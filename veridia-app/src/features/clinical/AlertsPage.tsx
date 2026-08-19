import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Info, Search } from 'lucide-react';
import api from '@/lib/api';
import type { Alert } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

export function AlertsPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', debouncedSearch],
    queryFn: async (): Promise<Alert[]> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await api.get(`/alerts?${params.toString()}`);
      return res.data.alerts || res.data.data || res.data || [];
    },
  });

  const severityConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    critica: { icon: <AlertTriangle size={16} />, color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
    grave: { icon: <AlertTriangle size={16} />, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    moderada: { icon: <Info size={16} />, color: 'text-info', bg: 'bg-info/10 border-info/20' },
    leve: { icon: <Info size={16} />, color: 'text-text-3', bg: 'bg-surface-2 border-border' },
  };

  const reviewMutation = useMutation({
    mutationFn: (id: string) => api.put(`/alerts/${id}`, { estado: 'revisada' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const pendingAlerts = useMemo(() => alerts?.filter((a) => a.estado === 'pendiente') || [], [alerts]);
  const reviewedAlerts = useMemo(() => alerts?.filter((a) => a.estado === 'revisada') || [], [alerts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('clinical.alerts')}</h1>
        <p className="text-text-3 text-sm mt-1">{t('clinical.alertsSubtitle')}</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder={t('clinical.alertsSearchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock size={18} className="text-warning" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{pendingAlerts.length}</div>
            <div className="text-xs text-text-3">{t('clinical.pending')}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle size={18} className="text-success" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{reviewedAlerts.length}</div>
            <div className="text-xs text-text-3">{t('clinical.reviewed')}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{alerts?.filter((a) => a.severidad === 'critica' || a.severidad === 'grave').length || 0}</div>
            <div className="text-xs text-text-3">{t('clinical.criticalSevere')}</div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-3 text-sm">{t('clinical.loadingAlerts')}</p>
        </div>
      ) : !alerts?.length ? (
        <div className="glass-card p-12 text-center">
          <Bell size={32} className="text-text-3 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">{t('clinical.noAlerts')}</h3>
          <p className="text-text-3 text-sm">{t('clinical.noAlertsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingAlerts.map((alert: Alert) => {
            const cfg = (severityConfig[alert.severidad] ?? severityConfig.leve)!;
            return (
              <div key={alert.id} className={`glass-card p-4 border ${cfg.bg}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium uppercase ${cfg.color}`}>{alert.severidad}</span>
                      {alert.tipo && <span className="text-[10px] bg-surface-3 text-text-3 px-2 py-0.5 rounded">{alert.tipo}</span>}
                    </div>
                    <p className="text-sm text-text">{alert.mensaje}</p>
                    {alert.recomendacion && (
                      <p className="text-xs text-text-3 mt-1 italic">{t('clinical.recommendation')} {alert.recomendacion}</p>
                    )}
                  </div>
                  <button onClick={() => reviewMutation.mutate(alert.id)} className="px-3 py-1.5 text-xs font-medium bg-surface-2 border border-border rounded-lg text-text-3 hover:text-text transition-colors">
                    {t('clinical.review')}
                  </button>
                </div>
              </div>
            );
          })}
          {reviewedAlerts.map((alert) => {
            const cfg = (severityConfig[alert.severidad] ?? severityConfig.leve)!;
            return (
              <div key={alert.id} className="glass-card p-4 opacity-60">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
                  <div className="flex-1">
                    <span className={`text-xs font-medium uppercase ${cfg.color}`}>{alert.severidad}</span>
                    <p className="text-sm text-text">{alert.mensaje}</p>
                  </div>
                  <span className="text-[10px] bg-success-light text-success px-2 py-0.5 rounded">{t('clinical.reviewed')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
