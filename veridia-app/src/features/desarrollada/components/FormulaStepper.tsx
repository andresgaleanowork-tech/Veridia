
import { Check } from 'lucide-react';

import { motion } from 'framer-motion';

const STEPS = [
  { num: 1, label: 'Datos', icon: '📋' },
  { num: 2, label: 'Molécula', icon: '🔬' },
  { num: 3, label: 'Desarrollo', icon: '🍽️' },
  { num: 4, label: 'Cuadraje', icon: '📊' },
  { num: 5, label: 'Minuta', icon: '📄' },
];

interface FormulaStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function FormulaStepper({ currentStep, onStepClick }: FormulaStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6 px-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
          🔬
        </div>
        <div>
          <div className="font-bold text-sm text-text">Desarrollada</div>
          <div className="text-[10px] text-text-3 uppercase tracking-wider">Clinical Nutrition</div>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Pasos de la desarrollada">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          const isClickable = currentStep >= step.num;

          return (
            <div key={step.num} className="relative flex items-center gap-3">
              {idx < STEPS.length - 1 && (
                <div
                  className={`absolute left-[15px] top-8 w-px h-8 ${
                    isCompleted ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.num)}
                disabled={!isClickable}
                className={`relative flex items-center gap-3 w-full group ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary text-white shadow-glow'
                      : isActive
                      ? 'bg-primary/20 text-primary border-2 border-primary shadow-[0_0_12px_rgba(8,145,178,0.4)] animate-pulse-slow'
                      : 'bg-surface-2 text-text-3 border border-border'
                  }`}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : step.icon}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isActive ? 'text-primary' : isCompleted ? 'text-text' : 'text-text-3'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="step-indicator"
                      className="text-[10px] text-primary/80 font-medium"
                    >
                      En progreso
                    </motion.span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
