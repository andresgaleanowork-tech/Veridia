import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, BarChart3, Droplets, Flame, Footprints, List, Calendar } from 'lucide-react';
import api from '@/lib/api';
import type { FoodJournalEntry } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

type ViewMode = 'calendar' | 'list';
type MoodValue = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

interface JournalHistoryProps {
  patientId: string;
  onDateSelect?: (date: string) => void;
  onEntrySelect?: (entry: FoodJournalEntry) => void;
}

const MOOD_EMOJI: Record<MoodValue, string> = {
  great: '😄', good: '🙂', neutral: '😐', bad: '😞', terrible: '😣',
};

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Jue', 'Vie', 'Sá', 'Dó'];

// eslint-disable-next-line react-refresh/only-export-components
export function JournalHistory({ patientId, onDateSelect, onEntrySelect }: JournalHistoryProps) {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const formatDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startDay = startOfMonth.getDay();
  const adjustedStart = ((startDay + 6) % 7);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - adjustedStart);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), daysInMonth);

  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const calendarDays = [];
  for (let week = 0; week < Math.ceil(days.length / 7); week++) {
    calendarDays.push(days.slice(week * 7, week * 7 + 7));
  }

  const { data: entries, isLoading } = useQuery({
    queryKey: ['patient-journal', patientId, dateFrom, dateTo],
    queryFn: async (): Promise<FoodJournalEntry[]> => {
      const res = await api.get('/patient-journal', {
        params: { patient_id: patientId, fecha_desde: dateFrom, fecha_hasta: dateTo, limit: 100 },
      });
      return res.data || [];
    },
    enabled: !!patientId,
  });

  const entryDates = new Set((entries || []).map((e) => e.date));

  const todayKey = formatDateKey(new Date());

  const navigateMonth = (dir: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + dir);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => setCurrentMonth(new Date());

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const totalCalories = (entries || []).reduce((sum, e) => {
    return sum + (e.meals || []).reduce((ms, m) =>
      ms + (m.foods || []).reduce((fs, f) => fs + (f.calories || 0), 0), 0);
  }, 0);

  const totalWater = (entries || []).reduce((sum, e) => sum + (e.water_intake || 0), 0);
  const totalExercise = (entries || []).reduce((sum, e) =>
    sum + (e.exercise || []).reduce((exs, ex) => exs + (ex.duration || 0), 0), 0);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
            icon={<Calendar size={14} />}
            onClick={() => setViewMode('calendar')}
          >
            {t('journal.daysWithEntries')}
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            icon={<List size={14} />}
            onClick={() => setViewMode('list')}
          >
            {t('common.list')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<Filter size={14} />} onClick={() => setShowFilters(!showFilters)}>
            {t('journal.filterByDate')}
          </Button>
          <Button size="sm" variant="ghost" onClick={goToToday}>
            {t('journal.today')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-3 mb-1">{t('journal.fromDate')}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-3 mb-1">{t('journal.toDate')}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <Button size="sm" variant="ghost" onClick={resetFilters} className="w-full">
                  {t('journal.resetFilters')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary stats */}
      {entries && entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <Flame size={20} className="mx-auto text-primary mb-1" />
            <div className="text-lg font-bold text-text">{totalCalories}</div>
            <div className="text-xs text-text-3">{t('journal.avgCalories')}</div>
          </Card>
          <Card className="p-4 text-center">
            <Droplets size={20} className="mx-auto text-blue-400 mb-1" />
            <div className="text-lg font-bold text-text">{totalWater} ml</div>
            <div className="text-xs text-text-3">{t('journal.water')}</div>
          </Card>
          <Card className="p-4 text-center">
            <Footprints size={20} className="mx-auto text-accent mb-1" />
            <div className="text-lg font-bold text-text">{Math.round(totalExercise)}</div>
            <div className="text-xs text-text-3">min ejercicio</div>
          </Card>
          <Card className="p-4 text-center">
            <BarChart3 size={20} className="mx-auto text-warning mb-1" />
            <div className="text-lg font-bold text-text">{entries.length}</div>
            <div className="text-xs text-text-3">registros</div>
          </Card>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button size="sm" variant="ghost" icon={<ChevronLeft size={14} />} onClick={() => navigateMonth(-1)}>
                <span className="sr-only">Mes anterior</span>
              </Button>
              <h3 className="text-lg font-semibold text-text">
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <Button size="sm" variant="ghost" icon={<ChevronRight size={14} />} onClick={() => navigateMonth(1)}>
                <span className="sr-only">Mes siguiente</span>
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs text-text-3 mb-2">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center font-medium">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((week, wi) =>
                week.map((day, di) => {
                  const dateKey = formatDateKey(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = dateKey === todayKey;
                  const hasEntry = entryDates.has(dateKey);
                  const dayEntries = (entries || []).filter((e) => e.date === dateKey);

                  return (
                    <button
                      key={`${wi}-${di}`}
                      type="button"
                      onClick={() => {
                        onDateSelect?.(dateKey);
                      }}
                      disabled={!isCurrentMonth}
                      className={`relative h-16 p-1 text-left transition-all ${
                        !isCurrentMonth
                          ? 'text-text-3/30 cursor-default'
                          : 'hover:bg-white/5'
                      } ${isToday ? 'ring-1 ring-primary' : ''}`}
                    >
                      <span className={`text-xs ${isToday ? 'text-primary font-bold' : 'text-text-3'}`}>
                        {day.getDate()}
                      </span>
                      {hasEntry && (
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          {dayEntries.slice(0, 2).map((entry) => (
                            <div
                              key={entry.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEntrySelect?.(entry);
                              }}
                              className="text-[8px] truncate cursor-pointer hover:underline"
                              title={entry.date}
                            >
                              <div className="flex items-center gap-0.5">
                                {entry.mood && <span>{MOOD_EMOJI[entry.mood as MoodValue] || '😐'}</span>}
                                {dayEntries.length > 0 && <span className="text-primary">●</span>}
                              </div>
                            </div>
                          ))}
                          {dayEntries.length > 2 && (
                            <span className="text-[8px] text-text-3">+{dayEntries.length - 2}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader title={t('journal.title')} description={t('journal.subtitle')} />
          <div className="px-6 pb-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border-b border-border pb-3">
                    <Skeleton variant="text" className="h-5 w-48 mb-2" />
                    <Skeleton variant="text" className="h-4 w-full mb-1" />
                    <Skeleton variant="text" className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : !entries || entries.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon size={40} className="mx-auto text-text-3/30 mb-3" />
                <p className="text-text-3">{t('journal.noJournalDesc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(entries || []).map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => onEntrySelect?.(entry)}
                    className="border-b border-border pb-3 last:border-0 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarIcon size={16} className="text-text-3" />
                        <span className="font-medium text-text">{entry.date}</span>
                        {entry.mood && <span className="text-lg">{MOOD_EMOJI[entry.mood as MoodValue]}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-3">
                        {entry.water_intake > 0 && (
                          <span className="flex items-center gap-1">
                            <Droplets size={12} /> {entry.water_intake}ml
                          </span>
                        )}
                        {Array.isArray(entry.meals) && entry.meals.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame size={12} />
                            {entry.meals.reduce((sum, m) => sum + (m.foods || []).reduce((fs, f) => fs + (f.calories || 0), 0), 0)} kcal
                          </span>
                        )}
                        {Array.isArray(entry.symptoms) && entry.symptoms.length > 0 && (
                          <span>{entry.symptoms.length} síntomas</span>
                        )}
                      </div>
                    </div>
                    {Array.isArray(entry.meals) && entry.meals.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {entry.meals.map((meal) => (
                          <div key={meal.type} className="flex items-center gap-2 text-xs">
                            <span>{MEAL_ICONS[meal.type] || '🍽️'}</span>
                            <span className="text-text-3 capitalize">{meal.type}</span>
                            <span className="text-text-3 truncate">
                              {(meal.foods || []).map((f) => f.name).join(', ') || t('journal.addFood')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
