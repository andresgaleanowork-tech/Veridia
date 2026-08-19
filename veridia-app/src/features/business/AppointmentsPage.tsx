import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import type { Appointment, Provider } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { AppointmentFormDialog } from './AppointmentFormDialog';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

type ViewMode = 'day' | 'week' | 'month';

export function AppointmentsPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [view, setView] = useState<ViewMode>('week');
  const [date, setDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [providerFilter, setProviderFilter] = useState<string>('');

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: async (): Promise<Provider[]> => {
      const res = await api.get('/providers');
      return res.data || [];
    },
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', view, date.toISOString(), providerFilter],
    queryFn: async (): Promise<Appointment[]> => {
      const start = getWeekStart(date);
      const end = getWeekEnd(date);
      const res = await api.get(`/appointments?fecha_desde=${start}&fecha_hasta=${end}${providerFilter ? `&provider_id=${providerFilter}` : ''}`);
      return res.data.appointments || res.data.data || res.data || [];
    },
  });

  const navigate = (dir: -1 | 1) => {
    const d = new Date(date);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setDate(d);
  };

  const days = getWeekDays(date);

  const getApptColor = (appt: Appointment): string => {
    if (appt.color) return appt.color;
    const provider = providers?.find((p: Provider) => p.id === appt.provider_id);
    return provider?.colorCalendar || '#0891B2';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('appointments.title')}</h1>
          <p className="text-text-3 text-sm mt-1">{t('appointments.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          {t('appointments.newAppointment')}
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} className="text-text-3" />} onClick={() => navigate(-1)} />
          <h2 className="text-sm font-semibold text-text min-w-[180px] text-center">
            {formatWeekHeader(date)}
          </h2>
          <Button variant="ghost" size="sm" icon={<ChevronRight size={16} className="text-text-3" />} onClick={() => navigate(1)} />
          <Button variant="secondary" size="sm" className="ml-2 text-xs" onClick={() => setDate(new Date())}>
            {t('appointments.today')}
          </Button>
        </div>
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border">
          {(['day', 'week', 'month'] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? 'primary' : 'ghost'}
              onClick={() => setView(v)}
              className={
                view === v
                  ? ''
                  : 'text-text-3 hover:text-text hover:bg-surface-3 border border-transparent'
              }
            >
              {v === 'day' ? t('appointments.day') : v === 'week' ? t('appointments.week') : t('appointments.month')}
            </Button>
          ))}
        </div>
      </div>

      {/* Provider filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-2">Filtrar por profesional:</label>
        <Select
          placeholder="Todos"
          options={[
            { value: '', label: 'Todos' },
            ...(providers?.map((p: Provider) => ({ value: p.id, label: `${p.nombre} ${p.apellidos}`.trim() })) || []),
          ]}
          value={providerFilter}
          onValueChange={setProviderFilter}
          searchable
          className="min-w-[220px]"
        />
        {providerFilter && (
          <button onClick={() => setProviderFilter('')} className="text-xs text-text-3 hover:text-text">Limpiar</button>
        )}
      </div>

      {/* Week View */}
      {isLoading ? (
        <div className="overflow-x-auto rounded-xl scrollbar-thin">
          <div className="grid grid-cols-7 gap-2 min-w-[720px]">
            {days.map((day) => (
              <Card key={day.toISOString()} className="min-h-[120px] p-1">
                <div className="px-2 py-1.5 border-b border-border">
                  <Skeleton variant="text" className="h-3 w-10" />
                  <Skeleton variant="text" className="h-5 w-6 mt-1" />
                </div>
                <div className="p-1 space-y-1">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} variant="rect" className="h-10 w-full" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl scrollbar-thin">
          <div className="grid grid-cols-7 gap-2 min-w-[720px]">
            {days.map((day) => {
              const dayAppts = (appointments || []).filter((a) => a.fecha === formatDate(day));
              const isToday = formatDate(day) === formatDate(new Date());
              return (
                <Card
                  key={day.toISOString()}
                  className={`min-h-[120px] ${isToday ? 'border-primary/30' : ''}`}
                >
                  <div className={`px-2 py-1.5 border-b border-border ${isToday ? 'bg-primary/10' : ''}`}>
                    <div className="text-[10px] text-text-3 uppercase">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                  <div className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-text'}`}>{day.getDate()}</div>
                </div>
                <div className="p-1 space-y-1">
                  {dayAppts.map((a) => {
                    const provider = providers?.find((p: Provider) => p.id === a.provider_id);
                    const initials = provider?.nombre && provider.apellidos
                      ? `${provider.nombre[0]}${provider.apellidos[0]}`
                      : (a.paciente_nombre?.[0] || '');
                    return (
                      <div key={a.id} className="px-2 py-1.5 rounded-md text-xs" style={{ borderLeftColor: getApptColor(a), borderLeftWidth: '3px', backgroundColor: getApptColor(a) + '15' }}>
                        <div className="flex items-center gap-1.5">
                          {provider && <Avatar fallback={initials} size="sm" className="h-5 w-5 text-[10px]" />}
                          <div className="font-medium text-text">{a.hora}</div>
                        </div>
                        <div className="text-text-3 truncate">{a.paciente_nombre || t('appointments.patient')}</div>
                        <div className="mt-1">
                          <Badge variant="info" size="sm" dot>{a.tipo || t('appointments.appointment')}</Badge>
                        </div>
                      </div>
                    );
                  })}
                   {dayAppts.length === 0 && (
                      <div className="text-[10px] text-text-3 text-center py-2">{t('appointments.noAppointments')}</div>
                    )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <AppointmentFormDialog open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return formatDate(d);
}

function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
  return formatDate(d);
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  const iso = d.toISOString();
  const parts = iso.split('T');
  return parts[0] ?? '';
}

function formatWeekHeader(date: Date): string {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${e.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
