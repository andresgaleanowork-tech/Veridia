import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';

export function PortalPlansPage() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['portal-plans'],
    queryFn: async () => {
      const res = await api.get('/portal/plans');
      return res.data || [];
    },
  });

  if (isLoading) return <div className="space-y-4">Cargando planes...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Mis Planes Alimentarios</h1>
      {!plans?.length ? (
        <Card className="p-8 text-center text-text-3">No tienes planes asignados</Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan: any) => (
            <Card key={plan.id} className="p-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="text-primary" size={20} />
                <div>
                  <h3 className="font-semibold text-text">{plan.nombre}</h3>
                  <p className="text-sm text-text-3">Creado: {new Date(plan.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
