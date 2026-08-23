import type { SystemSection } from './AnamnesisPage';

export const ANAMNESIS_SYSTEMS: SystemSection[] = [
  {
    id: 'general',
    label: 'Datos Generales',
    icon: '👤',
    questions: [
      { id: 'motivo_consulta', text: 'Motivo de consulta', type: 'textarea', placeholder: 'Describa el motivo de su visita...' },
      { id: 'antecedentes', text: 'Antecedentes personales', type: 'textarea', placeholder: 'Enfermedades, cirugías, medicaciones...' },
      { id: 'alergias', text: 'Alergias', type: 'textarea', placeholder: 'Alimentarias, medicamentosas...' },
    ],
  },
  {
    id: 'nutricional',
    label: 'Historia Nutricional',
    icon: '🍽️',
    questions: [
      { id: 'habitos_alimentarios', text: 'Hábitos alimentarios', type: 'textarea', placeholder: 'Frecuencia, horarios, composición...' },
      { id: 'restricciones', text: 'Restricciones alimentarias', type: 'textarea', placeholder: 'Voluntarias o médicas...' },
      { id: 'suplementacion', text: 'Suplementación actual', type: 'textarea', placeholder: 'Vitaminas, minerales...' },
    ],
  },
  {
    id: 'actividad_fisica',
    label: 'Actividad Física',
    icon: '🏃',
    questions: [
      { id: 'tipo_ejercicio', text: 'Tipo de ejercicio', type: 'select', options: ['Sedentario', 'Ligero', 'Moderado', 'Intenso', 'Muy intenso'] },
      { id: 'frecuencia_ejercicio', text: 'Frecuencia semanal', type: 'select', options: ['1-2 veces', '3-4 veces', '5-6 veces', 'Diario'] },
      { id: 'duracion_ejercicio', text: 'Duración promedio (min)', type: 'number' },
    ],
  },
  {
    id: 'sueno',
    label: 'Sueño y Descanso',
    icon: '😴',
    questions: [
      { id: 'horas_sueno', text: 'Horas de sueño promedio', type: 'number' },
      { id: 'calidad_sueno', text: 'Calidad del sueño', type: 'select', options: ['Mala', 'Regular', 'Buena', 'Muy buena'] },
      { id: 'problemas_sueno', text: 'Problemas de sueño', type: 'textarea', placeholder: 'Insomnio, apneas...' },
    ],
  },
  {
    id: 'estres',
    label: 'Estrés y Bienestar',
    icon: '🧠',
    questions: [
      { id: 'nivel_estres', text: 'Nivel de estrés', type: 'select', options: ['Bajo', 'Moderado', 'Alto', 'Muy alto'] },
      { id: 'fuente_estres', text: 'Fuente principal de estrés', type: 'textarea' },
      { id: 'estrategias_coping', text: 'Estrategias de afrontamiento', type: 'textarea' },
    ],
  },
];
