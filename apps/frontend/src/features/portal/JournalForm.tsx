import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Search, Plus, X, Trash2, Save, Upload, ChevronDown, ChevronUp, Droplets } from 'lucide-react';
import api from '@/lib/api';
import type { FoodJournalEntry, FoodItem, MealEntry, ExerciseEntry, Mood } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

type RawNutriments = Record<string, unknown>;

interface FormFoodItem extends FoodItem {
  _source?: RawNutriments;
}

interface JournalFormProps {
  patientId: string;
  initialData?: Partial<FoodJournalEntry>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MEAL_TYPES: { value: MealEntry['type']; labelKey: string; icon: string }[] = [
  { value: 'breakfast', labelKey: 'journal.breakfast', icon: '🌅' },
  { value: 'lunch', labelKey: 'journal.lunch', icon: '☀️' },
  { value: 'dinner', labelKey: 'journal.dinner', icon: '🌙' },
  { value: 'snack', labelKey: 'journal.snack', icon: '🍎' },
];

const COMMON_SYMPTOMS = [
  'Náuseas', 'Dolor de estómago', 'Gases', 'Hinchazón', 'Cansancio',
  'Dolor de cabeza', 'Piel seca', 'Picazón', 'Sinusitis', 'Estreñimiento',
];

const EXERCISE_TYPES = ['Caminata', 'Correr', 'Ciclismo', 'Entrenamiento', 'Yoga', 'Natación', 'Otros'];

const MOODS: { value: Mood; labelKey: string; icon: string }[] = [
  { value: 'great', labelKey: 'journal.moodGreat', icon: '😄' },
  { value: 'good', labelKey: 'journal.moodGood', icon: '🙂' },
  { value: 'neutral', labelKey: 'journal.moodNeutral', icon: '😐' },
  { value: 'bad', labelKey: 'journal.moodBad', icon: '😞' },
  { value: 'terrible', labelKey: 'journal.moodTerrible', icon: '😣' },
];

const INTENSITY_OPTIONS = ['Baja', 'Moderada', 'Alta'];

const inputCls = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all';
const labelCls = 'block text-xs font-medium text-text-3 mb-1.5';

function extractMacros(n: RawNutriments): { calories: number; protein: number; fat: number; carbs: number; fiber: number } {
  const num = (k: string): number => {
    const v = n[k];
    return typeof v === 'number' ? v : parseFloat(String(v || 0)) || 0;
  };
  const kcal = num('energy-kcal') || ((num('energy') || 0) / 4.184);
  return {
    calories: Math.round(kcal),
    protein: Math.round((num('protein') || num('proteins') || 0) * 10) / 10,
    fat: Math.round((num('fat') || num('lipid')) * 10) / 10,
    carbs: Math.round((num('carbs') || num('carbohydrates') || num('carbohydrotes')) * 10) / 10,
    fiber: Math.round((num('fiber') || num('fiberglass')) * 10) / 10,
  };
}

function parseGrams(portion: string): number {
  const match = portion?.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1] || '0') : 100;
}

