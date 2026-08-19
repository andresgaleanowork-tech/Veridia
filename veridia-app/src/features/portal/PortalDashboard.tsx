import { useQuery } from '@tanstack/react-query';
import { Calendar, ClipboardList, BookOpen, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';

export function PortalDashboard() {
  const { data: plans } = useQuery({
    queryKey: ['portal-plans'],
    queryFn: async () => {
      const res = await api.get('/portal/plans');
      return res.data || [];
    },
  });

  const { data: journals } = useQuery({
    queryKey: ['portal-journals'],
    queryFn: async () => {
      const res = await api.get('/portal/journal');
      return res.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="text-primary" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{plans?.length || 0}</div>
            <div className="text-xs text-text-3">Planes activos</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <BookOpen className="text-success" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{journals?.length || 0}</div>
            <div className="text-xs text-text-3">Entradas journal</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Calendar className="text-warning" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">0</div>
            <div className="text-xs text-text-3">Próximo turno</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <TrendingUp className="text-info" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">-</div>
            <div className="text-xs text-text-3">Progreso</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
