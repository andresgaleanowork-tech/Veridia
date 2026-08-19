import type { SystemSection } from './AnamnesisPage';

export const ANAMNESIS_SYSTEMS: SystemSection[] = [
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