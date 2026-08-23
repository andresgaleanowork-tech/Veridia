import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { GLIMDiagnosis } from '@/types/patient-context';

export function GLIMCard({ glim }: { glim: GLIMDiagnosis }) {
  const severityConfig = {
    none: { color: 'text-success', bg: 'bg-success-light', icon: <CheckCircle size={16} />, label: 'Sin desnutrición' },
    moderate: { color: 'text-warning', bg: 'bg-warning-light', icon: <AlertTriangle size={16} />, label: 'Desnutrición Moderada' },
    severe: { color: 'text-danger', bg: 'bg-danger-light', icon: <AlertTriangle size={16} />, label: 'Desnutrición Severa' },
  };

  const config = severityConfig[glim.severity];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">GLIM Diagnóstico</h3>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
          {config.icon}
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-text-3">Score:</span>
          <span className="ml-1 font-medium text-text">{glim.score}</span>
        </div>
        <div>
          <span className="text-text-3">Diagnóstico:</span>
          <span className={`ml-1 font-medium ${glim.diagnosed ? 'text-danger' : 'text-success'}`}>
            {glim.diagnosed ? 'Sí' : 'No'}
          </span>
        </div>
      </div>

      {glim.criteria && (
        <div className="mt-3 space-y-1">
          <h4 className="text-xs font-medium text-text-3 uppercase">Criterios</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {glim.criteria.phenotypic?.weightLoss?.assessed && (
              <div className="flex items-center gap-1">
                <Info size={10} className="text-info" />
                <span className="text-text-2">Pérdida de peso: {glim.criteria.phenotypic.weightLoss.value}%</span>
              </div>
            )}
            {glim.criteria.phenotypic?.lowBMI?.assessed && (
              <div className="flex items-center gap-1">
                <Info size={10} className="text-info" />
                <span className="text-text-2">IMC bajo: {glim.criteria.phenotypic.lowBMI.value}</span>
              </div>
            )}
            {glim.criteria.etiologic?.inflammation?.assessed && (
              <div className="flex items-center gap-1">
                <Info size={10} className="text-info" />
                <span className="text-text-2">Inflamación (CRP: {glim.criteria.etiologic.inflammation.crp || 'N/A'})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {glim.recommendations.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-text-3 uppercase mb-1">Recomendaciones</h4>
          <ul className="space-y-1">
            {glim.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-text-2 flex items-start gap-1">
                <span className="text-primary mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
