import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Flame, Scale, Wheat, Droplet } from 'lucide-react';
import { FormulaStepper } from './components/FormulaStepper';
import { Step1PatientData, type Step1Props } from './components/Step1PatientData';
import { Step2Macros } from './components/Step2Macros';
import { Step3Adjustments } from './components/Step3Adjustments';
import { Step4MealPlan } from './components/Step4MealPlan';
import { Step5Generate } from './components/Step5Generate';
import { FormulaPreview } from './components/FormulaPreview';
import { EquivalencesModal } from './components/EquivalencesModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import type { Patient, DesarrolladaState, MealSlot, MacroResult, MealItem } from '@/types';
import { calcGEB, calcGET, calcMacros, calcBMI, getBMICategory } from './lib/formulas';

const DEFAULT_MEALS: MealSlot[] = [
  { nombre: 'Desayuno', pct: 20, alimentos: [] },
  { nombre: 'Media mañana', pct: 10, alimentos: [] },
  { nombre: 'Comida', pct: 35, alimentos: [] },
  { nombre: 'Merienda', pct: 10, alimentos: [] },
  { nombre: 'Cena', pct: 25, alimentos: [] },
];

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
} as const;

export function DesarrolladaPage() {
  const [step, setStep] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showEquiv, setShowEquiv] = useState(false);
  const [macroResult, setMacroResult] = useState<MacroResult | null>(null);

  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async (): Promise<Patient[]> => {
      const res = await api.get('/patients');
      return res.data.patients || res.data.data || res.data;
    },
    staleTime: 60000,
  });

  const defaultPatientId = patients?.find((p) => p.activo)?.id || patients?.[0]?.id || '';
  useEffect(() => {
    if (defaultPatientId && !selectedPatientId) {
      setSelectedPatientId(defaultPatientId);
    }
  }, [defaultPatientId, selectedPatientId]);

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId);

  const [state, setState] = useState<Partial<DesarrolladaState>>({
    peso: 70,
    altura: 165,
    edad: 30,
    sexo: 'M',
    formula: 'Mifflin-St Jeor',
    fa: 1.55,
    fe: 1,
    ajuste: 0,
    patologia: '',
    patKey: '',
    selectedPaths: [],
    comidas: DEFAULT_MEALS,
    medicacion: '',
    alergias: '',
    protGkg: 1.2,
    grasasPct: 30,
  });

  const calculateMacros = useCallback(() => {
    if (!state.peso) return;
    const geb = calcGEB(state.peso, state.altura || 165, state.edad || 30, state.sexo || 'M', state.formula || 'Mifflin-St Jeor');
    const get = calcGET(geb, state.fa || 1.55, state.fe || 1, state.ajuste || 0);
    const macros = calcMacros(get, state.protGkg || 1.2, state.grasasPct || 30, state.peso || 70, state.fe || 1, state.ajuste || 0);
    const result: MacroResult = {
      ...macros,
      geb,
      get,
    };
    setMacroResult(result);
    setStep(2);
  }, [state.peso, state.altura, state.edad, state.sexo, state.formula, state.fa, state.fe, state.ajuste, state.protGkg, state.grasasPct]);

  const handleStep1Change = useCallback((newState: Step1Props['state']) => {
    setState((prev) => ({ ...prev, ...newState } as Partial<DesarrolladaState>));
  }, []);

  const handleApproveMacros = useCallback(() => {
    setStep(3);
  }, []);

  const handleComidasChange = useCallback((comidas: MealSlot[]) => {
    setState((prev) => ({ ...prev, comidas }));
  }, []);

  const handleSaveMinuta = useCallback(() => {
    if (import.meta.env.DEV) console.log('Saving minuta...', state);
    setStep(5);
  }, [state]);

  // Calculate consumed macros from meal plan
  const consumed = useMemo(() => {
    if (!state.comidas) return { kcal: 0, protG: 0, grasasG: 0, hcG: 0, fibraG: 0 };
    return state.comidas.reduce((acc, meal) => {
      meal.alimentos?.forEach((food: MealItem) => {
        const factor = (food.gramos || 100) / 100;
        acc.kcal += (food.food?.k || 0) * factor;
        acc.protG += (food.food?.p || 0) * factor;
        acc.grasasG += (food.food?.gr || 0) * factor;
        acc.hcG += (food.food?.h || 0) * factor;
        acc.fibraG += (food.food?.fi || 0) * factor;
      });
      return acc;
    }, { kcal: 0, protG: 0, grasasG: 0, hcG: 0, fibraG: 0 });
  }, [state.comidas]);

  const remaining = useMemo(() => {
    if (!macroResult) return { kcal: 0, protG: 0, grasasG: 0, hcG: 0, fibraG: 0 };
    return {
      kcal: Math.max(0, macroResult.get - consumed.kcal),
      protG: Math.max(0, macroResult.protG - consumed.protG),
      grasasG: Math.max(0, macroResult.grasasG - consumed.grasasG),
      hcG: Math.max(0, macroResult.hcG - consumed.hcG),
      fibraG: Math.max(0, (macroResult.fibraG || 25) - consumed.fibraG),
    };
  }, [macroResult, consumed]);

  const bmi = useMemo(() => calcBMI(state.peso || 70, state.altura || 165), [state.peso, state.altura]);
  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi]);

  if (loadingPatients) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1PatientData
            patients={patients || []}
            selectedPatientId={selectedPatientId}
            onPatientSelect={setSelectedPatientId}
            state={{
              peso: state.peso || 70,
              altura: state.altura || 165,
              edad: state.edad || 30,
              sexo: (state.sexo as 'M' | 'F') || 'M',
              formula: (state.formula as string) || 'Mifflin-St Jeor',
              fa: state.fa || 1.55,
              fe: state.fe || 1,
              ajuste: state.ajuste || 0,
              patKey: state.patKey || '',
              selectedPaths: state.selectedPaths || [],
              medicacion: state.medicacion || '',
              alergias: state.alergias || '',
            }}
            onChange={handleStep1Change}
            onNext={calculateMacros}
          />
        );
      case 2:
        return macroResult ? (
          <Step2Macros
            result={macroResult}
            peso={state.peso || 70}
            patologia={state.patologia || ''}
            onApprove={handleApproveMacros}
            onBack={() => setStep(1)}
          />
        ) : null;
      case 3:
        return (
          <Step3Adjustments
            state={{
              comidas: state.comidas || DEFAULT_MEALS,
              get: macroResult?.get || 0,
              protG: state.protG || 0,
              grasasG: state.grasasG || 0,
              hcG: state.hcG || 0,
              fibraG: state.fibraG || 0,
            }}
            onStateChange={handleComidasChange}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        );
      case 4:
        return (
          <Step4MealPlan
            state={{
              comidas: state.comidas || DEFAULT_MEALS,
              get: macroResult?.get || 0,
              protG: state.protG || 0,
              grasasG: state.grasasG || 0,
              hcG: state.hcG || 0,
              fibraG: state.fibraG || 0,
              peso: state.peso || 70,
            }}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        );
      case 5:
        return (
          <Step5Generate
            state={{
              comidas: state.comidas || DEFAULT_MEALS,
              get: macroResult?.get || 0,
              protG: state.protG || 0,
              grasasG: state.grasasG || 0,
              hcG: state.hcG || 0,
              fibraG: state.fibraG || 0,
              aguaL: macroResult?.aguaL || 0,
              patologia: state.patologia || '',
              peso: state.peso || 70,
              protGkg: state.protGkg || 1.2,
              grasasPct: state.grasasPct || 30,
            }}
            patientName={selectedPatient ? `${selectedPatient.nombre} ${selectedPatient.apellidos}` : 'Paciente'}
            onBack={() => setStep(4)}
            onSave={handleSaveMinuta}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex gap-6">
        <aside className="hidden lg:block w-64 shrink-0">
          <Card className="p-5 sticky top-6">
            <FormulaStepper currentStep={step} onStepClick={setStep} />
          </Card>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <Card className="p-4">
              <FormulaStepper currentStep={step} onStepClick={setStep} />
            </Card>
          </div>

          {/* Sticky Macro Summary Bar - visible from step 2 onwards */}
          {macroResult && step >= 2 && (
            <div className="sticky top-0 z-20 mb-4 glass-card border-border/50 shadow-lg">
              <div className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm font-medium text-text">
                    <Flame size={16} className="text-primary" />
                    <span>Macros Totales</span>
                    {selectedPatient && (
                      <Badge variant="secondary" size="sm" className="ml-2">
                        {selectedPatient.nombre} {selectedPatient.apellidos}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 flex-wrap">
                    <MacroBarItem
                      label="Kcal"
                      target={macroResult.get}
                      consumed={Math.round(consumed.kcal)}
                      remaining={Math.round(remaining.kcal)}
                      unit=""
                      icon={<Flame size={14} className="text-warning" />}
                      color="text-warning"
                    />
                    <MacroBarItem
                      label="Proteína"
                      target={macroResult.protG || 0}
                      consumed={Math.round(consumed.protG)}
                      remaining={Math.round(remaining.protG)}
                      unit="g"
                      icon={<Scale size={14} className="text-info" />}
                      color="text-info"
                    />
                    <MacroBarItem
                      label="Grasas"
                      target={macroResult.grasasG || 0}
                      consumed={Math.round(consumed.grasasG)}
                      remaining={Math.round(remaining.grasasG)}
                      unit="g"
                      icon={<Wheat size={14} className="text-accent" />}
                      color="text-accent"
                    />
                    <MacroBarItem
                      label="HC"
                      target={macroResult.hcG || 0}
                      consumed={Math.round(consumed.hcG)}
                      remaining={Math.round(remaining.hcG)}
                      unit="g"
                      icon={<Utensils size={14} className="text-success" />}
                      color="text-success"
                    />
                    <MacroBarItem
                      label="Fibra"
                      target={macroResult.fibraG || 25}
                      consumed={Math.round(consumed.fibraG)}
                      remaining={Math.round(remaining.fibraG)}
                      unit="g"
                      icon={<Droplet size={14} className="text-primary" />}
                      color="text-primary"
                    />
                  </div>
                </div>
                
                {/* Progress bar for total calories */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-text-3 mb-1.5">
                    <span>Progreso calórico total</span>
                    <span className="font-medium text-text">
                      {Math.round(consumed.kcal)} / {macroResult.get} kcal
                      ({Math.round((consumed.kcal / macroResult.get) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (consumed.kcal / macroResult.get) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {macroResult && step >= 3 && (
            <div className="hidden xl:block mt-6">
              <FormulaPreview
                result={macroResult}
                bmi={bmi}
                bmiCategory={bmiCategory}
                patientName={selectedPatient ? `${selectedPatient.nombre} ${selectedPatient.apellidos}` : 'Paciente'}
              />
            </div>
          )}
        </div>
      </div>

      <EquivalencesModal open={showEquiv} onClose={() => setShowEquiv(false)} />
    </div>
  );
}

function MacroBarItem({ label, target, consumed, remaining, unit, icon, color }: {
  label: string;
  target: number;
  consumed: number;
  remaining: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const isOver = consumed > target;
  
  return (
    <div className="flex flex-col items-center gap-1 min-w-[80px]">
      <div className="relative w-full">
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-danger' : color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-text-3">
        {icon}
        <span className="font-medium text-text">{label}</span>
      </div>
      <div className="text-right text-[10px]">
        <div className={`font-bold text-text ${isOver ? 'text-danger' : ''}`}>
          {consumed}{unit} / {target}{unit}
        </div>
        <div className={`text-[9px] ${remaining <= 0 ? 'text-danger' : 'text-success'}`}>
          {remaining > 0 ? `+${remaining}{unit}`.replace('{unit}', unit) : `${remaining}{unit}`.replace('{unit}', unit)}
        </div>
      </div>
    </div>
  );
}
