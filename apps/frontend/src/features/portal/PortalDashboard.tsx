import { useQuery } from '@tanstack/react-query';
import { ClipboardList, BookOpen, Droplets, Flame } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';

interface PortalPlan {
  id: string;
  estado: string;
  nombre: string;
  kcal_objetivo: number;
  prot_g: number;
  grasas_g: number;
  hc_g: number;
}

interface PortalJournal {
  id: string;
  fecha: string;
  total_kcal: number;
  water_ml: number;
}

export function PortalDashboard() {
  const { data: plans } = useQuery({
    queryKey: ['portal-plans'],
    queryFn: async () => { return await api.getUnwrapped<PortalPlan[]>('/portal/plans') ?? []; },
  });

  const { data: journals } = useQuery({
    queryKey: ['portal-journals'],
    queryFn: async () => { return await api.getUnwrapped<PortalJournal[]>('/portal/journal') ?? []; },
  });

  const { data: profile } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => { return await api.getUnwrapped<any>('/portal/profile'); },
  });

  const activePlans = (plans as PortalPlan[] | undefined)?.filter?.((p) => p.estado === 'activo') || plans || [];
  const recentJournals = ((journals as PortalJournal[] | undefined) || []).slice(0, 7);
  const totalCalories = recentJournals.reduce((sum: number, j) => sum + (j.total_kcal || 0), 0);
  const avgCalories = recentJournals.length > 0 ? Math.round(totalCalories / recentJournals.length) : 0;
  const streak = recentJournals.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">
          {getGreeting()}, {profile?.nombre || 'Paciente'}
        </h1>
        <p className="text-text-3 text-sm mt-1">Resumen de tu semana</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList className="text-primary" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{activePlans.length}</div>
            <div className="text-xs text-text-3">Planes activos</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <BookOpen className="text-success" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{streak}</div>
            <div className="text-xs text-text-3">Días de streak</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
            <Flame className="text-warning" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{avgCalories}</div>
            <div className="text-xs text-text-3">Kcal promedio</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
            <Droplets className="text-info" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">
              {recentJournals.length > 0 ? Math.round(recentJournals.reduce((s: number, j) => s + (j.water_ml || 0), 0) / recentJournals.length / 100) / 10 : 0}L
            </div>
            <div className="text-xs text-text-3">Agua promedio</div>
          </div>
        </Card>
      </div>

      {activePlans.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-primary" /> Tu plan actual
          </h3>
          <div className="space-y-2">
            {activePlans.slice(0, 2).map((plan: PortalPlan) => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-bg rounded-lg">
                <div>
                  <div className="font-medium text-text text-sm">{plan.nombre}</div>
                  <div className="text-xs text-text-3">{plan.kcal_objetivo} kcal</div>
                </div>
                <div className="flex gap-3 text-xs text-text-2">
                  <span>P: {plan.prot_g}g</span>
                  <span>G: {plan.grasas_g}g</span>
                  <span>HC: {plan.hc_g}g</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {recentJournals.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-success" /> Últimas entradas
          </h3>
          <div className="space-y-2">
            {recentJournals.slice(0, 5).map((journal: PortalJournal) => (
              <div key={journal.id || journal.fecha} className="flex items-center justify-between p-2 bg-bg rounded-lg text-sm">
                <span className="text-text">{formatDate(journal.fecha)}</span>
                <span className="text-text-2">{journal.total_kcal || 0} kcal</span>
                <span className="text-text-2">{(journal.water_ml || 0) / 100}L agua</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}
