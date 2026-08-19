import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FormulaStepper } from './components/FormulaStepper';
import { Step1PatientData, type Step1Props } from './components/Step1PatientData';
import { Step2Macros } from './components/Step2Macros';
import { Step3Adjustments } from './components/Step3Adjustments';
import { Step4MealPlan } from './components/Step4MealPlan';
import { Step5Generate } from './components/Step5Generate';
import { FormulaPreview } from './components/FormulaPreview';
import { EquivalencesModal } from './components/EquivalencesModal';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import type { Patient, DesarrolladaState, MealSlot, MacroResult } from '@/types';
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
