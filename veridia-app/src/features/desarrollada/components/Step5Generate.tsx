
import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Printer, Download, ArrowLeft, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import type { MealSlot, MealItem } from '@/types';

interface Step5GenerateProps {
  state: {
    comidas: MealSlot[];
    get: number;
    protG: number;
    grasasG: number;
    hcG: number;
    fibraG: number;
    aguaL: number;
    patologia: string;
    peso: number;
    protGkg: number;
    grasasPct: number;
  };
  patientName: string;
  onBack: () => void;
  onSave: () => void;
}

export function Step5Generate({ state, patientName, onBack, onSave }: Step5GenerateProps) {
  const macroPct = useMemo(() => {
    const protPct = Math.round((state.protG * 4 / state.get) * 100);
    const grasasPct = state.grasasPct || Math.round((state.grasasG * 9 / state.get) * 100);
    const hcPct = 100 - protPct - grasasPct;
    return { protPct, grasasPct, hcPct };
  }, [state]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const text = generateMinutaText(state, patientName);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minuta-${patientName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
          📄
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Fórmula Desarrollada</h2>
          <p className="text-xs text-text-3">
            {patientName} · {state.patologia || 'Plan nutricional'} · {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniStatCard label="GET" value={`${state.get} kcal`} accent />
        <MiniStatCard label="Proteínas" value={`${state.protG}g`} sub={`${macroPct.protPct}%`} color="accent" />
        <MiniStatCard label="Grasas" value={`${state.grasasG}g`} sub={`${state.grasasPct || macroPct.grasasPct}%`} color="warning" />
        <MiniStatCard label="HC" value={`${state.hcG}g`} sub={`${macroPct.hcPct}%`} color="success" />
        <MiniStatCard label="Fibra" value={`${state.fibraG}g`} color="text-text-2" />
      </div>

      <div className="space-y-3">
        {state.comidas.map((c, i) => {
          const mealKcal = c.alimentos.reduce((t, a) => t + a.food.k * (a.gramos / 100), 0);
          if (!c.alimentos.length) return null;
          return (
            <Card key={i} className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-surface-2/50 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <h3 className="text-sm font-semibold text-text">{c.nombre}</h3>
                </div>
                <span className="text-xs font-mono text-text-3 tabular-nums">
                  {Math.round(mealKcal)} kcal
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/5">
                    {c.alimentos.map((a, ai) => (
                      <tr key={ai} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-2.5 font-medium text-text">{a.nombre}</td>
                        <td className="px-5 py-2.5 text-right text-text-3 text-xs">
                          {a.gramos}{a.unit}
                        </td>
                        <td className="px-5 py-2.5 text-right text-primary font-mono tabular-nums font-semibold">
                          {Math.round(a.food.k * (a.gramos / 100))} kcal
                        </td>
                        <td className="px-5 py-2.5 text-right text-text-3 text-xs hidden md:table-cell">
                          P{a.food.p}g
                        </td>
                        <td className="px-5 py-2.5 text-right text-text-3 text-xs hidden md:table-cell">
                          G{a.food.gr}g
                        </td>
                        <td className="px-5 py-2.5 text-right text-text-3 text-xs hidden md:table-cell">
                          HC{a.food.h}g
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text mb-3">Resumen diario</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-text-3 mb-1">Objetivo energético</div>
            <div className="text-lg font-bold text-primary tabular-nums">{state.get} kcal</div>
          </div>
          <div>
            <div className="text-xs text-text-3 mb-1">Agua recomendada</div>
            <div className="text-lg font-bold text-text tabular-nums">{state.aguaL} L</div>
          </div>
          <div>
            <div className="text-xs text-text-3 mb-1">Proteínas/kg</div>
            <div className="text-lg font-bold text-accent tabular-nums">{state.protGkg || 1.2} g/kg</div>
          </div>
          <div>
            <div className="text-xs text-text-3 mb-1">Patología</div>
            <div className="text-lg font-bold text-text">{state.patologia || '—'}</div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Editar
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} icon={<Download size={16} />}>
            Exportar TXT
          </Button>
          <Button variant="secondary" onClick={handlePrint} icon={<Printer size={16} />}>
            Imprimir
          </Button>
          <Button onClick={onSave} size="lg" icon={<FileText size={18} />}>
            Guardar minuta
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({ label, value, sub, color, accent }: { label: string; value: string; sub?: string; color?: string; accent?: boolean }) {
  const colorClass = accent ? 'text-primary' : color || 'text-text';
  return (
    <Card className={`p-3 text-center ${accent ? 'glow-border' : ''}`}>
      <div className="text-[10px] uppercase tracking-wider text-text-3 mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${colorClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-text-3 mt-0.5">{sub}</div>}
    </Card>
  );
}

function generateMinutaText(state: Step5GenerateProps['state'], patientName: string) {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════');
  lines.push('       FÓRMULA DESARROLLADA');
  lines.push('═══════════════════════════════════════');
  lines.push(`Paciente: ${patientName}`);
  lines.push(`Fecha: ${new Date().toLocaleDateString('es-ES')}`);
  lines.push(`Patología: ${state.patologia || 'Sin patología específica'}`);
  lines.push('');
  lines.push(`GET: ${state.get} kcal`);
  lines.push(`Proteínas: ${state.protG}g`);
  lines.push(`Grasas: ${state.grasasG}g`);
  lines.push(`HC: ${state.hcG}g`);
  lines.push(`Fibra: ${state.fibraG}g`);
  lines.push(`Agua: ${state.aguaL}L`);
  lines.push('');
  lines.push('───────────────────────────────────────');
  state.comidas.forEach((c: MealSlot) => {
    if (!c.alimentos.length) return;
    lines.push(`\n${c.nombre.toUpperCase()}`);
    lines.push('───────────────────────────────────────');
    c.alimentos.forEach((a: MealItem) => {
      const kcal = Math.round(a.food.k * (a.gramos / 100));
      lines.push(`  • ${a.nombre} — ${a.gramos}${a.unit} (${kcal} kcal)`);
    });
    const mealKcal = c.alimentos.reduce((t: number, a: MealItem) => t + a.food.k * (a.gramos / 100), 0);
    lines.push(`  Subtotal: ${Math.round(mealKcal)} kcal`);
  });
  lines.push('');
  lines.push('═══════════════════════════════════════');
  return lines.join('\n');
}
