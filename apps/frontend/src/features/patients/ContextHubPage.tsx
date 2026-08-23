import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Brain, AlertTriangle, Activity, Pill, Target, Shield,
  Utensils, Leaf, Dna, Microscope, BarChart3, Heart,
  ArrowLeft, RefreshCw, Zap,
} from 'lucide-react';
import { usePatientContext, useInvalidatePatientContext } from '@/hooks/usePatientContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { GLIMCard } from './context/GLIMCard';
import { NCPCard } from './context/NCPCard';
import { DrugAlertCard } from './context/DrugAlertCard';
import type { PatientComputedState } from '@/types/patient-context';

type ContextTab =
  | 'overview' | 'glim' | 'ncp' | 'espen' | 'drugs' | 'adherence'
  | 'ed' | 'sports' | 'precision' | 'nutrigenomic' | 'microbiome'
  | 'eating' | 'bioactives' | 'planetary';

interface TabDef {
  id: ContextTab;
  label: string;
  icon: React.ReactNode;
  hasData: (ctx: PatientComputedState) => boolean;
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Resumen', icon: <Brain size={14} />, hasData: () => true },
  { id: 'glim', label: 'GLIM', icon: <AlertTriangle size={14} />, hasData: (ctx) => !!ctx.glim },
  { id: 'ncp', label: 'NCP', icon: <Activity size={14} />, hasData: (ctx) => !!ctx.ncp },
  { id: 'espen', label: 'ESPEN', icon: <Target size={14} />, hasData: (ctx) => !!ctx.espenTargets },
  { id: 'drugs', label: 'Alertas', icon: <Pill size={14} />, hasData: (ctx) => (ctx.drugNutrientAlerts?.length ?? 0) > 0 },
  { id: 'adherence', label: 'Adherencia', icon: <Shield size={14} />, hasData: (ctx) => !!ctx.adherenceRisk },
  { id: 'ed', label: 'TCA', icon: <Heart size={14} />, hasData: (ctx) => !!ctx.edScreening },
  { id: 'sports', label: 'Deporte', icon: <Zap size={14} />, hasData: (ctx) => !!ctx.sportsProfile },
  { id: 'precision', label: 'Precisión', icon: <BarChart3 size={14} />, hasData: (ctx) => !!ctx.precisionTargets },
  { id: 'nutrigenomic', label: 'Nutrigenómica', icon: <Dna size={14} />, hasData: (ctx) => !!ctx.nutrigenomicProfile },
  { id: 'microbiome', label: 'Microbioma', icon: <Microscope size={14} />, hasData: (ctx) => !!ctx.microbiomeProfile },
  { id: 'eating', label: 'Conducta', icon: <Utensils size={14} />, hasData: (ctx) => !!ctx.eatingBehavior },
  { id: 'bioactives', label: 'Bioactivos', icon: <Leaf size={14} />, hasData: (ctx) => !!ctx.bioactivesProfile },
  { id: 'planetary', label: 'Planetario', icon: <Leaf size={14} />, hasData: (ctx) => !!ctx.planetaryScore },
];

function StatCard({ label, value, color = 'text-text' }: { label: string; value: string | number | undefined; color?: string }) {
  return (
    <div className="bg-surface-2 rounded-xl p-3 border border-border">
      <div className="text-xs text-text-3 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value ?? '—'}</div>
    </div>
  );
}

