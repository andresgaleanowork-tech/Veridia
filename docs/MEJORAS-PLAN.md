# 🔬 Plan de Mejoras — Veridia HealthTech v5.1 → v5.2
## Auditoría 25-06-2026 · 30 módulos · 11,958 líneas · 520 funciones

---

## 🔴 PRIMER GRADO (Impacto directo en usabilidad — Bugs funcionales y carencias críticas)

### GENERALES (aplican a todo el sistema)
| # | Mejora | Detalle |
|---|--------|---------|
| G1 | **Botón "Cancelar" inconsistente** | Algunos modales usan `t('cancel')` (correcto), otros "Volver", "Cerrar" u omiten el botón. Unificar TODOS a `t('cancel')` |
| G2 | **Botón cerrar modal (✕) inconsistente** | Algunos usan `IC.x` (SVG), otros usan `✕` texto plano, otros `×`. Unificar a `IC.x` en todos |
| G3 | **Toast sin icon en type='success'** | El toast de éxito muestra `IC.chk` pero el wrapper `toast()` ya lo incluye — cuando se pasa a `toast('...','success')` funciona pero el toast de tipo genérico (sin 2° param) NO sincroniza a Firebase. Verificar flujo |
| G4 | **Empty state genérico poco informativo** | Cuando un módulo no tiene datos, el empty state es muy plano. Añadir botón de acción contextual + ilustración mínima |
| G5 | **openModal con firma inconsistente** | `openModal(html, isLarge)` vs `openModal(title, body, footer, opts)` — la firma varía entre módulos. Estandarizar |
| G6 | **Confirmación antes de navegar con datos sin guardar** | No hay guard de "datos no guardados" al cambiar de módulo mientras se edita un formulario |
| G7 | **Breadcrumb / contexto del paciente** | No se ve claro qué paciente está seleccionado en módulos que dependen de selPat |

### DASHBOARD (177 líneas · 5 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| D1 | **Integrar stats de Restauración Colectiva** | Dashboard no muestra ningún KPI de RC (centros, comensales, menús, alertas APPCC). Añadir cards |
| D2 | **Widget "Últimas acciones"** | Timeline con las últimas 5 acciones del usuario (citas, notas, alertas revisadas) |
| D3 | **Widget "Alertas urgentes"** | Si hay alertas pendientes graves, mostrar banner rojo en dashboard |

### AGENDA (465 líneas · 23 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| A1 | **Hora fin de cita no visible** | La cita solo muestra hora inicio + duración, pero no calcula hora fin visible |
| A2 | **Conflicto de horarios** | No valida si una cita nueva se solapa con otra existente en el mismo horario |
| A3 | **Color de cita por tipo** | Los colores de cita (first, review, online) se asignan pero no todos tienen CSS definido |

### PACIENTES (55 líneas · 7 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| P1 | **Foto del paciente** | Campo base64 preparado pero sin UI de upload. Añadir botón de foto |
| P2 | **Teléfono con click-to-call** | Enlace `tel:` en la tabla de pacientes |
| P3 | **Email con click-to-mail** | Enlace `mailto:` en la tabla |
| P4 | **Último acceso / última cita visible** | Añadir columna con fecha de última interacción |

### HISTORIA CLÍNICA (544 líneas · 8 funciones)  
| # | Mejora | Detalle |
|---|--------|---------|
| H1 | **Tab "Evolución" — gráfico de peso sin tendencia** | El gráfico SVG muestra peso pero no línea de tendencia (regresión lineal) |
| H2 | **Tab "Consultas" — sin timeline visual** | Las consultas se listan pero sin timeline cronológico visual |
| H3 | **Tab "Plan" — sin vista directa del plan actual** | Requiere ir a módulo Planes por separado |

### FÓRMULA CLÍNICA (77 líneas · 3 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| F1 | **No recalcula al cambiar inputs** | Hay que hacer clic en "Calcular" — debería ser live/reactivo |
| F2 | **Sin historial visible inline** | El historial de fórmulas se guarda pero no se muestra en la misma pantalla |
| F3 | **Sin gráfico comparativo** | La función `renderFormulaComparison` existe pero no se invoca desde el render principal |

### PLANES ALIMENTARIOS (600 líneas · 26 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| PL1 | **Wizard — barra de progreso** | El wizard de nuevo plan no tiene indicador de paso actual |
| PL2 | **Sin PDF export del plan individual** | generatePlanPDF existe en clinical-tools pero no es accesible desde el módulo planes directamente |
| PL3 | **Adherencia — sin gráfico temporal** | calcAdherencia devuelve % pero no hay gráfico de evolución |

### FACTURACIÓN (356 líneas · 25 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| FA1 | **Sin búsqueda rápida por número de factura** | El filtro busca por paciente y estado pero no por número |
| FA2 | **Descuento global vs por línea** | El descuento se aplica globalmente a todas las líneas, no permite descuento individual |
| FA3 | **Sin totales acumulados en vista lista** | La lista de facturas no muestra el total general facturado |

