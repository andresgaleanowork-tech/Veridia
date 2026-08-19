
import { Dialog } from '@/components/ui/Dialog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { FOOD_EQUIVALENCIAS } from '@/features/desarrollada/lib/constants';

interface EquivalencesModalProps {
  open: boolean;
  onClose: () => void;
}

export function EquivalencesModal({ open, onClose }: EquivalencesModalProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Equivalencias de Alimentos" maxWidth="max-w-2xl">
      <p className="text-sm text-text-3 mb-4">
        Tabla de intercambios: alimentos con valor nutricional similar que pueden sustituirse entre sí.
      </p>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {Object.entries(FOOD_EQUIVALENCIAS).map(([group, data]) => (
          <Card key={group} className="p-4 border-l-[3px] border-l-primary">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">{group}</h3>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                1 porción ≈ {data.porcion}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.equiv.map((eq, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-white/5 hover:border-primary/20 transition-colors"
                >
                  <span className="text-xs text-text-2">{eq.nombre}</span>
                  <span className="text-xs font-mono text-primary tabular-nums font-medium">{eq.g}g</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    </Dialog>
  );
}