function scaleMacros(base: ReturnType<typeof extractMacros>, grams: number): Record<string, number> {
  const scale = grams / 100;
  return {
    protein: Math.round(base.protein * scale * 10) / 10,
    fat: Math.round(base.fat * scale * 10) / 10,
    carbs: Math.round(base.carbs * scale * 10) / 10,
    fiber: Math.round(base.fiber * scale * 10) / 10,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function JournalForm({ patientId, initialData, onSuccess, onCancel }: JournalFormProps) {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [date, setDate] = useState(() => initialData?.date || new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<MealEntry[]>(() => initialData?.meals || [
    { type: 'breakfast', foods: [], time: '' },
    { type: 'lunch', foods: [], time: '' },
    { type: 'dinner', foods: [], time: '' },
    { type: 'snack', foods: [], time: '' },
  ]);
  const [symptoms, setSymptoms] = useState<string[]>(() => initialData?.symptoms || []);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [exercise, setExercise] = useState<ExerciseEntry[]>(() => initialData?.exercise || []);
  const [waterIntake, setWaterIntake] = useState(() => initialData?.water_intake || 0);
  const [mood, setMood] = useState<Mood | undefined>(() => initialData?.mood || undefined);
  const [notes, setNotes] = useState(() => initialData?.notes || '');
  const [photos, setPhotos] = useState<string[]>(() => initialData?.photo_urls || []);

  const [openMeal, setOpenMeal] = useState<MealEntry['type'] | null>(null);
  const [foodSearch, setFoodSearch] = useState('');
  const [activeMealType, setActiveMealType] = useState<MealEntry['type'] | null>(null);

  const debouncedSearch = useDebounce(foodSearch, 400);

  const { data: foodResults, isLoading: isSearching } = useQuery({
    queryKey: ['food-search', debouncedSearch, locale],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const res = await api.get('/foods/off/search', { params: { q: debouncedSearch } });
      return res.data.products || [];
    },
    enabled: debouncedSearch.length >= 2,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { isUpdate: boolean }) => {
      const body = {
        patient_id: patientId,
        date,
        meals: meals.map((m) => ({
          type: m.type,
          foods: m.foods.map((f) => {
            const { _source, ...rest } = f as FormFoodItem;
            void _source;
            return rest;
          }),
          time: m.time || undefined,
        })),
        symptoms,
        exercise,
        water_intake: waterIntake,
        mood,
        notes: notes || undefined,
        photo_urls: photos,
      };
      if (payload.isUpdate && initialData?.id) {
        return api.put(`/patient-journal/${initialData.id}`, body);
      }
      return api.post('/patient-journal', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-journal'] });
      addToast('success', t('journal.saved'), t('journal.save'));
      onSuccess?.();
    },
    onError: (err: Error) => {
      addToast('error', t('common.error'), err.message);
    },
  });

  const handleFoodSelect = (food: RawNutriments) => {
    if (!activeMealType) return;
    const name = (food.product_name || food.product_name_es || food.brands || 'Alimento') as string;
    const nutriments = (food.nutriments || {}) as RawNutriments;
    const macros = extractMacros(nutriments);
    const newItem: FormFoodItem = {
      name,
      portion: '100',
      calories: macros.calories,
      macros: scaleMacros(macros, 100),
      _source: nutriments,
    };
    setMeals((prev) => prev.map((m) =>
      m.type === activeMealType ? { ...m, foods: [...m.foods, newItem] } : m
    ));
    setFoodSearch('');
  };

  const handlePortionChange = (mealType: MealEntry['type'], idx: number, portion: string) => {
    setMeals((prev) => prev.map((m) => {
      if (m.type !== mealType) return m;
      const newFoods = [...m.foods];
      const item = newFoods[idx] as FormFoodItem | undefined;
      if (!item) return m;
      const grams = parseGrams(portion);
      if (item?._source) {
        const base = extractMacros(item._source);
        newFoods[idx] = { ...item, portion, calories: Math.round(base.calories * grams / 100), macros: scaleMacros(base, grams) };
      } else {
        newFoods[idx] = { ...item, portion };
      }
      return { ...m, foods: newFoods };
    }));
  };

  const removeFood = (mealType: MealEntry['type'], idx: number) => {
    setMeals((prev) => prev.map((m) =>
      m.type === mealType ? { ...m, foods: m.foods.filter((_, i) => i !== idx) } : m
    ));
  };

  const removeExercise = (idx: number) => {
    setExercise((prev) => prev.filter((_, i) => i !== idx));
  };

  const addExercise = () => {
    setExercise((prev) => [...prev, { type: 'Caminata', duration: 30, intensity: 'Moderada' }]);
  };

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addOtherSymptom = () => {
    const trimmed = otherSymptom.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms((prev) => [...prev, trimmed]);
    }
    setOtherSymptom('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setPhotos((prev) => [...prev, url]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalCalories = meals.reduce((sum, m) =>
    sum + m.foods.reduce((s, f) => s + (f.calories || 0), 0), 0);

  const handleSubmit = () => {
    if (!date) {
      addToast('error', t('common.error'), 'Seleccione una fecha');
      return;
    }
    saveMutation.mutate({ isUpdate: !!initialData?.id });
  };

  return (
    <div className="space-y-5">
      {/* Date selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-text-3" />
          <label className={labelCls}>{t('journal.date')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm focus:outline-none focus:border-primary"
          />
        </div>
        {totalCalories > 0 && (
          <div className="text-right">
            <span className="text-xs text-text-3">Kcal totales</span>
            <div className="text-lg font-bold text-primary">{totalCalories}</div>
          </div>
        )}
      </div>

      {/* Meals */}
      <div className="space-y-3">
        {meals.map((meal) => {
          const config = (MEAL_TYPES.find((m) => m.value === meal.type) || MEAL_TYPES[0])!;
          const isOpen = openMeal === meal.type;
          const totalMealCals = meal.foods.reduce((sum, f) => sum + (f.calories || 0), 0);

          return (
            <Card key={meal.type} className="border-white/5">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => {
                  setOpenMeal(isOpen ? null : meal.type);
                  if (!isOpen) { setActiveMealType(meal.type); setFoodSearch(''); }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{config.icon}</span>
                  <span className="font-medium text-text">{t(config.labelKey)}</span>
                  {meal.foods.length > 0 && (
                    <span className="text-xs text-text-3 bg-surface-2 px-2 py-0.5 rounded-full">
                      {meal.foods.length} alimento{meal.foods.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {totalMealCals > 0 && <span className="text-xs font-medium text-primary">{totalMealCals} kcal</span>}
                  {isOpen ? <ChevronUp size={16} className="text-text-3" /> : <ChevronDown size={16} className="text-text-3" />}
                </div>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-white/5 space-y-3">
                  {/* Time */}
                  <div className="flex items-center gap-3">
                    <label className={labelCls}>{t('common.time')}</label>
                    <input
                      type="time"
                      value={meal.time || ''}
                      onChange={(e) => setMeals((prev) => prev.map((m) => m.type === meal.type ? { ...m, time: e.target.value } : m))}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-1.5 text-text text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Food search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                    <input
                      type="text"
                      placeholder={t('journal.searchFoods')}
                      value={foodSearch}
                      onChange={(e) => { setFoodSearch(e.target.value); setActiveMealType(meal.type); }}
                      className="w-full pl-10 pr-3 py-2 bg-surface-2 border border-border rounded-xl text-text text-sm placeholder:text-text-3 focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Search results */}
                  {debouncedSearch.length >= 2 && (
                    <div className="max-h-48 overflow-y-auto border border-border rounded-xl bg-surface-2">
                      {isSearching ? (
                        <div className="p-2 space-y-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} variant="text" className="h-4 w-full" />
                          ))}
                        </div>
                      ) : !foodResults?.length ? (
                        <p className="p-3 text-xs text-text-3 text-center">{t('journal.noResults')}</p>
                      ) : (
                        foodResults.map((f: RawNutriments, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleFoodSelect(f)}
                            className="w-full text-left p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="font-medium text-sm text-text">
                              {String(f.product_name || f.product_name_es || f.brands || 'Alimento')}
                            </div>
                            {Boolean(f.nutriments) && (
                              <div className="text-xs text-text-3 mt-0.5">
                                {Number((f.nutriments as RawNutriments)['energy-kcal'] || 0)} kcal / 100g
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected foods */}
                  {meal.foods.length > 0 ? (
                    <div className="space-y-2">
                      {meal.foods.map((food, fi) => (
                        <div key={fi} className="flex items-end gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={food.name}
                              onChange={(e) => setMeals((prev) => prev.map((m) =>
                                m.type === meal.type
                                  ? { ...m, foods: m.foods.map((f, i) => i === fi ? { ...f, name: e.target.value } : f) }
                                    : m
                              ))}
                              className={inputCls}
                              placeholder={t('journal.foodName')}
                            />
                          </div>
                          <div className="w-20">
                            <input
                              type="number"
                              min="0"
                              value={food.portion}
                              onChange={(e) => handlePortionChange(meal.type, fi, e.target.value)}
                              className={inputCls}
                              placeholder="g"
                            />
                          </div>
                          {food.calories && (
                            <div className="w-16 text-right">
                              <span className="text-xs text-text-3">kcal</span>
                              <div className="font-medium text-primary">{food.calories}</div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFood(meal.type, fi)}
                            className="p-1.5 text-text-3 hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-3 text-center py-4">{t('journal.addFood')}</p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Symptoms */}
      <Card>
        <CardHeader title={t('journal.symptoms')} />
        <div className="px-6 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSymptom(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  symptoms.includes(s)
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-surface-2 text-text-3 border border-border hover:bg-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={otherSymptom}
              onChange={(e) => setOtherSymptom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOtherSymptom()}
              placeholder="Otro síntoma..."
              className={inputCls}
            />
            <Button size="sm" variant="ghost" onClick={addOtherSymptom} disabled={!otherSymptom.trim()}>
              Añadir
            </Button>
          </div>
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {symptoms.map((s) => (
                <span key={s} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {s}
                  <button
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className="ml-1.5 hover:text-danger"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Exercise */}
      <Card>
        <CardHeader
          title={t('journal.exercise')}
          action={
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={addExercise}>
              Añadir
            </Button>
          }
        />
        <div className="px-6 pb-4 space-y-3">
          {exercise.length === 0 ? (
            <p className="text-xs text-text-3 text-center py-4">{t('journal.addNew')}</p>
          ) : (
            exercise.map((ex, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="w-40">
                  <label className={labelCls}>{t('journal.exerciseType')}</label>
                  <select
                    value={ex.type}
                    onChange={(e) => setExercise((prev) => prev.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))}
                    className={inputCls}
                  >
                    {EXERCISE_TYPES.map((et) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className={labelCls}>{t('journal.duration')}</label>
                  <input
                    type="number"
                    min="0"
                    value={ex.duration || ''}
                    onChange={(e) => setExercise((prev) => prev.map((x, i) => i === idx ? { ...x, duration: parseInt(e.target.value) || 0 } : x))}
                    className={inputCls}
                    placeholder="min"
                  />
                </div>
                <div className="w-32">
                  <label className={labelCls}>{t('journal.intensity')}</label>
                  <select
                    value={ex.intensity || ''}
                    onChange={(e) => setExercise((prev) => prev.map((x, i) => i === idx ? { ...x, intensity: e.target.value } : x))}
                    className={inputCls}
                  >
                    <option value="">Seleccionar</option>
                    {INTENSITY_OPTIONS.map((int) => (
                      <option key={int} value={int}>{int}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(idx)}
                  className="pb-5 p-1.5 text-text-3 hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Water + Mood */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title={t('journal.water')} />
          <div className="px-6 pb-4 flex items-center gap-3">
            <Droplets size={20} className="text-primary" />
            <button
              type="button"
              onClick={() => setWaterIntake(Math.max(0, waterIntake - 100))}
              className="px-3 py-1.5 border border-border rounded-lg text-text hover:bg-white/5 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              min="0"
              value={waterIntake}
              onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
              className="w-20 text-center bg-surface-2 border border-border rounded-xl py-1.5 text-text focus:outline-none focus:border-primary"
            />
            <span className="text-xs text-text-3">ml</span>
            <button
              type="button"
              onClick={() => setWaterIntake(waterIntake + 100)}
              className="px-3 py-1.5 border border-border rounded-lg text-text hover:bg-white/5 transition-colors"
            >
              +
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('journal.mood')} />
          <div className="px-6 pb-4 flex justify-around">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`flex flex-col items-center gap-1 transition-all ${
                  mood === m.value
                    ? 'scale-125'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                <span className="text-3xl">{m.icon}</span>
                <span className="text-xs text-text-3">{t(m.labelKey)}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader title={t('journal.notes')} />
        <div className="px-6 pb-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('journal.notes')}
            rows={3}
            className={inputCls}
          />
        </div>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader title={t('journal.photos')} />
        <div className="px-6 pb-4">
          <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all">
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            <Upload size={20} className="text-text-3" />
            <span className="text-sm text-text-2">{t('journal.addNew')}</span>
          </label>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {photos.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-0.5 bg-danger/80 rounded-full text-white hover:bg-danger transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {t('journal.cancel')}
          </Button>
        )}
        <Button
          className="flex-1"
          icon={<Save size={16} />}
          loading={saveMutation.isPending}
          onClick={handleSubmit}
        >
          {saveMutation.isPending ? t('journal.saving') : t('journal.save')}
        </Button>
      </div>
    </div>
  );
}
