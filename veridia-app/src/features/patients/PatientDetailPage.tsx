import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, Activity,
  Ruler, FlaskConical, MessageSquare, AlertTriangle,
  Stethoscope, FileSpreadsheet
} from 'lucide-react';
import api from '@/lib/api';
import type { Patient, ClinicalHistory, Antropometria, Analitica, Appointment } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ReportGeneratorDialog } from '@/features/reports/ReportGeneratorDialog';
import { FitnessConnectButton } from '@/features/fitness/FitnessConnectButton';
import { FitnessSummaryWidget } from '@/features/fitness/FitnessSummaryWidget';
import { ActivityFactorEditor } from '@/features/fitness/ActivityFactorEditor';

type TabId = 'overview' | 'clinical' | 'anthropometry' | 'analytics' | 'appointments' | 'messages' | 'fitness';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Resumen', icon: <FileText size={14} /> },
  { id: 'clinical', label: 'Historia Clínica', icon: <Activity size={14} /> },
  { id: 'anthropometry', label: 'Antropometría', icon: <Ruler size={14} /> },
  { id: 'analytics', label: 'Analíticas', icon: <FlaskConical size={14} /> },
  { id: 'appointments', label: 'Citas', icon: <Calendar size={14} /> },
  { id: 'messages', label: 'Mensajes', icon: <MessageSquare size={14} /> },
  { id: 'fitness', label: 'Fitness', icon: <Stethoscope size={14} /> },
];

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showReportDialog, setShowReportDialog] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async (): Promise<Patient> => {
      const res = await api.get(`/patients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['clinical-history', id],
    queryFn: async (): Promise<ClinicalHistory | null> => {
      const res = await api.get(`/patients/${id}/clinical-history`);
      return res.data.history || res.data;
    },
    enabled: !!id && activeTab === 'clinical',
  });

  const { data: antropometria } = useQuery({
    queryKey: ['anthropometry', id],
    queryFn: async (): Promise<Antropometria[]> => {
      const res = await api.get(`/patients/${id}/anthropometry`);
      return res.data.measurements || res.data.data || res.data || [];
    },
    enabled: !!id && activeTab === 'anthropometry',
  });

  const { data: analiticas } = useQuery({
    queryKey: ['analytics', id],
    queryFn: async (): Promise<Analitica[]> => {
      const res = await api.get(`/patients/${id}/analytics`);
      return res.data.analyses || res.data.data || res.data || [];
    },
    enabled: !!id && activeTab === 'analytics',
  });

  const { data: citas } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: async (): Promise<Appointment[]> => {
      const res = await api.get(`/patients/${id}/appointments`);
      return res.data.appointments || res.data.data || res.data || [];
    },
    enabled: !!id && activeTab === 'appointments',
  });

  const getInitials = (p: Patient) =>
    `${(p.nombre || '')[0] || ''}${(p.apellidos || '')[0] || ''}`.toUpperCase();

  const getAge = (p: Patient) => {
    if (!p.fecha_nacimiento) return null;
    const birth = new Date(p.fecha_nacimiento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" className="h-5 w-48" />
        <Card className="p-6">
          <Skeleton variant="rect" className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="p-12 text-center">
        <AlertTriangle size={32} className="text-warning mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text mb-1">Paciente no encontrado</h3>
        <Link to="/patients" className="text-primary text-sm hover:underline mt-2 inline-block">
          ← Volver a la lista
        </Link>
      </Card>
    );
  }

  const age = getAge(patient);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/patients" className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
        <ArrowLeft size={14} />
        Volver a Pacientes
      </Link>

      {/* Patient Header Card */}
      <Card className="p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shrink-0">
            {getInitials(patient)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text">
                {patient.nombre} {patient.apellidos}
              </h1>
              {!patient.activo && (
                <span className="px-2 py-0.5 bg-surface-3 text-text-3 text-xs font-medium rounded uppercase">
                  Inactivo
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-3">
              {patient.dni && <span>DNI: {patient.dni}</span>}
              {age !== null && <span>{age} años</span>}
              {patient.sexo && <span>{patient.sexo}</span>}
              {patient.telefono && (
                <span className="flex items-center gap-1"><Phone size={12} /> {patient.telefono}</span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1"><Mail size={12} /> {patient.email}</span>
              )}
              {patient.fecha_nacimiento && (
                <span>Nac: {new Date(patient.fecha_nacimiento).toLocaleDateString('es-ES')}</span>
              )}
            </div>
            {patient.motivo_consulta && (
              <p className="mt-2 text-sm text-text-2 bg-surface-2 px-3 py-2 rounded-lg">
                <span className="text-text-3 font-medium">Motivo: </span>
                {patient.motivo_consulta}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
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
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Clinical Quick Actions */}
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Acciones Clínicas Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ClinicalActionLink to={`/clinical/anamnesis/${id}`} icon={<Stethoscope size={16} />} label="Anamnesis" color="text-primary" />
                <ClinicalActionLink to={`/clinical/history/${id}`} icon={<Activity size={16} />} label="Historia Clínica" color="text-accent" />
                <ClinicalActionLink to={`/clinical/anthropometry/${id}`} icon={<Ruler size={16} />} label="Antropometría" color="text-info" />
                <ClinicalActionLink to={`/clinical/analytics/${id}`} icon={<FlaskConical size={16} />} label="Analíticas" color="text-warning" />
              </div>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={() => setShowReportDialog(true)} icon={<FileSpreadsheet size={14} />}>
                  Generar Informe
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard title="Datos Personales" items={[
                { label: 'Profesión', value: patient.profesion },
                { label: 'Nacionalidad', value: patient.nacionalidad },
                { label: 'Estado Civil', value: patient.estado_civil },
                { label: 'Educación', value: patient.educacion },
                { label: 'Grupo Sanguíneo', value: patient.grupo_sanguineo },
                { label: 'Procedencia', value: patient.procedencia },
              ]} />
              <SummaryCard title="Contacto" items={[
                { label: 'Teléfono', value: patient.telefono },
                { label: 'Email', value: patient.email },
                { label: 'Dirección', value: patient.direccion },
              ]} />
              <SummaryCard title="Estado" items={[
                { label: 'Activo', value: patient.activo ? 'Sí' : 'No' },
                { label: 'Creado', value: patient.created_at ? new Date(patient.created_at).toLocaleDateString('es-ES') : null },
                { label: 'Actualizado', value: patient.updated_at ? new Date(patient.updated_at).toLocaleDateString('es-ES') : null },
              ]} />
            </div>
          </div>
        )}

        {activeTab === 'clinical' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Historia Clínica</h2>
            {history ? (
              <div className="space-y-4">
                <ClinicalField label="Antecedentes" value={history.antecedentes} />
                <ClinicalField label="Antecedentes Familiares" value={history.antecedentes_familiares} />
                <ClinicalField label="Alergias" value={history.alergias} />
                <ClinicalField label="Medicación" value={history.medicacion} />
                <ClinicalField label="Suplementación" value={history.suplementacion} />
                <ClinicalField label="Hábitos Tóxicos" value={history.habitos_toxicos} />
                <ClinicalField label="Sueño" value={history.sueno} />
                <ClinicalField label="Estrés" value={history.estres} />
                <ClinicalField label="Ingesta Hídrica" value={history.ingesta_hidrica} />
                <ClinicalField label="Observaciones" value={history.observaciones} />
              </div>
            ) : (
              <p className="text-text-3 text-sm">No hay historia clínica registrada.</p>
            )}
          </Card>
        )}

        {activeTab === 'anthropometry' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Antropometría</h2>
            {antropometria?.length ? (
              <div className="space-y-3">
                {antropometria.map((a) => (
                  <div key={a.id} className="bg-surface-2 rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text">
                        {new Date(a.fecha).toLocaleDateString('es-ES')}
                      </span>
                      {a.metodo && <span className="text-xs text-text-3">{a.metodo}</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {a.peso && <div><span className="text-text-3">Peso:</span> <span className="text-text font-medium">{a.peso} kg</span></div>}
                      {a.altura && <div><span className="text-text-3">Altura:</span> <span className="text-text font-medium">{a.altura} cm</span></div>}
                      {a.imc && <div><span className="text-text-3">IMC:</span> <span className="text-text font-medium">{a.imc}</span></div>}
                      {a.cintura && <div><span className="text-text-3">Cintura:</span> <span className="text-text font-medium">{a.cintura} cm</span></div>}
                      {a.cadera && <div><span className="text-text-3">Cadera:</span> <span className="text-text font-medium">{a.cadera} cm</span></div>}
                      {a.grasa_corporal && <div><span className="text-text-3">Grasa:</span> <span className="text-text font-medium">{a.grasa_corporal}%</span></div>}
                      {a.masa_muscular && <div><span className="text-text-3">Masa muscular:</span> <span className="text-text font-medium">{a.masa_muscular} kg</span></div>}
                      {a.grasa_visceral && <div><span className="text-text-3">Grasa visceral:</span> <span className="text-text font-medium">{a.grasa_visceral}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-3 text-sm">No hay mediciones antropométricas registradas.</p>
            )}
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Analíticas</h2>
            {analiticas?.length ? (
              <div className="space-y-3">
                {analiticas.map((a) => (
                  <div key={a.id} className="bg-surface-2 rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text">
                        {new Date(a.fecha).toLocaleDateString('es-ES')}
                      </span>
                      {a.ayuno !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.ayuno ? 'bg-success-light text-success' : 'bg-surface-3 text-text-3'}`}>
                          {a.ayuno ? 'En ayunas' : 'Sin ayuno'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {a.marcadores?.map((m, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-text-3">{m.nombre}:</span>{' '}
                          <span className={`font-medium ${m.alerta === 'peligro' ? 'text-danger' : m.alerta === 'advertencia' ? 'text-warning' : 'text-text'}`}>
                            {m.valor} {m.unidad || ''}
                          </span>
                          {m.referencia && <span className="text-[10px] text-text-3 ml-1">({m.referencia})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-3 text-sm">No hay analíticas registradas.</p>
            )}
          </Card>
        )}

        {activeTab === 'appointments' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Citas</h2>
            {citas?.length ? (
              <div className="space-y-2">
                {citas.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 bg-surface-2 rounded-lg p-3 border border-border">
                    <div className="text-center min-w-[48px]">
                      <div className="text-xs text-text-3">{new Date(c.fecha).toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                      <div className="text-lg font-bold text-text">{new Date(c.fecha).getDate()}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text">{c.asunto || c.tipo || 'Consulta'}</div>
                      <div className="text-xs text-text-3">{c.hora} • {c.duracion || 30} min</div>
                    </div>
                    <StatusBadge status={c.estado} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-3 text-sm">No hay citas registradas.</p>
            )}
          </Card>
        )}

        {activeTab === 'messages' && (
          <Card className="p-6 text-center">
            <MessageSquare size={32} className="text-text-3 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text mb-1">Mensajes</h3>
            <p className="text-text-3 text-sm">Módulo de mensajería — Phase 3</p>
          </Card>
        )}

        {activeTab === 'fitness' && id && (
          <div className="space-y-4">
            <FitnessConnectButton />
            <FitnessSummaryWidget patientId={id} />
            <ActivityFactorEditor patientId={id} currentFactor={1.55} currentLabel="moderate" />
          </div>
        )}
      </div>
      {showReportDialog && patient && (
        <ReportGeneratorDialog open={showReportDialog} onClose={() => setShowReportDialog(false)} patient={patient} />
      )}
    </div>
  );
}

function SummaryCard({ title, items }: { title: string; items: { label: string; value?: string | null }[] }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-text mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item) =>
          item.value ? (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-text-3">{item.label}</span>
              <span className="text-text font-medium">{item.value}</span>
            </div>
          ) : null
        )}
        {items.every((i) => !i.value) && (
          <p className="text-text-3 text-xs">Sin datos</p>
        )}
      </div>
    </Card>
  );
}

function ClinicalField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-text-3 uppercase tracking-wide mb-1">{label}</h4>
      <p className="text-sm text-text bg-surface-2 rounded-lg px-3 py-2 min-h-[36px]">
        {value || <span className="text-text-3 italic">No registrado</span>}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pendiente: 'bg-warning-light text-warning',
    Confirmada: 'bg-info-light text-info',
    Realizada: 'bg-success-light text-success',
    'No asistió': 'bg-danger-light text-danger',
    Cancelada: 'bg-surface-3 text-text-3',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors[status] || 'bg-surface-3 text-text-3'}`}>
      {status}
    </span>
  );
}

function ClinicalActionLink({ to, icon, label, color }: { to: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2.5 bg-surface-2 border border-border rounded-lg hover:border-primary/30 hover:bg-surface-3 transition-all group"
    >
      <div className={color}>{icon}</div>
      <span className="text-xs font-medium text-text group-hover:text-primary transition-colors">{label}</span>
    </Link>
  );
}
