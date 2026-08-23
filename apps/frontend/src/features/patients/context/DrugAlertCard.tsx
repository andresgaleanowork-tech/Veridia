import { AlertTriangle, Shield, ShieldOff, ShieldCheck, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { DrugNutrientAlert, AlertSeverity } from '@/types/patient-context';

export function DrugAlertCard({ alerts }: { alerts: DrugNutrientAlert[] }) {
  const severityConfig: Record<AlertSeverity, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    contraindicated: { color: 'text-danger', bg: 'bg-danger-light', icon: <ShieldOff size={14} />, label: 'Contraindicado' },
    major: { color: 'text-danger', bg: 'bg-danger-light', icon: <AlertTriangle size={14} />, label: 'Mayor' },
    moderate: { color: 'text-warning', bg: 'bg-warning-light', icon: <Shield size={14} />, label: 'Moderado' },
    minor: { color: 'text-info', bg: 'bg-info-light', icon: <ShieldCheck size={14} />, label: 'Menor' },
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active');

  if (activeAlerts.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-success">
          <ShieldCheck size={16} />
          <span className="text-sm font-medium">No hay interacciones droga-nutriente activas</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">Alertas Droga-Nutriente</h3>
        <span className="text-xs text-text-3">{activeAlerts.length} activas</span>
      </div>

      <div className="space-y-2">
        {activeAlerts.map((alert) => {
          const config: { color: string; bg: string; icon: React.ReactNode; label: string } = severityConfig[alert.severity] || severityConfig.minor;
          return (
            <div key={alert.id} className="bg-surface-2 rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
                    {config.icon}
                    {config.label}
                  </span>
                  <span className="text-sm font-medium text-text">{alert.drug}</span>
                </div>
                {alert.evidence && (
                  <span className="text-[10px] text-text-3 px-1.5 py-0.5 bg-surface-3 rounded">
                    Evidencia: {alert.evidence === 'strong' ? 'Fuerte' : alert.evidence === 'moderate' ? 'Moderada' : 'Débil'}
                  </span>
                )}
              </div>

              <div className="text-xs space-y-1">
                <div>
                  <span className="text-text-3">Nutriente: </span>
                  <span className="text-text font-medium">{alert.nutrient}</span>
                </div>
                <div>
                  <span className="text-text-3">Mecanismo: </span>
                  <span className="text-text-2">{alert.mechanism}</span>
                </div>
                <div>
                  <span className="text-text-3">Efecto clínico: </span>
                  <span className="text-text-2">{alert.clinicalEffect}</span>
                </div>
                <div className="bg-surface-3 rounded p-1.5 mt-1">
                  <Info size={10} className="text-primary inline mr-1" />
                  <span className="text-text font-medium">Recomendación: </span>
                  <span className="text-text-2">{alert.recommendation}</span>
                </div>
                {alert.alternativeDrugs && alert.alternativeDrugs.length > 0 && (
                  <div className="mt-1">
                    <span className="text-text-3">Alternativas: </span>
                    <span className="text-text-2">{alert.alternativeDrugs.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
