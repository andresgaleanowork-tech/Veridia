import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/lib/api';
import { Users, AlertTriangle, Calendar, ArrowUpRight, Activity, Receipt } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface DashboardStats {
  totalPatients: number;
  activeAlerts: number;
  todayAppointments: number;
  pendingInvoices: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeAlerts: 0,
    todayAppointments: 0,
    pendingInvoices: 0,
  });
  const [recentPatients, setRecentPatients] = useState<{ id: string; nombre: string; apellidos: string }[]>([]);
  const [todayAppts, setTodayAppts] = useState<{ id: string; hora: string; paciente_nombre: string; estado: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsRes, apptsRes, invoicesRes] = await Promise.allSettled([
        api.get('/patients?limit=5'),
        api.get('/appointments/today'),
        api.get('/invoices?estado=Pendiente&limit=1'),
      ]);

      if (patientsRes.status === 'fulfilled') {
        const patientsEnvelope = patientsRes.value.data;
        setStats((s) => ({ ...s, totalPatients: patientsEnvelope?.meta?.total ?? 0 }));
        setRecentPatients(patientsEnvelope?.data?.slice(0, 5) || []);
      }
      if (apptsRes.status === 'fulfilled') {
        const apptsEnvelope = apptsRes.value.data;
        const apptsData = apptsEnvelope?.data || [];
        setTodayAppts(apptsData);
        setStats((s) => ({ ...s, todayAppointments: apptsData.length }));
      }
      if (invoicesRes.status === 'fulfilled') {
        const invoicesEnvelope = invoicesRes.value.data;
        setStats((s) => ({ ...s, pendingInvoices: invoicesEnvelope?.meta?.total ?? 0 }));
      }
    } catch {
      addToast('error', 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const kpiCards = useMemo(() => [
    { label: 'Pacientes activos', value: stats.totalPatients, icon: Users, color: 'from-primary to-primary-dark' },
    { label: 'Citas hoy', value: stats.todayAppointments, icon: Calendar, color: 'from-accent to-green-700' },
    { label: 'Alertas activas', value: stats.activeAlerts, icon: AlertTriangle, color: 'from-warning to-amber-700' },
    { label: 'Facturas pendientes', value: stats.pendingInvoices, icon: Receipt, color: 'from-info to-blue-700' },
  ], [stats]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text">{getGreeting()} 👋</h1>
        <p className="text-text-3 text-sm mt-1">Aquí está el resumen de tu día</p>
      </div>

      {/* KPI Grid */}
      <div aria-live="polite" aria-atomic="true" aria-busy={loading} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-24 w-full" />
            ))
          : kpiCards.map((kpi) => (
              <Card key={kpi.label} className="p-5 hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                    <kpi.icon size={18} className="text-white" />
                  </div>
                  <ArrowUpRight size={14} className="text-text-3 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-2xl font-bold text-text tabular-nums">{kpi.value}</div>
                <div className="text-xs text-text-3 mt-1">{kpi.label}</div>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fitness Overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Fitness
            </h2>
            <a href="/patients" className="text-xs text-primary hover:text-primary-light transition-colors">
              Ver pacientes →
            </a>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} variant="rect" className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-sm text-text-3">Plataformas</span>
                <span className="text-sm font-semibold text-text">5</span>
              </div>
              <p className="text-xs text-text-3 mt-2">
                Integración con Google Fit, Apple Health, Fitbit, Samsung Health y Garmin.
              </p>
            </div>
          )}
        </Card>

        {/* Today's appointments */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Citas de hoy
            </h2>
            <a href="/appointments" className="text-xs text-primary hover:text-primary-light transition-colors">
              Ver todas →
            </a>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rect" className="h-16 w-full" />
              ))}
            </div>
          ) : todayAppts.length === 0 ? (
            <div className="text-center py-8 text-text-3 text-sm">
              <Activity size={24} className="mx-auto mb-2 opacity-50" />
              No hay citas programadas para hoy
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                  <div className="text-xs font-mono text-primary font-semibold tabular-nums">{a.hora}</div>
                  <div className="flex-1 text-sm text-text">{a.paciente_nombre}</div>
                  <Badge
                    variant={
                      a.estado === 'Confirmada' ? 'success' :
                      a.estado === 'Realizada' ? 'info' :
                      'warning'
                    }
                    size="sm"
                  >
                    {a.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent patients */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Pacientes recientes
            </h2>
            <a href="/patients" className="text-xs text-primary hover:text-primary-light transition-colors">
              Ver todos →
            </a>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="list" />
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="text-center py-8 text-text-3 text-sm">
              <Users size={24} className="mx-auto mb-2 opacity-50" />
              Aún no hay pacientes registrados
            </div>
          ) : (
            <div className="space-y-2">
              {recentPatients.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                  <Avatar
                    fallback={`${p.nombre[0]}${p.apellidos[0]}`}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-text font-medium">{p.nombre} {p.apellidos}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}