
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { FlaskConical, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import type { MacroResult } from '@/types';

interface Step2MacrosProps {
  result: MacroResult;
  peso: number;
  patologia: string;
  onApprove: () => void;
  onBack: () => void;
}

export function Step2Macros({ result, peso, patologia, onApprove, onBack }: Step2MacrosProps) {
  const protPct = useMemo(() => Math.round((result.protG * 4 / result.get) * 100), [result]);
  const grasasPct = result.grasasPct;
  const hcPct = 100 - protPct - grasasPct;
  const bmi = useMemo(() => {
    if (!peso) return 0;
    const alturaM = (peso > 100 ? 165 : 170) / 100;
    return Number((peso / (alturaM * alturaM)).toFixed(1));
  }, [peso]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
          🔬
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Molécula calórica</h2>
          <p className="text-xs text-text-3">
            Adaptada a <span className="text-primary font-medium">{patologia || 'Sin patología'}</span>. Ajuste y apruebe.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="GEB" value={`${Math.round(result.geb)} kcal`} icon={<FlaskConical size={14} />} />
        <StatCard label="FA × FE" value={`×${result.fe}`} icon={<Zap size={14} />} />
        <StatCard label="Ajuste" value={`${result.ajuste || 0} kcal`} icon={<TrendingUp size={14} />} />
        <StatCard label="GET" value={`${result.get} kcal`} big icon={<Zap size={14} />} accent />
      </div>

      <Card className="p-5 border-t-3 border-t-primary/60">
        <h3 className="text-sm font-semibold text-text mb-4">Distribución macronutricional</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <MacroCard label="Proteínas" value={`${result.protG}g`} pct={`${protPct}% · ${result.protG * 4} kcal`} color="accent" borderColor="border-accent" />
          <MacroCard label="Grasas" value={`${result.grasasG}g`} pct={`${grasasPct}% · ${result.grasasG * 9} kcal`} color="warning" borderColor="border-warning" />
          <MacroCard label="HC" value={`${result.hcG}g`} pct={`${hcPct}% · ${result.hcG * 4} kcal`} color="success" borderColor="border-success" />
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${protPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="bg-accent"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${grasasPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="bg-warning"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hcPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="bg-success"
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-text-3">
          <span>Proteínas {protPct}%</span>
          <span>Grasas {grasasPct}%</span>
          <span>HC {hcPct}%</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Fibra" value={`${result.fibraG}g`} />
        <MiniStat label="Agua" value={`${result.aguaL}L`} />
        <MiniStat label="IMC aprox." value={bmi > 0 ? bmi.toString() : '—'} />
        <MiniStat label="Patología" value={patologia || '—'} />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          ← Volver
        </Button>
        <Button onClick={onApprove} size="lg">
          ✓ Aprobar y desarrollar →
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, big, accent }: { label: string; value: string; icon?: React.ReactNode; big?: boolean; accent?: boolean }) {
  return (
    <Card className={`p-4 text-center ${accent ? 'glow-border' : ''}`}>
      {icon && <div className="flex justify-center mb-2 text-text-3">{icon}</div>}
      <div className="text-[10px] uppercase tracking-wider text-text-3 mb-1">{label}</div>
      <div className={`font-bold tabular-nums ${big ? 'text-2xl text-primary' : 'text-base text-text'}`}>{value}</div>
    </Card>
  );
}

function MacroCard({ label, value, pct, color, borderColor }: { label: string; value: string; pct: string; color: string; borderColor: string }) {
  const colorMap: Record<string, string> = {
    accent: 'text-accent',
    warning: 'text-warning',
    success: 'text-success',
  };
  return (
    <Card className={`p-4 ${borderColor} border-t-3`}>
      <div className="text-xs text-text-3 mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorMap[color]} tabular-nums`}>{value}</div>
      <div className="text-[10px] text-text-3 mt-1">{pct}</div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-text-3 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-text tabular-nums">{value}</div>
    </Card>
  );
}