function OverviewTab({ ctx }: { ctx: PatientComputedState }) {
  const activeAlerts = ctx.drugNutrientAlerts?.filter((a) => a.status === 'active').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Edad" value={ctx.demographics.age ? `${ctx.demographics.age} años` : undefined} />
        <StatCard
          label="IMC"
          value={ctx.demographics.bmi}
          color={
            !ctx.demographics.bmi ? 'text-text'
              : ctx.demographics.bmi < 18.5 ? 'text-warning'
              : ctx.demographics.bmi < 25 ? 'text-success'
              : ctx.demographics.bmi < 30 ? 'text-warning'
              : 'text-danger'
          }
        />
        <StatCard label="Peso" value={ctx.demographics.weight ? `${ctx.demographics.weight} kg` : undefined} />
        <StatCard
          label="GLIM"
          value={
            ctx.glim
              ? ctx.glim.severity === 'none' ? 'Sin desnutrición' : ctx.glim.severity === 'moderate' ? 'Moderada' : 'Severa'
              : undefined
          }
          color={
            !ctx.glim ? 'text-text'
              : ctx.glim.severity === 'none' ? 'text-success'
              : ctx.glim.severity === 'moderate' ? 'text-warning'
              : 'text-danger'
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">Alertas Droga-Nutriente</h3>
          {activeAlerts > 0 ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-danger-light flex items-center justify-center">
                <AlertTriangle size={18} className="text-danger" />
              </div>
              <div>
                <div className="text-xl font-bold text-danger">{activeAlerts}</div>
                <div className="text-xs text-text-3">alertas activas</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-success">
              <Shield size={16} />
              <span className="text-sm">Sin alertas activas</span>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">Riesgo de Adherencia</h3>
          {ctx.adherenceRisk ? (
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  ctx.adherenceRisk.riskLevel === 'low' ? 'bg-success-light'
                    : ctx.adherenceRisk.riskLevel === 'moderate' ? 'bg-warning-light'
                    : 'bg-danger-light'
                }`}
              >
                <Shield
                  size={18}
                  className={
                    ctx.adherenceRisk.riskLevel === 'low' ? 'text-success'
                      : ctx.adherenceRisk.riskLevel === 'moderate' ? 'text-warning'
                      : 'text-danger'
                  }
                />
              </div>
              <div>
                <div className="text-xl font-bold text-text">{ctx.adherenceRisk.overallScore}%</div>
                <div className="text-xs text-text-3">riesgo {ctx.adherenceRisk.riskLevel}</div>
              </div>
            </div>
          ) : (
            <p className="text-text-3 text-sm">Sin datos</p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">Módulos Activos</h3>
        <div className="flex flex-wrap gap-1.5">
          {TABS.filter((t) => t.id !== 'overview' && t.hasData(ctx)).map((t) => (
            <span key={t.id} className="px-2 py-0.5 bg-primary-light text-primary text-xs rounded-full">
              {t.label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function GenericModuleCard({ title, data }: { title: string; data: unknown }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-text mb-3">{title}</h3>
      <pre className="text-xs text-text-2 bg-surface-2 rounded-lg p-3 overflow-auto max-h-[500px] border border-border whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}

export function ContextHubPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ContextTab>('overview');

  const { data: ctx, isLoading, error } = usePatientContext(patientId);
  const invalidateMutation = useInvalidatePatientContext(patientId!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" className="h-5 w-48" />
        <Card className="p-6">
          <Skeleton variant="rect" className="h-12 w-full mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="card" className="h-24" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link to={`/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
          <ArrowLeft size={14} /> Volver al paciente
        </Link>
        <Card className="p-12 text-center">
          <AlertTriangle size={32} className="text-danger mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">Error al cargar contexto</h3>
          <p className="text-text-3 text-sm mb-4">
            {error instanceof Error ? error.message : 'No se pudo calcular el contexto del paciente.'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => invalidateMutation.mutate()} loading={invalidateMutation.isPending}>
            <RefreshCw size={14} /> Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="space-y-6">
        <Link to={`/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
          <ArrowLeft size={14} /> Volver al paciente
        </Link>
        <Card className="p-12 text-center">
          <Brain size={32} className="text-text-3 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">Sin contexto calculado</h3>
          <p className="text-text-3 text-sm mb-4">Aún no se ha computado el contexto integral para este paciente.</p>
          <Button variant="primary" size="sm" onClick={() => invalidateMutation.mutate()} loading={invalidateMutation.isPending}>
            <RefreshCw size={14} /> Calcular Contexto
          </Button>
        </Card>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab ctx={ctx} />;
      case 'glim':
        return ctx.glim ? <GLIMCard glim={ctx.glim} /> : <GenericModuleCard title="GLIM" data={null} />;
      case 'ncp':
        return ctx.ncp ? <NCPCard ncp={ctx.ncp} /> : <GenericModuleCard title="NCP" data={null} />;
      case 'drugs':
        return ctx.drugNutrientAlerts?.length
          ? <DrugAlertCard alerts={ctx.drugNutrientAlerts} />
          : <GenericModuleCard title="Alertas Droga-Nutriente" data={null} />;
      case 'espen':
        return <GenericModuleCard title="Guías ESPEN" data={ctx.espenTargets} />;
      case 'adherence':
        return <GenericModuleCard title="Riesgo de Adherencia" data={ctx.adherenceRisk} />;
      case 'ed':
        return <GenericModuleCard title="Screening TCA" data={ctx.edScreening} />;
      case 'sports':
        return <GenericModuleCard title="Nutrición Deportiva" data={ctx.sportsProfile} />;
      case 'precision':
        return <GenericModuleCard title="Objetivos de Precisión" data={ctx.precisionTargets} />;
      case 'nutrigenomic':
        return <GenericModuleCard title="Perfil Nutrigenómico" data={ctx.nutrigenomicProfile} />;
      case 'microbiome':
        return <GenericModuleCard title="Perfil Microbioma" data={ctx.microbiomeProfile} />;
      case 'eating':
        return <GenericModuleCard title="Conducta Alimentaria" data={ctx.eatingBehavior} />;
      case 'bioactives':
        return <GenericModuleCard title="Bioactivos" data={ctx.bioactivesProfile} />;
      case 'planetary':
        return <GenericModuleCard title="Impacto Planetario" data={ctx.planetaryScore} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Link to={`/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
        <ArrowLeft size={14} /> Volver al paciente
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text">Context Hub</h1>
            <span className="px-2 py-0.5 bg-surface-3 text-text-3 text-xs rounded-full font-mono">
              v{ctx.version}
            </span>
          </div>
          <p className="text-text-3 text-sm mt-1">
            Último cálculo: {new Date(ctx.lastComputed).toLocaleString('es-ES')}
            {ctx.computationDurationMs > 0 && (
              <span className="ml-2 text-text-3">({ctx.computationDurationMs}ms)</span>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => invalidateMutation.mutate()}
          loading={invalidateMutation.isPending}
          icon={<RefreshCw size={14} />}
        >
          Recalcular
        </Button>
      </div>

      <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const hasData = tab.hasData(ctx);
          return (
            <Button
              key={tab.id}
              size="sm"
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? ''
                  : 'text-text-3 hover:text-text hover:bg-surface-3 border border-transparent whitespace-nowrap'
              }
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id !== 'overview' && hasData && (
                <span className="w-1.5 h-1.5 rounded-full bg-success ml-1 shrink-0" />
              )}
            </Button>
          );
        })}
      </div>

      <div>{renderTabContent()}</div>
    </div>
  );
}
