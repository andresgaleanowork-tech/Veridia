import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { MealSlot, MealItem, DesarrolladaState } from '@/types';
import { FOOD_EQUIVALENCIAS } from '@/features/desarrollada/lib/constants';

interface Step3AdjustmentsProps {
  state: Pick<DesarrolladaState, 'comidas' | 'get' | 'protG' | 'grasasG' | 'hcG' | 'fibraG'>;
  onStateChange: (comidas: MealSlot[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const MOCK_FOODS = [
  { id: '1', n: 'Pollo pechuga', k: 110, p: 22, g: 2.5, h: 0, fi: 0, grupo: 'aves' },
  { id: '2', n: 'Merluza', k: 80, p: 17, g: 1, h: 0, fi: 0, grupo: 'pescBlanco' },
  { id: '3', n: 'Salmón', k: 180, p: 20, g: 10, h: 0, fi: 0, grupo: 'pescAzul' },
  { id: '4', n: 'Arroz integral cocido', k: 130, p: 2.7, g: 0.9, h: 28, fi: 1.8, grupo: 'cereal' },
  { id: '5', n: 'Pan integral', k: 220, p: 9, g: 2, h: 43, fi: 4, grupo: 'cereal' },
  { id: '6', n: 'Avena', k: 380, p: 13, g: 7, h: 66, fi: 10, grupo: 'cereal' },
  { id: '7', n: 'Brócoli', k: 35, p: 2.8, g: 0.4, h: 7, fi: 2.6, grupo: 'verdA' },
  { id: '8', n: 'Espinacas', k: 23, p: 2.9, g: 0.4, h: 3.6, fi: 2.2, grupo: 'verdA' },
  { id: '9', n: 'Manzana', k: 52, p: 0.3, g: 0.2, h: 14, fi: 2.4, grupo: 'frutB' },
  { id: '10', n: 'Yogur natural', k: 60, p: 4, g: 3, h: 5, fi: 0, grupo: 'yogur' },
  { id: '11', n: 'Huevo', k: 75, p: 6.5, g: 5, h: 0.5, fi: 0, grupo: 'huevo' },
  { id: '12', n: 'Lentejas cocidas', k: 115, p: 9, g: 0.4, h: 20, fi: 8, grupo: 'legumbre' },
  { id: '13', n: 'Almendras', k: 600, p: 18, g: 52, h: 22, fi: 12, grupo: 'frutoSeco' },
  { id: '14', n: 'Aceite oliva', k: 900, p: 0, g: 100, h: 0, fi: 0, grupo: 'aceite' },
  { id: '15', n: 'Pasta integral', k: 350, p: 12, g: 2, h: 70, fi: 6, grupo: 'cereal' },
  { id: '16', n: 'Leche semi', k: 95, p: 6.5, g: 3, h: 10, fi: 0, grupo: 'lecheSemi' },
  { id: '17', n: 'Queso fresco', k: 250, p: 18, g: 15, h: 2, fi: 0, grupo: 'queso' },
  { id: '18', n: 'Plátano', k: 90, p: 1.1, g: 0.3, h: 21, fi: 2.6, grupo: 'frutB' },
];

export function Step3Adjustments({ state, onStateChange, onBack, onNext }: Step3AdjustmentsProps) {
  const [search, setSearch] = useState('');
  const [targetMeal, setTargetMeal] = useState(0);
  const [showEquiv, setShowEquiv] = useState(false);
  const [addGrams, setAddGrams] = useState<Record<string, number>>({});
  const [expandedFood, setExpandedFood] = useState<string | null>(null);

  const filteredFoods = useMemo(() => {
    if (!search.trim()) return MOCK_FOODS;
    const q = search.toLowerCase();
    return MOCK_FOODS.filter((f) => f.n.toLowerCase().includes(q) || f.grupo.toLowerCase().includes(q));
  }, [search]);

  const addFood = (food: typeof MOCK_FOODS[0], grams: number) => {
    const r = grams / 100;
    const newItem: MealItem = {
      food: {
        n: food.n,
        k: Math.round(food.k * r),
        p: +(food.p * r).toFixed(1),
        gr: +(food.g * r).toFixed(1),
        h: +(food.h * r).toFixed(1),
        fi: +(food.fi * r).toFixed(1),
        na: 0,
        K: 0,
        _src: 'LOCAL',
      },
      gramos: grams,
      nombre: food.n,
      grupo: food.grupo,
      unit: 'g',
    };
    const newComidas = state.comidas.map((c, i) => {
      if (i !== targetMeal) return c;
      return { ...c, alimentos: [...c.alimentos, newItem] };
    });
    onStateChange(newComidas);
  };

  const removeFood = (mealIdx: number, foodIdx: number) => {
    const newComidas = state.comidas.map((c, i) => {
      if (i !== mealIdx) return c;
      return { ...c, alimentos: c.alimentos.filter((_, j) => j !== foodIdx) };
    });
    onStateChange(newComidas);
  };

  const updateGrams = (mealIdx: number, foodIdx: number, grams: number) => {
    const newComidas = state.comidas.map((c, i) => {
      if (i !== mealIdx) return c;
      const alimentos = c.alimentos.map((a, j) => {
        if (j !== foodIdx) return a;
        const ratio = grams / (a.gramos || 100);
        return {
          ...a,
          gramos: grams,
          food: {
            ...a.food,
            k: Math.round(a.food.k * ratio),
            p: +(a.food.p * ratio).toFixed(1),
            gr: +(a.food.gr * ratio).toFixed(1),
            h: +(a.food.h * ratio).toFixed(1),
            fi: +(a.food.fi * ratio).toFixed(1),
          },
        };
      });
      return { ...c, alimentos };
    });
    onStateChange(newComidas);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
          🍽️
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Desarrollo</h2>
          <p className="text-xs text-text-3">Construya las tomas del día desde el catálogo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-text-3" />
              <h3 className="text-sm font-semibold text-text">Catálogo de alimentos</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowEquiv(!showEquiv)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark transition-colors"
            >
              <BookOpen size={12} />
              Equivalencias
              <ChevronDown size={12} className={`transition-transform ${showEquiv ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {showEquiv && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="p-3 rounded-xl bg-surface-2 border border-border">
                  {Object.entries(FOOD_EQUIVALENCIAS).map(([group, data]) => (
                    <div key={group} className="mb-2 last:mb-0">
                      <div className="text-xs font-semibold text-text-2 mb-1">{group}</div>
                      <div className="flex flex-wrap gap-1">
                        {data.equiv.slice(0, 4).map((eq, i) => (
                          <span key={i} className="text-[10px] bg-surface-3 text-text-2 px-2 py-0.5 rounded-lg">
                            {eq.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar alimento..." className="mb-3" />

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredFoods.map((food) => {
              const isExp = expandedFood === food.id;
              const grams = addGrams[food.id] || 100;
              return (
                <div key={food.id} className="rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedFood(isExp ? null : food.id)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium text-text">{food.n}</span>
                      <span className="text-[10px] text-text-3 ml-2">{Math.round(food.k)} kcal/100g</span>
                    </div>
                    <span className="text-[10px] bg-surface-3 text-text-2 px-2 py-0.5 rounded-full">{food.grupo}</span>
                  </button>
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-white/5">
                          <div className="grid grid-cols-5 gap-2 mb-3 text-center">
                            <div><div className="text-[10px] text-text-3">Kcal</div><div className="text-xs font-bold text-text">{Math.round(food.k)}</div></div>
                            <div><div className="text-[10px] text-text-3">Prot</div><div className="text-xs font-bold text-accent">{food.p}</div></div>
                            <div><div className="text-[10px] text-text-3">Grasas</div><div className="text-xs font-bold text-warning">{food.g}</div></div>
                            <div><div className="text-[10px] text-text-3">HC</div><div className="text-xs font-bold text-success">{food.h}</div></div>
                            <div><div className="text-[10px] text-text-3">Fibra</div><div className="text-xs font-bold text-text-2">{food.fi}</div></div>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={grams}
                              onChange={(e) => setAddGrams({ ...addGrams, [food.id]: Number(e.target.value) })}
                              className="!w-20 text-center"
                            />
                            <Button size="sm" onClick={() => addFood(food, grams)} className="flex-1">
                              <Plus size={14} /> Agregar
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Tomas del día</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onBack}>← Macros</Button>
              <Button size="sm" onClick={onNext}>Cuadraje →</Button>
            </div>
          </div>

          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {state.comidas.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTargetMeal(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  targetMeal === i ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-text-3 hover:text-text'
                }`}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {state.comidas.map((c, ci) => {
              const mealKcal = c.alimentos.reduce((t, a) => t + a.food.k * (a.gramos / 100), 0);
              const objKcal = Math.round(state.get * c.pct / 100);
              const pct = objKcal > 0 ? Math.round((mealKcal / objKcal) * 100) : 0;
              const status = pct >= 90 && pct <= 110 ? 'success' : pct > 110 ? 'danger' : 'warning';
              const statusColors: Record<string, string> = {
                success: 'bg-success/10 text-success border-success/20',
                danger: 'bg-danger/10 text-danger border-danger/20',
                warning: 'bg-warning/10 text-warning border-warning/20',
              };

              return (
                <motion.div
                  key={ci}
                  layout
                  className={`rounded-xl border transition-all ${targetMeal === ci ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface'}`}
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">{c.nombre}</span>
                      <span className="text-[10px] bg-surface-3 text-text-2 px-2 py-0.5 rounded-full">
                        {c.pct}% · ~{objKcal} kcal
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[status]}`}>
                        {Math.round(mealKcal)} kcal ({pct}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => setTargetMeal(ci)}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                          targetMeal === ci ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text-3 hover:text-text'
                        }`}
                      >
                        {targetMeal === ci ? 'Activa' : 'Editar'}
                      </button>
                    </div>
                  </div>

                  {c.alimentos.length > 0 ? (
                    <div className="px-3 pb-3 space-y-1.5">
                      {c.alimentos.map((a, ai) => (
                        <div key={ai} className="flex items-center gap-2 p-2 rounded-lg bg-surface-2/50 border border-white/5">
                          <span className="flex-1 text-xs font-medium text-text truncate">{a.nombre}</span>
                          <input
                            type="number"
                            value={a.gramos}
                            onChange={(e) => updateGrams(ci, ai, Number(e.target.value) || 0)}
                            className="w-14 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text text-center font-mono"
                          />
                          <span className="text-[10px] text-text-3 w-8">{a.unit}</span>
                          <span className="text-xs font-bold text-primary w-12 text-right tabular-nums">
                            {Math.round(a.food.k * (a.gramos / 100))} kcal
                          </span>
                          <span className="text-[10px] text-text-3 hidden md:block">
                            P{a.food.p} G{a.food.gr} HC{a.food.h}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFood(ci, ai)}
                            className="p-1 rounded-lg hover:bg-danger/10 text-text-3 hover:text-danger transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 pb-3 text-center py-4 text-xs text-text-3">
                      Sin alimentos — busque y agregue desde el catálogo
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-text-3">
              <span>Total alimentos: {state.comidas.reduce((t, c) => t + c.alimentos.length, 0)}</span>
              <span>{state.comidas.length} tomas</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
