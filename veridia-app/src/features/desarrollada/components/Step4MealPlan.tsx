
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { CheckCircle, AlertTriangle, XCircle, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import type { MealSlot } from '@/types';
import { getSemaforoStatus } from '@/features/desarrollada/lib/formulas';

interface Step4MealPlanProps {
  state: {
    comidas: MealSlot[];
    get: number;
    protG: number;
    grasasG: number;
    hcG: number;
    fibraG: number;
    peso: number;
  };
  onBack: () => void;
  onNext: () => void;
}

interface NutrientRow {
  label: string;
  actual: number;
  objetivo: number;
  unit: string;
}

export function Step4MealPlan({ state, onBack, onNext }: Step4MealPlanProps) {
  const accum = useMemo(() => {
    const acc = { k: 0, p: 0, g: 0, h: 0, fi: 0, micros: {} as Record<string, number> };
    state.comidas.forEach((c) => {
      c.alimentos.forEach((a) => {
        const r = a.gramos / 100;
        acc.k += a.food.k * r;
        acc.p += a.food.p * r;
        acc.g += a.food.gr * r;
        acc.h += a.food.h * r;
        acc.fi += a.food.fi * r;
      });
    });
    return acc;
  }, [state.comidas]);

  const rows = useMemo((): NutrientRow[] => {
    return [
      { label: 'Energía', actual: accum.k, objetivo: state.get, unit: 'kcal' },
      { label: 'Proteínas', actual: accum.p, objetivo: state.protG, unit: 'g' },
      { label: 'Grasas', actual: accum.g, objetivo: state.grasasG, unit: 'g' },
      { label: 'HC', actual: accum.h, objetivo: state.hcG, unit: 'g' },
      { label: 'Fibra', actual: accum.fi, objetivo: state.fibraG, unit: 'g' },
    ];
  }, [accum, state]);


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
          📊
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Cuadraje final</h2>
          <p className="text-xs text-text-3">Validación semáforo del plan alimentario.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-t-3 border-t-primary/60">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text">Tabla de cuadraje</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button variant="ghost" size="sm" icon={<Download size={14} />}>
              Exportar
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-text-3 uppercase tracking-wider">Nutriente</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-3 uppercase tracking-wider text-right">Actual</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-3 uppercase tracking-wider text-right">Objetivo</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-3 uppercase tracking-wider text-right">Unidad</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-3 uppercase tracking-wider text-right">%</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-3 uppercase tracking-wider text-right">Semáforo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row: NutrientRow) => {
                const status = getSemaforoStatus(row.actual, row.objetivo);
                const pct = row.objetivo > 0 ? Math.round((row.actual / row.objetivo) * 100) : 0;
                const statusConfig = {
                  green: { icon: <CheckCircle size={16} className="text-success" />, label: 'Óptimo', color: 'text-success', bg: 'bg-success/10' },
                  yellow: { icon: <AlertTriangle size={16} className="text-warning" />, label: 'Ajuste', color: 'text-warning', bg: 'bg-warning/10' },
                  red: { icon: <XCircle size={16} className="text-danger" />, label: 'Exceso', color: 'text-danger', bg: 'bg-danger/10' },
                }[status];
                return (
                  <tr key={row.label} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-medium text-text flex items-center gap-2">
                      <span className="text-base">{status === 'green' ? '🟢' : status === 'yellow' ? '🟡' : '🔴'}</span>
                      {row.label}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono tabular-nums ${status === 'red' ? 'text-danger font-bold' : 'text-text'}`}>
                      {Math.round(row.actual)}
                    </td>
                    <td className="px-5 py-3 text-right text-text-3 font-mono tabular-nums">{row.objetivo}</td>
                    <td className="px-5 py-3 text-right text-text-3 text-xs">{row.unit}</td>
                    <td className={`px-5 py-3 text-right font-mono tabular-nums ${status === 'green' ? 'text-success' : status === 'red' ? 'text-danger' : 'text-warning'}`}>
                      {pct}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text mb-4">Distribución por toma</h3>
        <div className="space-y-3">
          {state.comidas.map((c, i) => {
            const mealKcal = c.alimentos.reduce((t, a) => t + a.food.k * (a.gramos / 100), 0);
            const objKcal = Math.round(state.get * c.pct / 100);
            const pct = objKcal > 0 ? Math.round((mealKcal / objKcal) * 100) : 0;
            const status = getSemaforoStatus(mealKcal, objKcal);
            const statusColors = { green: 'bg-success', yellow: 'bg-warning', red: 'bg-danger' };
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-32 text-xs font-medium text-text-2 truncate">{c.nombre}</div>
                <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    className={`h-full ${statusColors[status]} rounded-full`}
                  />
                </div>
                <div className="w-16 text-right text-xs text-text-3 font-mono tabular-nums">
                  {Math.round(mealKcal)} / {objKcal}
                </div>
                <div className="w-10 text-right">
                  <span className={`text-[10px] font-bold ${status === 'green' ? 'text-success' : status === 'red' ? 'text-danger' : 'text-warning'}`}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          ← Ajustar
        </Button>
        <Button onClick={onNext} size="lg" icon={<CheckCircle size={18} />}>
          Generar minuta →
        </Button>
      </div>
    </div>
  );
}
