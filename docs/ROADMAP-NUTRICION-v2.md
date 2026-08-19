# ROADMAP v2 — Mejoras del Programa de Nutrición
## Análisis del documento de Antonella

### PRIORIDAD ALTA (Impacto directo en flujo clínico)

#### 1. ANAMNESIS — Reorganización
- [ ] Mover SISTEMAS antes de la anamnesis (reordenar steps)
- [ ] Permitir selección múltiple de patologías en cada sistema (ej: HTA + dislipemia en cardiovascular)
- [ ] Generar preguntas específicas por patología seleccionada (ej: DBT → hemoglobina glicosilada, hipoglucemias)
- [ ] Campo "Otros registros" para ingreso manual libre
- [ ] RECOMENDACIONES auto-generadas según patología (basadas en ESPEN):
  - Recomendaciones generales
  - Alimentos a incorporar / evitar
  - Modos de cocción a incorporar / evitar
  - Pautas higiénico/dietéticas
  - Editables para personalización

#### 2. ANALÍTICAS — Nuevos índices clínicos
- [ ] PCR (Proteína C Reactiva)
- [ ] Índice HOMA-IR (resistencia insulínica)
- [ ] Cociente TG/c-HDL
- [ ] Índice de Hígado Graso (FLI) — requiere: IMC, cintura, triglicéridos, GGT
- [ ] Índice FIB-4 (fibrosis hepática) — requiere: edad, AST, ALT, plaquetas
- [ ] Auto-cálculo de estos índices a partir de los biomarcadores registrados

#### 3. MEDICIONES — Ampliaciones
- [ ] Índice Cintura-Talla (ICT) — ya tiene cintura y altura, solo calcular
- [ ] Pliegues cutáneos: bicipital, tricipital, subescapular, suprailiaco
- [ ] Resultado de dinamometría (biomarcador de calidad muscular)
- [ ] Fix: poder editar mediciones ya guardadas

#### 4. FÓRMULA / DESARROLLADA — Déficit calórico
- [ ] Opción de déficit calórico (restar kcal o % del VCT)
- [ ] Eliminar "Obesidad/Sobrepeso" duplicado en patologías
- [ ] Añadir más patologías: EPOC, etc.
- [ ] Distribución de macros según ESPEN por patología (ej: cirrosis 35kcal/kg, EPOC ↑grasas ↓HC)
- [ ] Equivalencias de alimentos (ej: 200g fruta = 1 manzana + ½ taza arándanos)
- [ ] Drag & drop de alimentos entre comidas
- [ ] Selección múltiple en sistemas (poder elegir HTA + dislipemia juntas)

### PRIORIDAD MEDIA (Mejoras de experiencia)

#### 5. WIZARD RÁPIDO — Bugs
- [ ] El plan creado no se guarda al salir
- [ ] Las calorías no coinciden con la desarrollada
- [ ] Clarificar dónde se ve el plan después de crearlo

#### 6. BASE DE DATOS ALIMENTOS
- [ ] Filtro por nutrientes (macro y micro): ricos en magnesio, omega 3, hierro, bajos en purinas, baja carga glucémica
- [ ] Sección de suplementos con dosis y mg
- [ ] Fix: semillas de chía no aparecen en USDA ni BEDCA
- [ ] Ya existe "Alimento custom" — verificar que funciona correctamente

#### 7. NAVEGACIÓN — Reorganización sidebar
- [ ] Agrupar: Nutrición Clínica + Restauración Colectiva + Soporte Nutricional juntas

#### 8. PLAN ALIMENTARIO
- [ ] Recomendaciones generales dentro del plan (según patología)
- [ ] Pestaña ESPEN accesible desde el plan

### PRIORIDAD BAJA (Expansión avanzada)

#### 9. SOPORTE NUTRICIONAL — Expansión por patologías
- [ ] Dividir por patologías (pancreatitis, cáncer, quemado, etc.)
- [ ] Recomendaciones ESPEN dentro de cada patología
- [ ] Flujo completo: cribado → diagnóstico → indicación → prescripción → monitorización
- [ ] Herramientas: NRS-2002, MUST, MNA, SNAQ, MST (ya tiene NRS-2002 y GLIM)
- [ ] Criterios GLIM con fenotípicos + etiológicos
- [ ] Algoritmo de vía: oral → enteral → parenteral
- [ ] NE: fórmulas, vías, velocidades (ya parcialmente implementado)
- [ ] NP: composición, osmolaridad, velocidad (ya parcialmente implementado)
- [ ] Micronutrientes ESPEN 2022
- [ ] Monitorización con frecuencias
- [ ] Alertas de complicaciones (aspiración, síndrome realimentación, etc.)
- [ ] Consideraciones éticas (consentimiento, proporcionalidad)
