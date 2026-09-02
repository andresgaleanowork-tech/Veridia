import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pill, Clock, CheckCircle, XCircle, Trash2, Edit2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { SupplementFormDialog } from './SupplementFormDialog';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/components/ui/Toast';
import type { Supplement } from '@/lib/schemas';

interface Props {
  patientId: string;
}

type AdherenceEntry = {
  id: string;
  supplementId: string;
  fecha: string;
  tomado: boolean;
};

export function SupplementsPage({ patientId }: Props) {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [adherence, setAdherence] = useState<AdherenceEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date().toISOString().split('T')[0];
    return d ?? '';
  });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: supplements, isLoading } = useQuery({
    queryKey: ['supplements', patientId],
    queryFn: async (): Promise<Supplement[]> => {
      const res = await api.get(`/supplements?paciente_id=${patientId}`);
      return res.data.supplements || res.data.data || res.data || [];
    },
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/supplements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
      addToast('success', 'Suplemento eliminado correctamente');
    },
    onError: () => {
      addToast('error', 'Error al eliminar suplemento');
    },
  });

  const adherenceMutation = useMutation({
    mutationFn: async (entry: AdherenceEntry) => {
      return api.post('/supplements/adherence', entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
    },
  });

  const handleEdit = (supplement: Supplement) => {
    setEditingSupplement(supplement);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingSupplement(null);
  };

  const typeBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
    supplement: 'primary',
    medication: 'warning',
    vitamin: 'success',
    mineral: 'info',
  };

  const adherenceForDate = useMemo(() => {
    return adherence.filter((a) => a.fecha === selectedDate);
  }, [adherence, selectedDate]);

  const toggleAdherence = (supplementId: string, date: string) => {
    const existing = adherence.find((a) => a.supplementId === supplementId && a.fecha === date);
    if (existing) {
      const updated = adherence.map((a) =>
        a.id === existing.id ? { ...a, tomado: !a.tomado } : a
      );
      setAdherence(updated);
      adherenceMutation.mutate({ ...existing, tomado: !existing.tomado });
    } else {
      const newEntry: AdherenceEntry = {
        // eslint-disable-next-line react/purity -- id local generado en handler de evento, no en render
        id: `local_${Date.now()}`,
        supplementId,
        fecha: date,
        tomado: true,
      };
      setAdherence([...adherence, newEntry]);
      adherenceMutation.mutate(newEntry);
    }
  };

  const activeSupplements = supplements?.filter((s) => s.activo) || [];
  const inactiveSupplements = supplements?.filter((s) => !s.activo) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">{t('supplements.title')}</h2>
          <p className="text-sm text-text-3">{t('supplements.subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} icon={<Plus size={14} />}>
          {t('supplements.add')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton variant="text" className="h-5 w-32 mb-3" />
              <Skeleton variant="text" className="h-4 w-48 mb-2" />
              <Skeleton variant="text" className="h-4 w-24" />
            </Card>
          ))}
        </div>
      ) : supplements?.length ? (
        <div className="space-y-6">
          {activeSupplements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-2 mb-3 uppercase tracking-wide">Activos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSupplements.map((supplement) => (
                  <Card key={supplement.id} className="p-5 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Pill size={16} className="text-primary" />
                        <h4 className="text-sm font-semibold text-text">{supplement.nombre}</h4>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(supplement)} icon={<Edit2 size={14} />} />
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(supplement.id)} icon={<Trash2 size={14} />} className="text-danger hover:text-danger" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={typeBadgeVariant[supplement.tipo] || 'primary'} size="sm">
                          {t(`supplement.types.${supplement.tipo}`)}
                        </Badge>
                        <span className="text-xs text-text-3">{supplement.dosis}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-3">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {supplement.frecuencia}
                        </span>
                        <span>Vía: {supplement.via}</span>
                      </div>
                      {supplement.horarios?.length > 0 && (
                        <div className="text-xs text-text-3">
                          Horarios: {supplement.horarios.join(', ')}
                        </div>
                      )}
                      <div className="text-xs text-text-3">
                        {supplement.fecha_inicio} {supplement.fecha_fin ? `-> ${supplement.fecha_fin}` : ''}
                      </div>
                      {supplement.motivo && (
                        <p className="text-xs text-text-3 bg-surface-2 rounded px-2 py-1">
                          <span className="font-medium">Motivo:</span> {supplement.motivo}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {inactiveSupplements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-2 mb-3 uppercase tracking-wide">Inactivos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactiveSupplements.map((supplement) => (
                  <Card key={supplement.id} className="p-5 opacity-70">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Pill size={16} className="text-text-3" />
                        <h4 className="text-sm font-semibold text-text">{supplement.nombre}</h4>
                        <Badge variant="secondary" size="sm">{t('supplements.inactive')}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(supplement)} icon={<Edit2 size={14} />} />
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(supplement.id)} icon={<Trash2 size={14} />} className="text-danger hover:text-danger" />
                      </div>
                    </div>
                    <div className="text-xs text-text-3">
                      {supplement.dosis} - {supplement.frecuencia}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Pill size={32} className="text-text-3 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-text mb-1">{t('supplements.title')}</h3>
          <p className="text-text-3 text-sm">No hay suplementos registrados.</p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text mb-4 uppercase tracking-wide">{t('supplements.adherence')}</h3>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-text-3">Fecha:</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
        {activeSupplements.length > 0 ? (
          <div className="space-y-2">
            {activeSupplements.map((supplement) => {
              const adherenceEntry = adherenceForDate.find((a) => a.supplementId === supplement.id);
              const isTaken = adherenceEntry?.tomado || false;
              return (
                <div
                  key={supplement.id}
                  className="flex items-center justify-between bg-surface-2 rounded-lg p-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Pill size={16} className="text-primary" />
                    <div>
                      <div className="text-sm font-medium text-text">{supplement.nombre}</div>
                      <div className="text-xs text-text-3">{supplement.dosis} - {supplement.frecuencia}</div>
                    </div>
                  </div>
                  <Button
                    variant={isTaken ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => toggleAdherence(supplement.id, selectedDate)}
                    icon={isTaken ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  >
                    {isTaken ? 'Tomado' : t('supplements.markTaken')}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-3 text-sm">Agrega suplementos activos para registrar adherencia.</p>
        )}
      </Card>

      {showForm && (
        <SupplementFormDialog
          open={showForm}
          onClose={handleClose}
          initialData={editingSupplement}
        />
      )}
    </div>
  );
}
