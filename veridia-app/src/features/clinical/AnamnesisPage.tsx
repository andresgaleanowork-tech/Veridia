import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import type { Anamnesis, AnamnesisFormData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

interface SystemSection {
  id: string;
  label: string;
  icon: string;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'yesno' | 'number';
  options?: string[];
  placeholder?: string;
}

const SYSTEMS: SystemSection[] = [
  {
    id: 'general',
    label: 'Datos Generales',
    icon: '🧑',
    questions: [
      { id: 'motivo_consulta', text: 'Motivo de consulta', type: 'textarea', placeholder: 'Describir el motivo principal...' },
      { id: 'sintomas_actuales', text: 'Síntomas actuales', type: 'textarea', placeholder: 'Síntomas que presenta actualmente...' },
      { id: 'tiempo_sintomas', text: 'Tiempo de evolución', type: 'select', options: ['< 1 semana', '1-4 semanas', '1-3 meses', '3-6 meses', '6-12 meses', '> 1 año'] },
    ],
  },
  {
    id: 'antecedentes',
    label: 'Antecedentes',
    icon: '📋',
    questions: [
      { id: 'enfermedades_previas', text: 'Enfermedades previas', type: 'textarea', placeholder: 'Diabetes, hipertensión, cardiopatías...' },
      { id: 'cirugias', text: 'Cirugías previas', type: 'textarea', placeholder: 'Cirugías y fechas aproximadas...' },
      { id: 'medicacion_actual', text: 'Medicación actual', type: 'textarea', placeholder: 'Fármacos, dosis, frecuencia...' },
      { id: 'tratamientos_previos', text: 'Tratamientos nutricionales previos', type: 'textarea', placeholder: 'Dietas, suplementos, resultados...' },
    ],
  },
  {
    id: 'digestivo',
    label: 'Aparato Digestivo',
    icon: '🫁',
    questions: [
      { id: 'apetito', text: 'Apetito', type: 'select', options: ['Normal', 'Aumentado', 'Disminuido', 'Variable', 'Anorexia'] },
      { id: 'alimentacion_habitual', text: 'Alimentación habitual', type: 'textarea', placeholder: 'Describe tu alimentación típica...' },
      { id: 'comidas_dia', text: 'Número de comidas al día', type: 'number' },
      { id: 'horarios_irregulares', text: 'Horarios irregulares', type: 'yesno' },
      { id: 'intolerancias', text: 'Intolerancias alimentarias', type: 'textarea', placeholder: 'Lactosa, gluten, fructosa...' },
      { id: 'alergias_alimentarias', text: 'Alergias alimentarias', type: 'textarea', placeholder: 'Alimentos que provocan reacciones...' },
      { id: 'digestion', text: 'Digestión', type: 'select', options: ['Normal', 'Lenta', 'Rápida', 'Pesada', 'Con pirosis', 'Con distensión', 'Con gases'] },
      { id: 'deposiciones', text: 'Frecuencia de deposiciones', type: 'select', options: ['< 3/semana', '3-7/semana', '1-3/día', '> 3/día'] },
      { id: 'consistencia_heces', text: 'Consistencia de heces', type: 'select', options: ['Duras (Bristol 1-2)', 'Normales (Bristol 3-4)', 'Blandas (Bristol 5)', 'Líquidas (Bristol 6-7)'] },
      { id: 'nauseas', text: 'Náuseas/vómitos', type: 'yesno' },
    ],
  },
  {
    id: 'metabolico',
    label: 'Metabolismo y Endocrino',
    icon: '⚡',
    questions: [
      { id: 'peso_actual', text: 'Peso actual (kg)', type: 'number' },
      { id: 'peso_deseado', text: 'Peso deseado (kg)', type: 'number' },
      { id: 'peso_estable', text: '¿El peso es estable?', type: 'select', options: ['Estable', 'Subiendo', 'Bajando'] },
      { id: 'cambios_peso_recientes', text: 'Cambios de peso recientes', type: 'textarea', placeholder: 'Cuánto y en cuánto tiempo...' },
      { id: 'tiroides', text: 'Problemas de tiroides', type: 'yesno' },
      { id: 'diabetes', text: 'Diabetes', type: 'yesno' },
      { id: 'colesterol', text: 'Colesterol alterado', type: 'yesno' },
    ],
  },
  {
    id: 'cardiovascular',
    label: 'Sistema Cardiovascular',
    icon: '❤️',
    questions: [
      { id: 'hipertension', text: 'Hipertensión', type: 'yesno' },
      { id: 'cardiopatia', text: 'Cardiopatía', type: 'yesno' },
      { id: 'edemas', text: 'Edemas', type: 'yesno' },
      { id: 'disnea', text: 'Disnea (dificultad para respirar)', type: 'select', options: ['No', 'Al esfuerzo', 'En reposo', 'Nocturna'] },
    ],
  },
  {
    id: 'actividad',
    label: 'Actividad Física y Sueño',
    icon: '🏃',
    questions: [
      { id: 'actividad_fisica', text: 'Nivel de actividad física', type: 'select', options: ['Sedentario', 'Ligero (1-2d/sem)', 'Moderado (3-4d/sem)', 'Intenso (5-6d/sem)', 'Muy intenso (atleta)'] },
      { id: 'tipo_ejercicio', text: 'Tipo de ejercicio', type: 'textarea', placeholder: 'Caminar, correr, gimnasio, natación...' },
      { id: 'horas_sueno', text: 'Horas de sueño por noche', type: 'number' },
      { id: 'calidad_sueno', text: 'Calidad del sueño', type: 'select', options: ['Mala', 'Regular', 'Buena', 'Muy buena'] },
      { id: 'siestas', text: 'Realiza siestas', type: 'yesno' },
    ],
  },
  {
    id: 'toxicos',
    label: 'Hábitos Tóxicos',
    icon: '🍷',
    questions: [
      { id: 'tabaco', text: 'Tabaco', type: 'select', options: ['No fuma', 'Exfumador', '< 10 cig/día', '10-20 cig/día', '> 20 cig/día'] },
      { id: 'alcohol', text: 'Alcohol', type: 'select', options: ['No consume', 'Ocasional (1-2u/semana)', 'Moderado (3-5u/semana)', 'Alto (> 7u/semana)'] },
      { id: 'otras_sustancias', text: 'Otras sustancias', type: 'textarea', placeholder: 'Cannabis, cocaína, etc.' },
    ],
  },
  {
    id: 'psicologico',
    label: 'Estado Psicológico',
    icon: '🧠',
    questions: [
      { id: 'estado_animo', text: 'Estado de ánimo', type: 'select', options: ['Eutímico', 'Ansioso', 'Deprimido', 'Irritable', 'Variable'] },
      { id: 'estres_percepcion', text: 'Percepción de estrés', type: 'select', options: ['Nulo', 'Leve', 'Moderado', 'Alto', 'Muy alto'] },
      { id: 'ansiedad_comida', text: 'Ansiedad hacia la comida', type: 'yesno' },
      { id: 'conductas_alimentarias', text: 'Conductas alimentarias extremas', type: 'select', options: ['No', 'Atracones', 'Vómitos autoinducidos', 'Restrictivo', 'Laxantes'] },
      { id: 'apoyo_social', text: 'Red de apoyo social', type: 'select', options: ['Fuerte', 'Moderado', 'Débil', 'Aislado'] },
    ],
  },
  {
    id: 'otras',
    label: 'Otras Consideraciones',
    icon: '📝',
    questions: [
      { id: 'viajes_recientes', text: 'Viajes recientes', type: 'textarea', placeholder: 'Destino y duración...' },
      { id: 'objetivos', text: 'Objetivos del paciente', type: 'textarea', placeholder: 'Qué espera conseguir...' },
      { id: 'disponibilidad_cocina', text: 'Disponibilidad para cocinar', type: 'select', options: ['Mucho tiempo', 'Tiempo moderado', 'Poco tiempo', 'Casi ninguno'] },
      { id: 'presupuesto_alimentario', text: 'Presupuesto alimentario', type: 'select', options: ['Bajo', 'Moderado', 'Alto', 'Sin restricción'] },
      { id: 'observaciones', text: 'Observaciones adicionales', type: 'textarea' },
    ],
  },
];

export function AnamnesisPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set(['general']));
  const [newFlag, setNewFlag] = useState('');

  const { register, handleSubmit, setValue, watch } = useForm<AnamnesisFormData>({
    defaultValues: {
      respuestas: {},
      red_flags: [],
    },
  });

  const responses = (watch('respuestas') ?? {}) as Record<string, unknown>;
  const redFlags = (watch('red_flags') ?? []) as string[];

  const { data: existingAnamnesis, isLoading } = useQuery({
    queryKey: ['anamnesis', patientId],
    queryFn: async (): Promise<Anamnesis[]> => {
      const res = await api.get(`/clinical/anamnesis/${patientId}`);
      return res.data || [];
    },
    enabled: !!patientId,
  });

  const latestAnamnesis = existingAnamnesis?.[0];

  const mutation = useMutation({
    mutationFn: async (data: AnamnesisFormData) => {
      const payload = {
        paciente_id: patientId,
        sistemas: [...expandedSystems],
        respuestas: data['respuestas'] || {},
        red_flags: data['red_flags'] || [],
      };
      if (latestAnamnesis?.id) {
        return api.put(`/clinical/anamnesis/${latestAnamnesis.id}`, {
          sistemas: payload.sistemas,
          respuestas: payload['respuestas'],
          red_flags: payload['red_flags'],
        });
      }
      return api.post('/clinical/anamnesis', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis', patientId] });
    },
  });

  const toggleSystem = (id: string) => {
    setExpandedSystems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setResponse = (qId: string, value: unknown) => {
    setValue('respuestas', { ...responses, [qId]: value });
  };

  const addRedFlag = () => {
    if (newFlag.trim()) {
      setValue('red_flags', [...redFlags, newFlag.trim()]);
      setNewFlag('');
    }
  };

  const removeRedFlag = (index: number) => {
    setValue('red_flags', redFlags.filter((_, i) => i !== index));
  };

  const onSubmit = (data: AnamnesisFormData) => {
    mutation.mutate(data);
  };

  const answeredCount = Object.keys(responses).filter((k) => { const v = responses[k]; return v !== "" && v !== null && v !== undefined; }).length;
  const totalQuestions = SYSTEMS.reduce((sum, s) => sum + s.questions.length, 0);

  if (isLoading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-text-3 text-sm">Cargando anamnesis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={`/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-text-3 hover:text-text text-sm transition-colors">
        <ArrowLeft size={14} /> Volver al paciente
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Anamnesis</h1>
          <p className="text-text-3 text-sm mt-1">
            Exploración clínica por sistemas — {answeredCount}/{totalQuestions} respondidas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {latestAnamnesis && (
            <span className="text-xs text-text-3 bg-surface-2 px-3 py-1 rounded-full">
              Última: {new Date(latestAnamnesis.created_at).toLocaleDateString('es-ES')}
            </span>
          )}
          <Button
            onClick={() => handleSubmit(onSubmit)()}
            disabled={mutation.isPending}
            icon={<Save size={14} />}
          >
            Guardar Anamnesis
          </Button>
        </div>
      </div>

      {mutation.isError && (
        <div className="flex items-center gap-2 p-3 bg-danger-light border border-danger/20 rounded-lg text-danger text-sm">
          <AlertTriangle size={14} /> Error al guardar. Intenta de nuevo.
        </div>
      )}

      {mutation.isSuccess && (
        <div className="p-3 bg-success-light border border-success/20 rounded-lg text-success text-sm flex items-center gap-2">
          <CheckCircle2 size={14} /> Anamnesis guardada correctamente.
        </div>
      )}

      {/* Progress bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between text-xs text-text-3 mb-2">
          <span>Progreso de la anamnesis</span>
          <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Red Flags */}
      <div className="glass-card p-4 border-warning/20">
        <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <AlertCircle size={14} className="text-warning" />
          Red Flags Clínicos
        </h3>
        <div className="flex gap-2 mb-2">
          <Input
            value={newFlag}
            onChange={(e) => setNewFlag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRedFlag()}
            placeholder="Añadir señal de alarma..."
            className="flex-1"
          />
          <Button onClick={addRedFlag} variant="warning">Añadir</Button>
        </div>
        {redFlags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {redFlags.map((flag, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-danger/10 text-danger text-xs rounded-full border border-danger/20">
                {flag}
                <button onClick={() => removeRedFlag(i)} aria-label="Eliminar red flag" className="hover:text-danger/60">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Systems accordion */}
      <div className="space-y-3">
        {SYSTEMS.map((system) => {
          const isExpanded = expandedSystems.has(system.id);
          const systemAnswered = system.questions.filter((q) => {
            const v = responses[q.id] as unknown;
            return v !== '' && v !== null && v !== undefined;
          }).length;

          return (
            <div key={system.id} className="glass-card overflow-hidden">
              <button
                onClick={() => toggleSystem(system.id)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{system.icon}</span>
                  <span className="font-semibold text-text text-sm">{system.label}</span>
                  <span className="text-[10px] bg-surface-3 text-text-3 px-2 py-0.5 rounded-full">
                    {systemAnswered}/{system.questions.length}
                  </span>
                </div>
                {isExpanded ? <ChevronDown size={16} className="text-text-3" /> : <ChevronRight size={16} className="text-text-3" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                  {system.questions.map((q) => (
                    <div key={q.id}>
                      <label className="text-xs font-medium text-text-3 mb-1.5 block">{q.text}</label>
                      {q.type === 'text' && (
                        <Input
                          {...register(`respuestas.${q.id}`)}
                          placeholder={q.placeholder}
                        />
                      )}
                      {q.type === 'textarea' && (
                        <Textarea
                          {...register(`respuestas.${q.id}`)}
                          placeholder={q.placeholder}
                        />
                      )}
                      {q.type === 'number' && (
                        <Input
                          type="number"
                          {...register(`respuestas.${q.id}`, { valueAsNumber: true })}
                        />
                      )}
                      {q.type === 'select' && (
                        <Select
                          value={(responses[q.id] as string) || ''}
                          onValueChange={(val) => setResponse(q.id, val)}
                          options={[{ value: '', label: 'Seleccionar...' }, ...(q.options?.map((opt) => ({ value: opt, label: opt })) || [])]}
                        />
                      )}
                      {q.type === 'yesno' && (
                        <div className="flex gap-2">
                          {['Sí', 'No'].map((opt) => (
                            <Button
                              key={opt}
                              type="button"
                              variant={(responses[q.id] as string) === opt ? (opt === 'Sí' ? 'primary' : 'secondary') : 'ghost'}
                              onClick={() => setResponse(q.id, opt)}
                            >
                              {opt}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
