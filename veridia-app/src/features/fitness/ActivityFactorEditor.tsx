import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToggleLeft, Save } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ActivityFactorEditorProps {
  patientId: string;
  currentFactor: number;
  currentLabel: string;
  currentReason?: string | null;
}

const PRESET_FACTORS = [
  { label: 'Sedentario', value: 1.2, key: 'sedentary' as const },
  { label: 'Ligero', value: 1.375, key: 'light' as const },
  { label: 'Moderado', value: 1.55, key: 'moderate' as const },
  { label: 'Activo', value: 1.725, key: 'active' as const },
  { label: 'Muy activo', value: 1.9, key: 'very_active' as const },
];

export function ActivityFactorEditor({ patientId, currentFactor, currentReason }: ActivityFactorEditorProps) {
  const queryClient = useQueryClient();
  const [factor, setFactor] = useState(currentFactor);
  const [reason, setReason] = useState(currentReason || '');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const preset = PRESET_FACTORS.find((p) => Math.abs(p.value - factor) < 0.001);
      return api.setActivityFactor(
        patientId,
        factor,
        preset?.key || 'custom',
        reason || undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-summary', patientId] });
    },
  });

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ToggleLeft size={18} className="text-primary" />
        <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Factor de Actividad</h3>
      </div>
      <p className="text-xs text-text-3 mb-3">Ajuste manual del factor de actividad para cálculos nutricionales.</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {PRESET_FACTORS.map((p) => (
          <button
            key={p.key}
            onClick={() => setFactor(p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              Math.abs(factor - p.value) < 0.001
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-surface-2 border-border text-text-3 hover:text-text hover:border-primary/30'
            }`}
          >
            {p.label} ({p.value})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs text-text-3">FA personalizado:</label>
        <input
          type="number"
          step="0.001"
          min="1.0"
          max="2.5"
          value={factor}
          onChange={(e) => setFactor(parseFloat(e.target.value) || 1.2)}
          className="w-24 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
        />
      </div>

      <div className="mb-3">
        <label className="text-xs text-text-3 block mb-1">Motivo del ajuste</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Opcional"
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
        />
      </div>

      <Button
        size="sm"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="flex items-center gap-1.5"
      >
        <Save size={14} />
        {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
      </Button>

      {saveMutation.isError && (
        <p className="text-xs text-danger mt-2">Error al guardar. Intente nuevamente.</p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-xs text-success mt-2">Factor actualizado correctamente.</p>
      )}
    </Card>
  );
}
