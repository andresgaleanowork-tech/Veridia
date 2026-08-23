import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import api from '@/lib/api';
import type { Patient, CareProcessStep } from '@/types';
import { ClipboardList, CheckCircle2, ArrowRight, ArrowLeft, Play, Stethoscope, FileText, Pill, CalendarCheck, RefreshCw } from 'lucide-react';

const STEPS: { key: CareProcessStep; label: string; icon: typeof ClipboardList; description: string }[] = [
  { key: 'screening', label: 'Screening', icon: ClipboardList, description: 'Evaluación nutricional inicial' },
  { key: 'assessment', label: 'Valoración', icon: Stethoscope, description: 'Evaluación antropométrica y bioquímica' },
  { key: 'diagnosis', label: 'Diagnóstico', icon: FileText, description: 'Criterios GLIM y diagnóstico nutricional' },
  { key: 'intervention', label: 'Intervención', icon: Pill, description: 'Plan nutricional y prescripción' },
  { key: 'followup', label: 'Seguimiento', icon: CalendarCheck, description: 'Monitorización y adherencia' },
  { key: 'reevaluation', label: 'Reevaluación', icon: RefreshCw, description: 'Evaluación de resultados' },
];

const SCREENING_TOOLS = [
  { value: 'NRS-2002', label: 'NRS-2002' },
  { value: 'MUST', label: 'MUST' },
  { value: 'SNAQ', label: 'SNAQ' },
  { value: 'MNA-SF', label: 'MNA-SF' },
] as const;

const INTERVENTION_TYPES = [
  { value: 'oral', label: 'Dieta oral + consejo' },
  { value: 'ons', label: 'Suplementación oral (ONS)' },
  { value: 'ne', label: 'Nutrición enteral' },
  { value: 'np', label: 'Nutrición parenteral' },
] as const;

const RISK_LEVELS = [
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'ALTO', label: 'Alto' },
] as const;

const SEVERITY_LEVELS = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'severa', label: 'Severa' },
] as const;

const FREQUENCY_OPTIONS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
] as const;

type ScreeningTool = typeof SCREENING_TOOLS[number]['value'];
type RiskLevel = typeof RISK_LEVELS[number]['value'];
type SeverityLevel = typeof SEVERITY_LEVELS[number]['value'];
type InterventionType = typeof INTERVENTION_TYPES[number]['value'];
type FrequencyOption = typeof FREQUENCY_OPTIONS[number]['value'];