### RESTAURACIÓN COLECTIVA (1566 líneas · 62 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| RC1 | **Ficha técnica de plato — sin integración BEDCA** | rcFichaPlato muestra alérgenos e IDDSI pero no tiene los valores nutricionales de BEDCA |
| RC2 | **Escalado — sin auto-detect factor corrección** | Si el ingrediente no coincide exacto con FACTORES_MERMA, factor = 1.0 sin aviso |
| RC3 | **APPCC — sin foto/evidencia adjunta** | Los registros APPCC no permiten adjuntar foto de temperatura/termómetro |

### IA COPILOT (112 líneas · 8 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| IA1 | **Sin indicador de "pensando"** | Al enviar prompt no hay spinner visible mientras Gemini responde |
| IA2 | **Historial no scrollea al último mensaje** | El chat no hace auto-scroll al recibir respuesta |
| IA3 | **Sin sugerencias pre-armadas por contexto** | Los quick prompts son genéricos, no se adaptan al paciente seleccionado |

### MENSAJERÍA (206 líneas · 9 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| M1 | **Sin notificación sonora/visual de mensaje nuevo** | Los mensajes nuevos no generan notificación beyond el badge |
| M2 | **Sin indicador de "escribiendo..."** | No hay feedback de tipeo en tiempo real |
| M3 | **Sin búsqueda en historial de chat** | No se puede buscar texto dentro de conversaciones |

### SETTINGS (155 líneas · 7 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| S1 | **Sin preview de color del tema** | Al cambiar color, no hay preview instantáneo — se aplica al guardar |
| S2 | **Sin export de configuración** | No se puede exportar/importar la config de la clínica |

---

## 🟡 SEGUNDO GRADO (Mejoras de UX, polish y features adicionales)

### GENERALES
| # | Mejora | Detalle |
|---|--------|---------|
| G8 | **Skeleton loading** | Reemplazar el loading genérico por skeleton screens por módulo |
| G9 | **Keyboard shortcuts panel** | Mostrar `?` para ver todos los atajos de teclado |
| G10 | **Notificaciones in-app** | Centro de notificaciones (campana) con alertas, recordatorios, citas |
| G11 | **Modo offline banner** | Detectar pérdida de conexión y mostrar banner "Sin conexión — datos locales" |
| G12 | **Animaciones de transición entre módulos** | Fade-in suave al cambiar de módulo (actualmente solo clase fade-in) |
| G13 | **Paginación global mejorada** | Añadir "ir a página X" y "items por página" configurable |
| G14 | **Export PDF universal** | Botón de export en cada módulo que genera PDF con branding de la clínica |

### DASHBOARD
| # | Mejora | Detalle |
|---|--------|---------|
| D4 | **Gráfico de ingresos por mes** | Chart de barras con ingresos mensuales de facturación |
| D5 | **Quicklinks personalizables** | Accesos directos configurables por el usuario |
| D6 | **Pacientes sin cita próxima** | Lista de pacientes activos que no tienen cita programada |

### AGENDA
| # | Mejora | Detalle |
|---|--------|---------|
| A4 | **Vista "Solo hoy" mejorada** | Timeline vertical con slots de 15/30 min visuales |
| A5 | **Filtro por profesional** | Si hay multi-usuario, filtrar citas por quién las atiende |
| A6 | **Sincronización Google Calendar** | Preparar estructura para futuro sync (iCal export por ahora) |
| A7 | **Recordatorio WhatsApp (link)** | Generar deep link de WhatsApp con texto de recordatorio |

### HISTORIA CLÍNICA
| # | Mejora | Detalle |
|---|--------|---------|
| H4 | **Tab "Documentos"** | Nueva tab para adjuntar PDFs de informes, derivaciones, recetas médicas |
| H5 | **Tab "Farmacología"** | Registro de medicamentos actuales con interacciones fármaco-nutriente |
| H6 | **Resumen clínico exportable** | One-page summary con todos los datos del paciente para derivación |
| H7 | **Barra de progreso de objetivos** | Visualizar meta de peso vs actual con % de avance |

### ANTROPOMETRÍA
| # | Mejora | Detalle |
|---|--------|---------|
| AN1 | **Gráfico composición corporal (donut)** | Donut de masa grasa vs masa muscular vs otros |
| AN2 | **Percentiles OMS** | Para pacientes pediátricos, mostrar curvas de crecimiento P3-P97 |
| AN3 | **Comparador visual entre mediciones** | Dos mediciones lado a lado con delta visual |

