import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

interface StripeCheckoutProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  amount: number;
}

export function StripeCheckout({ open, onClose, patientId, amount }: StripeCheckoutProps) {
  const [method, setMethod] = useState('card');
  const { addToast } = useToast();
  const qc = useQueryClient();

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/payments/create-payment-intent', { patientId, amount, method });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      addToast('success', 'Pago procesado');
      onClose();
    },
    onError: () => {
      addToast('error', 'Error en el pago');
    },
  });

  const handlePay = () => {
    payMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Pagar con Stripe" maxWidth="sm">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-text">${amount.toFixed(2)}</div>
          <p className="text-text-3 text-sm">Monto a pagar</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-2 mb-2">Método de pago</label>
          <Select
            value={method}
            onValueChange={setMethod}
            options={[
              { value: 'card', label: 'Tarjeta de crédito/débito' },
            ]}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handlePay} loading={payMutation.isPending} icon={<CreditCard size={16} />}>
            Pagar ${amount.toFixed(2)}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