export function CareProcessPage() {
  const { patientId } = useParams<{ patientId?: string }>();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientId || '');
  const [currentStep, setCurrentStep] = useState<CareProcessStep>('screening');
  const [careProcessId, setCareProcessId] = useState<string | null>(null);
  const [stepsCompleted, setStepsCompleted] = useState<CareProcessStep[]>([]);

  const [screening, setScreening] = useState({ tool: 'NRS-2002' as ScreeningTool, score: 0, risk: 'BAJO' as RiskLevel, motivo: '' });
  const [assessment, setAssessment] = useState({ peso: '', altura: '', imc: '', glucosa: '', hemoglobina: '', albumin: '' });
  const [diagnosis, setDiagnosis] = useState({ glim_diagnosed: false, severity: 'moderada' as SeverityLevel, notes: '' });
  const [intervention, setIntervention] = useState({ type: 'oral' as InterventionType, kcal: '', prot_g: '', espend_refs: '' });
  const [followup, setFollowup] = useState({ next_appt: '', frequency: 'semanal' as FrequencyOption, notes: '' });
  const [reevaluation, setReevaluation] = useState({ peso_change: '', biomarker_change: '', goal_achieved: false, notes: '' });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async (): Promise<Patient[]> => {
      const res = await api.get('/patients');
      return res.data.patients || res.data.data || res.data;
    },
  });

  const startMutation = useMutation({
    mutationFn: (payload: { paciente_id: string; motivo_consulta: string; screening_tool: ScreeningTool; screening_score: number; screening_risk: RiskLevel }) =>
      api.startCareProcess(payload),
    onSuccess: (data) => {
      setCareProcessId(data.id);
      setStepsCompleted(['screening']);
      setCurrentStep('assessment');
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });
    },
  });

  const stepMutation = useMutation({
    mutationFn: ({ id, step, data }: { id: string; step: CareProcessStep; data: Record<string, unknown> }) =>
      api.completeCareProcessStep(id, { step, data }),
    onSuccess: (data) => {
      setCareProcessId(data.id);
      setStepsCompleted(data.steps_completed);
      const currentIndex = STEPS.findIndex(s => s.key === data.current_step);
      if (currentIndex >= 0 && currentIndex < STEPS.length - 1 && STEPS[currentIndex + 1]) {
        setCurrentStep(STEPS[currentIndex + 1]!.key);
      }
    },
  });

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  const handleStartScreening = () => {
    if (!selectedPatientId || !screening.motivo) return;
    startMutation.mutate({
      paciente_id: selectedPatientId,
      motivo_consulta: screening.motivo,
      screening_tool: screening.tool,
      screening_score: screening.score,
      screening_risk: screening.risk,
    });
  };

  const handleCompleteStep = () => {
    if (!careProcessId) return;
    let stepData: Record<string, unknown> = {};
    switch (currentStep) {
      case 'assessment':
        stepData = { ...assessment };
        break;
      case 'diagnosis':
        stepData = { ...diagnosis };
        break;
      case 'intervention':
        stepData = { ...intervention };
        break;
      case 'followup':
        stepData = { ...followup };
        break;
      case 'reevaluation':
        stepData = { ...reevaluation };
        break;
    }
    stepMutation.mutate({ id: careProcessId, step: currentStep, data: stepData });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'screening':
        return screening.motivo.length > 0 && screening.score > 0;
      case 'assessment':
        return assessment.peso.length > 0;
      case 'diagnosis':
        return diagnosis.notes.length > 0;
      case 'intervention':
        return intervention.type.length > 0;
      case 'followup':
        return true;
      case 'reevaluation':
        return true;
      default:
        return false;
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0 && currentStepIndex < STEPS.length) {
      setCurrentStep(STEPS[currentStepIndex - 1]!.key);
    }
  };

  const resetProcess = () => {
    setCareProcessId(null);
    setStepsCompleted([]);
    setCurrentStep('screening');
    setScreening({ tool: 'NRS-2002', score: 0, risk: 'BAJO', motivo: '' });
    setAssessment({ peso: '', altura: '', imc: '', glucosa: '', hemoglobina: '', albumin: '' });
    setDiagnosis({ glim_diagnosed: false, severity: 'moderada', notes: '' });
    setIntervention({ type: 'oral', kcal: '', prot_g: '', espend_refs: '' });
    setFollowup({ next_appt: '', frequency: 'semanal', notes: '' });
    setReevaluation({ peso_change: '', biomarker_change: '', goal_achieved: false, notes: '' });
  };

  const screeningToolOptions = SCREENING_TOOLS as unknown as Array<{ value: string; label: string }>;
  const riskOptions = RISK_LEVELS as unknown as Array<{ value: string; label: string }>;
  const interventionTypeOptions = INTERVENTION_TYPES as unknown as Array<{ value: string; label: string }>;
  const severityOptions = SEVERITY_LEVELS as unknown as Array<{ value: string; label: string }>;
  const frequencyOptions = FREQUENCY_OPTIONS as unknown as Array<{ value: string; label: string }>;
  const patientOptions = patients?.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellidos}` })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Flujo Clínico</h1>
          <p className="text-text-3 text-sm mt-1">Proceso de atención nutricional guiado</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedPatientId}
            onValueChange={setSelectedPatientId}
            options={patientOptions}
            placeholder="Seleccionar paciente..."
            className="w-64"
          />
          {careProcessId && (
            <Button variant="secondary" size="sm" onClick={resetProcess}>
              Nuevo proceso
            </Button>
          )}
        </div>
      </div>

      {selectedPatient && (
        <Card className="glass-card">
          <div className="flex items-center gap-4">
            <div className="avatar avatar-md" style={{ background: 'var(--primary)', color: '#fff' }}>
              {selectedPatient.nombre?.[0]}{selectedPatient.apellidos?.[0]}
            </div>
            <div>
              <div className="font-semibold text-text">{selectedPatient.nombre} {selectedPatient.apellidos}</div>
              <div className="text-xs text-text-3">
                {selectedPatient.dni} · {selectedPatient.telefono} · {selectedPatient.email}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stepper */}
      <Card className="glass-card">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = stepsCompleted.includes(step.key);
            const isCurrent = currentStep === step.key;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted ? 'bg-success border-success text-white' :
                      isCurrent ? 'bg-primary border-primary text-white' :
                      'bg-surface-2 border-border text-text-3'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={18} />}
                  </div>
                  <div className="text-xs mt-1 font-medium text-center" style={{ color: isCurrent ? 'var(--primary)' : isCompleted ? 'var(--success)' : 'var(--text-3)' }}>
                    {step.label}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-success' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-text mb-1">
                {STEPS[currentStepIndex]?.label}
              </h2>
              <p className="text-text-3 text-sm mb-6">{STEPS[currentStepIndex]?.description}</p>

              {currentStep === 'screening' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-3 mb-1 block">Motivo de consulta</label>
                    <textarea
                      value={screening.motivo}
                      onChange={(e) => setScreening({ ...screening, motivo: e.target.value })}
                      placeholder="Describa el motivo principal de la consulta..."
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Herramienta de screening</label>
                      <Select
                        value={screening.tool}
                        onValueChange={(v) => setScreening({ ...screening, tool: v as ScreeningTool })}
                        options={screeningToolOptions}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Puntuación</label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={screening.score || ''}
                        onChange={(e) => setScreening({ ...screening, score: parseInt(e.target.value) || 0 })}
                        placeholder="0-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Nivel de riesgo</label>
                      <Select
                        value={screening.risk}
                        onValueChange={(v) => setScreening({ ...screening, risk: v as RiskLevel })}
                        options={riskOptions}
                      />
                    </div>
                  </div>
                  {!careProcessId && (
                    <Button onClick={handleStartScreening} disabled={!canProceed()} className="w-full">
                      <Play size={16} className="mr-2" />
                      Iniciar proceso clínico
                    </Button>
                  )}
                </div>
              )}

              {currentStep === 'assessment' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Peso (kg)</label>
                      <Input type="number" value={assessment.peso} onChange={(e) => setAssessment({ ...assessment, peso: e.target.value })} placeholder="70" />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Altura (cm)</label>
                      <Input type="number" value={assessment.altura} onChange={(e) => setAssessment({ ...assessment, altura: e.target.value })} placeholder="165" />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">IMC</label>
                      <Input type="number" value={assessment.imc} onChange={(e) => setAssessment({ ...assessment, imc: e.target.value })} placeholder="22" />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Glucosa (mg/dL)</label>
                      <Input type="number" value={assessment.glucosa} onChange={(e) => setAssessment({ ...assessment, glucosa: e.target.value })} placeholder="90" />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Hemoglobina (g/dL)</label>
                      <Input type="number" value={assessment.hemoglobina} onChange={(e) => setAssessment({ ...assessment, hemoglobina: e.target.value })} placeholder="13" />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Albúmina (g/dL)</label>
                      <Input type="number" value={assessment.albumin} onChange={(e) => setAssessment({ ...assessment, albumin: e.target.value })} placeholder="4" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'diagnosis' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-surface-2 rounded-lg">
                    <input
                      type="checkbox"
                      id="glim"
                      checked={diagnosis.glim_diagnosed}
                      onChange={(e) => setDiagnosis({ ...diagnosis, glim_diagnosed: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label htmlFor="glim" className="text-sm font-medium text-text cursor-pointer">
                      Cumple criterios GLIM de malnutrición
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-text-3 mb-1 block">Severidad</label>
                    <Select
                      value={diagnosis.severity}
                      onValueChange={(v) => setDiagnosis({ ...diagnosis, severity: v as SeverityLevel })}
                      options={severityOptions}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-3 mb-1 block">Notas de diagnóstico</label>
                    <textarea
                      value={diagnosis.notes}
                      onChange={(e) => setDiagnosis({ ...diagnosis, notes: e.target.value })}
                      placeholder="Describa el diagnóstico nutricional, criterios GLIM aplicados..."
                      rows={4}
                      className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              {currentStep === 'intervention' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-3 mb-1 block">Tipo de intervención</label>
                    <Select
                      value={intervention.type}
                      onValueChange={(v) => setIntervention({ ...intervention, type: v as InterventionType })}
                      options={interventionTypeOptions}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Kcal objetivo</label>
                      <Input type="number" value={intervention.kcal} onChange={(e) => setIntervention({ ...intervention, kcal: e.target.value })} placeholder="2000" />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Proteínas (g)</label>
                      <Input type="number" value={intervention.prot_g} onChange={(e) => setIntervention({ ...intervention, prot_g: e.target.value })} placeholder="80" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-3 mb-1 block">Referencias ESPEN</label>
                    <textarea
                      value={intervention.espend_refs}
                      onChange={(e) => setIntervention({ ...intervention, espend_refs: e.target.value })}
                      placeholder="Guías ESPEN aplicadas, recomendaciones específicas..."
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              {currentStep === 'followup' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Próxima cita</label>
                      <Input type="date" value={followup.next_appt} onChange={(e) => setFollowup({ ...followup, next_appt: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Frecuencia de seguimiento</label>
                      <Select
                        value={followup.frequency}
                        onValueChange={(v) => setFollowup({ ...followup, frequency: v as FrequencyOption })}
                        options={frequencyOptions}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-3 mb-1 block">Notas de seguimiento</label>
                    <textarea
                      value={followup.notes}
                      onChange={(e) => setFollowup({ ...followup, notes: e.target.value })}
                      placeholder="Plan de monitorización, indicadores a seguir, adherencia..."
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              {currentStep === 'reevaluation' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Cambio de peso (kg)</label>
                      <Input type="number" value={reevaluation.peso_change} onChange={(e) => setReevaluation({ ...reevaluation, peso_change: e.target.value })} placeholder="-2" />
                    </div>
                    <div>
                      <label className="text-xs text-text-3 mb-1 block">Cambio en biomarcadores</label>
                      <Input type="text" value={reevaluation.biomarker_change} onChange={(e) => setReevaluation({ ...reevaluation, biomarker_change: e.target.value })} placeholder="HbA1c: -1%" />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2 p-3 bg-surface-2 rounded-lg w-full">
                        <input
                          type="checkbox"
                          id="goal"
                          checked={reevaluation.goal_achieved}
                          onChange={(e) => setReevaluation({ ...reevaluation, goal_achieved: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <label htmlFor="goal" className="text-sm font-medium text-text cursor-pointer">
                          Objetivo alcanzado
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-3 mb-1 block">Notas de reevaluación</label>
                    <textarea
                      value={reevaluation.notes}
                      onChange={(e) => setReevaluation({ ...reevaluation, notes: e.target.value })}
                      placeholder="Evaluación de resultados, cambios en el plan, próximos pasos..."
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <Button
                  variant="secondary"
                  onClick={goBack}
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Anterior
                </Button>
                {currentStep !== 'reevaluation' && (
                  <Button onClick={handleCompleteStep} disabled={!canProceed() || stepMutation.isPending}>
                    Siguiente
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                )}
                {currentStep === 'reevaluation' && careProcessId && (
                  <Button onClick={() => stepMutation.mutate({ id: careProcessId, step: 'reevaluation', data: { ...reevaluation, completed: true } })} disabled={stepMutation.isPending}>
                    <CheckCircle2 size={16} className="mr-2" />
                    Completar proceso
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="glass-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-text mb-3">Progreso</h3>
              <div className="space-y-2">
                {STEPS.map((step) => {
                  const isCompleted = stepsCompleted.includes(step.key);
                  const isCurrent = currentStep === step.key;
                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-success' : isCurrent ? 'bg-primary' : 'bg-border'}`} />
                      <span className={`text-xs ${isCurrent ? 'font-semibold text-primary' : 'text-text-3'}`}>
                        {step.label}
                      </span>
                      {isCompleted && <CheckCircle2 size={14} className="text-success ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="glass-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-text mb-2">Información</h3>
              <div className="text-xs text-text-3 space-y-1">
                <p>Herramienta: {screening.tool}</p>
                <p>Puntuación: {screening.score}/10</p>
                <p>Riesgo: {screening.risk}</p>
                {careProcessId && <p className="text-success">Proceso en curso</p>}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}