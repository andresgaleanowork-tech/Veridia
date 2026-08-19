
import { motion } from 'framer-motion';
import { Zap, Heart, Activity } from 'lucide-react';

import type { MacroResult } from '@/types';

interface FormulaPreviewProps {
  result: MacroResult;
  bmi: number;
  bmiCategory: { label: string; color: string };
  patientName: string;
}

export function FormulaPreview({ result, bmi, bmiCategory, patientName }: FormulaPreviewProps) {
  const protPct = Math.round((result.protG * 4 / result.get) * 100);
  const hcPct = 100 - protPct - result.grasasPct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 glow-border"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
          🔬
        </div>
        <div>
          <h3 className="text-sm font-bold text-text">Fórmula Desarrollada</h3>
          <p className="text-xs text-text-3">{patientName}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-surface-2 border border-border">
          <div className="text-[10px] uppercase tracking-wider text-text-3 mb-1">GET</div>
          <div className="text-xl font-bold text-primary tabular-nums">{result.get}</div>
          <div className="text-[10px] text-text-3">kcal/día</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface-2 border border-border">
          <div className="text-[10px] uppercase tracking-wider text-text-3 mb-1">IMC</div>
          <div className={`text-xl font-bold tabular-nums ${bmiCategory.color}`}>{bmi}</div>
          <div className="text-[10px] text-text-3">{bmiCategory.label}</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface-2 border border-border">
          <div className="text-[10px] uppercase tracking-wider text-text-3 mb-1">Agua</div>
          <div className="text-xl font-bold text-text tabular-nums">{result.aguaL}</div>
          <div className="text-[10px] text-text-3">L/día</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-text-3 mb-2 font-medium">Distribución</div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${protPct}%` }}
            transition={{ duration: 0.5 }}
            className="bg-accent"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.grasasPct}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-warning"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hcPct}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-success"
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-text-3">
          <span className="text-accent font-medium">{protPct}% Proteínas</span>
          <span className="text-warning font-medium">{result.grasasPct}% Grasas</span>
          <span className="text-success font-medium">{hcPct}% HC</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-accent/5 border border-accent/20 text-center">
          <Activity size={12} className="text-accent mx-auto mb-1" />
          <div className="text-sm font-bold text-accent tabular-nums">{result.protG}g</div>
          <div className="text-[10px] text-text-3">Proteínas</div>
        </div>
        <div className="p-2 rounded-lg bg-warning/5 border border-warning/20 text-center">
          <Zap size={12} className="text-warning mx-auto mb-1" />
          <div className="text-sm font-bold text-warning tabular-nums">{result.grasasG}g</div>
          <div className="text-[10px] text-text-3">Grasas</div>
        </div>
        <div className="p-2 rounded-lg bg-success/5 border border-success/20 text-center">
          <Heart size={12} className="text-success mx-auto mb-1" />
          <div className="text-sm font-bold text-success tabular-nums">{result.hcG}g</div>
          <div className="text-[10px] text-text-3">HC</div>
        </div>
      </div>
    </motion.div>
  );
}
