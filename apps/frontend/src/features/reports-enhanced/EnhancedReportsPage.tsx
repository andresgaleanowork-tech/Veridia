import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import api from '@/lib/api';
import type { Patient } from '@/types';
import { Calendar, Download, FileText, BarChart3, Timeline, Target, Filter, CheckCircle2 } from 'lucide-react';

type ReportTab = 'comparison' | 'timeline' | 'outcomes';

const REPORT_TABS: { key: ReportTab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'comparison', label: 'Comparación', icon: BarChart3 },
  { key: 'timeline', label: 'Timeline', icon: Timeline },
  { key: 'outcomes', label: 'Outcomes', icon: Target },
];

export function EnhancedReportsPage() {
  const { patientId } = useParams<{ patientId?: string }>();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientId || '');
  const [activeTab, setActiveTab] = useState<ReportTab>('comparison');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async (): Promise<Patient[]> => {
      const res = await api.get('/patients');
      return res.data.patients || res.data.data || res.data;
    },
  });

  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ['enhanced-reports', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return api.getEnhancedReportHistory(selectedPatientId);
    },
    enabled: !!selectedPatientId,
  });

  const generateMutation = useMutation({
    mutationFn: (payload: { paciente_id: string; fecha_inicio: string; fecha_fin: string; tipo: ReportTab }) =>
      api.generateEnhancedReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-reports'] });
    },
  });

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  const handleGenerate = () => {
    if (!selectedPatientId || !fechaInicio || !fechaFin) return;
    generateMutation.mutate({
      paciente_id: selectedPatientId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      tipo: activeTab,
    });
  };

  const getReportTitle = (tipo: string) => {
    switch (tipo) {
      case 'comparison': return 'Informe de Comparación';
      case 'timeline': return 'Línea de Tiempo Clínica';
      case 'outcomes': return 'Informe de Outcomes';
      default: return 'Informe';
    }
  };

  const getReportDescription = (tipo: string) => {
    switch (tipo) {
      case 'comparison': return 'Comparativa de dos períodos con evolución antropométrica, analítica y adherencia al plan.';
      case 'timeline': return 'Timeline visual de eventos clínicos: anamnesis, consultas, mediciones, analíticas y cambios de plan.';
      case 'outcomes': return 'Resumen de outcomes clínicos: cambio de peso, mejora de biomarcadores y cumplimiento de objetivos.';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Reportes Avanzados</h1>
          <p className="text-text-3 text-sm mt-1">Informes clínicos avanzados para seguimiento y outcomes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedPatientId}
            onValueChange={setSelectedPatientId}
            options={patients?.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellidos}` })) || []}
            placeholder="Seleccionar paciente..."
            className="w-64"
          />
        </div>
      </div>

      {selectedPatient && (
        <Card className="glass-card">
          <div className="flex items-center gap-4">
            <div className="avatar avatar-md" style={{ background: 'var(--primary)', color: '#fff' }}>
              {selectedPatient.nombre[0]}{selectedPatient.apellidos[0]}
            </div>
            <div>
              <div className="font-semibold text-text">{selectedPatient.nombre} {selectedPatient.apellidos}</div>
              <div className="text-xs text-text-3">
                {selectedPatient.dni} · {selectedPatient.telefono} · {selectedPatient.email}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {REPORT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Report Info Card */}
          <Card className="glass-card">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-light rounded-lg">
                  {activeTab === 'comparison' && <BarChart3 size={24} className="text-primary" />}
                  {activeTab === 'timeline' && <Timeline size={24} className="text-primary" />}
                  {activeTab === 'outcomes' && <Target size={24} className="text-primary" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text">{getReportTitle(activeTab)}</h3>
                  <p className="text-text-3 text-sm mt-1">{getReportDescription(activeTab)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Date Range Picker */}
          <Card className="glass-card">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                <Calendar size={16} />
                Rango de fechas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-3 mb-1 block">Fecha inicio</label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-3 mb-1 block">Fecha fin</label>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!selectedPatientId || !fechaInicio || !fechaFin || generateMutation.isPending}
                className="w-full mt-4"
              >
                <FileText size={16} className="mr-2" />
                Generar informe
              </Button>
            </div>
          </Card>

          {/* Generated Report Display */}
          {generateMutation.data && (
            <Card className="glass-card border-success">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="text-success" size={20} />
                  <h3 className="font-semibold text-text">Informe generado</h3>
                </div>
                <div className="flex gap-3">
                  {generateMutation.data.url_pdf && (
                    <Button variant="secondary" size="sm" onClick={() => window.open(generateMutation.data!.url_pdf, '_blank')}>
                      <Download size={14} className="mr-2" />
                      Descargar PDF
                    </Button>
                  )}
                  {generateMutation.data.url_excel && (
                    <Button variant="secondary" size="sm" onClick={() => window.open(generateMutation.data!.url_excel, '_blank')}>
                      <Download size={14} className="mr-2" />
                      Descargar Excel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Report History */}
          {selectedPatientId && (
            <Card className="glass-card">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-text mb-4">Historial de informes</h3>
                {loadingReports ? (
                  <div className="text-center py-8 text-text-3">Cargando...</div>
                ) : reports && reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map(report => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-primary" />
                          <div>
                            <div className="text-sm font-medium text-text">{getReportTitle(report.tipo)}</div>
                            <div className="text-xs text-text-3">
                              {new Date(report.created_at).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {report.url_pdf && (
                            <Button variant="ghost" size="sm" onClick={() => window.open(report.url_pdf, '_blank')}>
                              <Download size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-3">
                    <Filter size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No hay informes generados para este paciente</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="glass-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-text mb-3">Tipos de informe</h3>
              <div className="space-y-2">
                {REPORT_TABS.map(tab => (
                  <div key={tab.key} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${activeTab === tab.key ? 'bg-primary' : 'bg-border'}`} />
                    <span className={`text-xs ${activeTab === tab.key ? 'font-semibold text-primary' : 'text-text-3'}`}>
                      {tab.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="glass-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-text mb-2">Estadísticas</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-3">Informes generados</span>
                  <span className="font-semibold text-text">{reports?.length || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-3">Último informe</span>
                  <span className="font-semibold text-text">
                    {reports?.[0] ? new Date(reports[0].created_at).toLocaleDateString('es-ES') : '—'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
