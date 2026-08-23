import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, TrendingUp, Award, Droplets, Flame, Search } from 'lucide-react';
import api from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import type { FoodJournalEntry, JournalStats, Patient } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { JournalForm } from '@/features/portal/JournalForm';
import { JournalHistory } from '@/features/portal/JournalHistory';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

interface PatientSearchListProps {
  query: string;
  onSelect: (patient: Patient) => void;
}

function PatientSearchList({ query, onSelect }: PatientSearchListProps) {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const { data, isLoading } = useQuery({
    queryKey: ['patient-search', query],
    queryFn: async (): Promise<Patient[]> => {
      return await api.getUnwrapped<Patient[]>('/patients', { params: { search: query, limit: 20 } }) ?? [];
    },
    enabled: query.length >= 2,
  });

  if (isLoading) {
    return <Skeleton variant="text" className="h-4 w-full" />;
  }
  if (!data?.length) {
    return <p className="text-xs text-text-3 text-center py-4">{t('common.noResults')}</p>;
  }
  return (
    <div className="space-y-1">
      {data.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p)}
          className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="font-medium text-text">{p.nombre} {p.apellidos}</div>
          {p.email && <div className="text-xs text-text-3">{p.email}</div>}
        </button>
      ))}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function JournalPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [patientSearch, setPatientSearch] = useState('');
  const debouncedPatientSearch = useDebounce(patientSearch, 300);
  const effectivePatientId = patientId || '';

  const { data: journals, isLoading: journalsLoading, refetch } = useQuery({
    queryKey: ['patient-journal', effectivePatientId],
    queryFn: async (): Promise<FoodJournalEntry[]> => {
      if (!effectivePatientId) return [];
      return await api.getUnwrapped<FoodJournalEntry[]>('/patient-journal', { params: { patient_id: effectivePatientId, limit: 200 } }) ?? [];
    },
    enabled: !!effectivePatientId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryFn: async (): Promise<JournalStats> => {
      return await api.getUnwrapped<JournalStats>(`/patient-journal/stats/${effectivePatientId}`);
    },
    queryKey: ['patient-journal', 'stats', effectivePatientId],
    enabled: !!effectivePatientId,
  });

  const selectedEntry = journals?.find((j) => j.date === selectedDate);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleEntrySelect = (entry: FoodJournalEntry) => {
    setSelectedDate(entry.date);
  };

  const handleSuccess = () => {
    refetch();
  };

  if (!effectivePatientId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('journal.title')}</h1>
          <p className="text-text-3 text-sm mt-1">{t('journal.subtitle')}</p>
        </div>
        <Card>
          <CardHeader title={t('common.search')} description="Selecciona un paciente" />
          <div className="px-6 pb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
               <input
                 type="text"
                 placeholder="Buscar paciente..."
                 value={patientSearch}
                 onChange={(e) => setPatientSearch(e.target.value)}
                 className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
               />
            </div>
            {!debouncedPatientSearch ? (
              <p className="text-xs text-text-3 mt-3 text-center py-4">Escribe para buscar pacientes</p>
            ) : (
              <PatientSearchList
                query={debouncedPatientSearch}
                onSelect={(p) => navigate(`/nutrition/journal/${p.id}`)}
              />
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('journal.title')}</h1>
          <p className="text-text-3 text-sm mt-1">{t('journal.subtitle')}</p>
        </div>
        <Button variant="ghost" size="sm" icon={<Users size={16} />} onClick={() => navigate('/patients')}>
          {t('common.viewAll')}
        </Button>
      </div>

      {/* Stats summary */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton variant="text" className="h-8 w-16 mb-2" /><Skeleton variant="text" className="h-4 w-24" /></Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <Award size={20} className="mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold text-primary">{stats.streak}</div>
            <div className="text-xs text-text-3">{t('journal.streak')} {t('journal.days')}</div>
          </Card>
          <Card className="p-4 text-center">
            <Calendar size={20} className="mx-auto text-info mb-1" />
            <div className="text-2xl font-bold text-text">{stats.totalEntries}</div>
            <div className="text-xs text-text-3">{t('journal.daysWithEntries')}</div>
          </Card>
          <Card className="p-4 text-center">
            <Droplets size={20} className="mx-auto text-blue-400 mb-1" />
            <div className="text-lg font-bold text-text">{stats.averages.waterIntakeMl} ml</div>
            <div className="text-xs text-text-3">{t('journal.avgWater')}</div>
          </Card>
          <Card className="p-4 text-center">
            <Flame size={20} className="mx-auto text-warning mb-1" />
            <div className="text-lg font-bold text-text">{stats.averages.calories}</div>
            <div className="text-xs text-text-3">{t('journal.avgCalories')}</div>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp size={20} className="mx-auto text-accent mb-1" />
            <div className="text-lg font-bold text-text">{stats.completionRate}%</div>
            <div className="text-xs text-text-3">{t('journal.completionRate')}</div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journal Form (selected date) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader
              title={selectedEntry ? t('journal.editJournal') : t('journal.addNew')}
              description={selectedDate}
            />
            <div className="px-6 pb-6">
              {journalsLoading ? (
                <Skeleton variant="text" className="h-4 w-full" />
              ) : (
                <JournalForm
                  patientId={effectivePatientId}
                  initialData={selectedEntry}
                  onSuccess={handleSuccess}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Journal History */}
        <div className="lg:col-span-2">
          <JournalHistory
            patientId={effectivePatientId}
            onDateSelect={handleDateSelect}
            onEntrySelect={handleEntrySelect}
          />
        </div>
      </div>
    </div>
  );
}