### ANALÍTICAS
| # | Mejora | Detalle |
|---|--------|---------|
| AL1 | **Gráfico de tendencia por marcador** | Seleccionar un biomarcador y ver su evolución temporal |
| AL2 | **Importar desde CSV/PDF** | Parsear resultados de laboratorio desde archivo |
| AL3 | **Alertas automáticas por fuera de rango** | Generar alerta clínica automática si un marcador está fuera de rango crítico |

### SOPORTE NUTRICIONAL (1642 líneas · 64 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| SN1 | **Print de prescripción formateada** | Export/print de la prescripción NE/NP con formato hospitalario |
| SN2 | **Gráfico de progresión UCI** | SVG chart de progresión calórica 7 días |
| SN3 | **Alarmas sonoras de refeeding** | Alert sonoro cuando se detecta síndrome de realimentación |

### DESARROLLADA
| # | Mejora | Detalle |
|---|--------|---------|
| DE1 | **Guardar como plantilla** | Guardar una fórmula desarrollada completa como template reutilizable |
| DE2 | **Preview de minuta antes de exportar** | Vista previa formateada antes del PDF |
| DE3 | **Sustituciones inteligentes** | Al quitar un alimento, sugerir reemplazo equivalente del mismo grupo |

### RECETAS
| # | Mejora | Detalle |
|---|--------|---------|
| RE1 | **Foto de la receta** | Campo para upload de foto del plato |
| RE2 | **Tiempo de preparación total** | Mostrar tiempo estimado basado en pasos |
| RE3 | **Rating / favorito del paciente** | El paciente puede marcar recetas favoritas desde el portal |

### CONTABILIDAD (231 líneas · 18 funciones)
| # | Mejora | Detalle |
|---|--------|---------|
| CO1 | **Gráfico de gastos por categoría** | Donut chart de distribución de gastos |
| CO2 | **Comparativa mensual** | Gráfico de barras mes a mes |
| CO3 | **Alertas de stock bajo** | Notificación cuando un producto baja del mínimo |

### RESTAURACIÓN COLECTIVA
| # | Mejora | Detalle |
|---|--------|---------|
| RC4 | **Ciclo de menú (rotación 4-5 semanas)** | Programar rotación automática de menús por ciclo |
| RC5 | **Integración con proveedores — email automático** | Generar email de pedido a proveedor desde orden de compra |
| RC6 | **Dashboard de temperatura en tiempo real** | Panel con últimos registros APPCC y alertas |
| RC7 | **Plato favorito / más solicitado** | Ranking de platos más populares basado en mermas (menos desperdicio) |
| RC8 | **Comparar menús entre semanas** | Vista side-by-side de dos menús para detectar repeticiones |

### PORTAL DEL PACIENTE
| # | Mejora | Detalle |
|---|--------|---------|
| PP1 | **Push notification de cita** | Notificación en portal cuando hay cita mañana |
| PP2 | **Resultados de analíticas visibles** | El paciente puede ver sus analíticas (modo lectura) |
| PP3 | **Progreso gamificado** | Badges y logros por adherencia (7 días seguidos, meta cumplida, etc.) |

---

## 📊 RESUMEN CUANTITATIVO

| Categoría | 1er Grado | 2do Grado | Total |
|-----------|-----------|-----------|-------|
| Generales | 7 | 7 | 14 |
| Dashboard | 3 | 3 | 6 |
| Agenda | 3 | 4 | 7 |
| Pacientes | 4 | 0 | 4 |
| Historia Clínica | 3 | 4 | 7 |
| Fórmula | 3 | 0 | 3 |
| Planes | 3 | 0 | 3 |
| Facturación | 3 | 0 | 3 |
| Restauración | 3 | 5 | 8 |
| IA Copilot | 3 | 0 | 3 |
| Mensajería | 3 | 0 | 3 |
| Settings | 2 | 0 | 2 |
| Antropometría | 0 | 3 | 3 |
| Analíticas | 0 | 3 | 3 |
| Soporte Nutricional | 0 | 3 | 3 |
| Desarrollada | 0 | 3 | 3 |
| Recetas | 0 | 3 | 3 |
| Contabilidad | 0 | 3 | 3 |
| Portal Paciente | 0 | 3 | 3 |
| **TOTAL** | **40** | **44** | **84** |

---

## 🎯 PRIORIDAD DE IMPLEMENTACIÓN SUGERIDA

### Sprint 1 (Quick Wins — Impacto inmediato, bajo esfuerzo)
G1, G2, G4, G7, D1, D3, A1, A2, P2, P3, F1, F3, IA1, IA2

### Sprint 2 (Core UX — Mejora significativa de experiencia)
H1, H2, PL1, PL2, FA1, FA3, M3, S1, A3, P4, RC2

### Sprint 3 (Features avanzados — Diferenciación competitiva)
G6, G10, D2, A7, H4, H7, AN1, AL1, SN1, DE1, RE1, CO1, RC4
