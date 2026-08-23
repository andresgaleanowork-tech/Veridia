import { CheckCircle, Circle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { NCPStatus } from '@/types/patient-context';

export function NCPCard({ ncp }: { ncp: NCPStatus }) {
  const stepLabels: Record<string, string> = {
    assessment: 'Evaluación',
    diagnosis: 'Diagnóstico Nutricional',
    intervention: 'Intervención',
    monitoring: 'Seguimiento',
    reevaluation: 'Reevaluación',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">Proceso de Cuidado Nutricional (NCP)</h3>
        <span className="text-xs text-text-3">
          Completado: {ncp.completenessScore}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-3 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
          style={{ width: `${ncp.completenessScore}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2 mb-4">
        {ncp.steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            {step.completed ? (
              <CheckCircle size={14} className="text-success shrink-0" />
            ) : ncp.currentStep === step.id ? (
              <ArrowRight size={14} className="text-primary shrink-0" />
            ) : (
              <Circle size={14} className="text-text-3 shrink-0" />
            )}
            <span className={`text-xs ${step.completed ? 'text-text-2' : ncp.currentStep === step.id ? 'text-text font-medium' : 'text-text-3'}`}>
              {stepLabels[step.name] || step.name}
            </span>
          </div>
        ))}
      </div>

      {/* PES Statements */}
      {ncp.pesStatements.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-text-3 uppercase mb-1">Diagnósticos PES</h4>
          <div className="space-y-1.5">
            {ncp.pesStatements.map((pes, i) => (
              <div key={i} className="bg-surface-2 rounded-lg p-2 text-xs border border-border">
                <div className="flex items-center gap-1 mb-0.5">
                  {pes.priority === 'high' && <AlertTriangle size={10} className="text-danger" />}
                  <span className="font-medium text-text">{pes.problem}</span>
                </div>
                <div className="text-text-3">
                  <span>E: {pes.etiology}</span>
                </div>
                <div className="text-text-3">
                  <span>S: {pes.signs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Diagnoses */}
      {ncp.nutritionDiagnoses.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-text-3 uppercase mb-1">Diagnósticos Nutricionales</h4>
          <div className="flex flex-wrap gap-1">
            {ncp.nutritionDiagnoses.map((dx, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary-light text-primary text-xs rounded-full">
                {dx}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {ncp.goals.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-3 uppercase mb-1">Objetivos</h4>
          <ul className="space-y-0.5">
            {ncp.goals.map((goal, i) => (
              <li key={i} className="text-xs text-text-2 flex items-start gap-1">
                <span className="text-accent mt-0.5">→</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
