import { useState, useMemo } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/i18n/useTranslation';
import { useLocale } from '@/hooks/useLocale';

interface Guideline {
  id: string;
  title: string;
  category: string;
  year: number;
  summary: string;
  keyPoints: string[];
}

const GUIDELINES: Guideline[] = [
  {
    id: 'obesity', title: 'Nutrición en Obesidad', category: 'Obesidad', year: 2022,
    summary: 'Manejo nutricional del paciente obeso, incluyendo pré y post-cirugía bariátrica.',
    keyPoints: ['Definición: IMC ≥30 kg/m²', 'Déficit calórico moderado: 500-1000 kcal/día', 'Proteínas: 1.2-1.5 g/kg/día', 'Cirugía bariátrica: IMC ≥40 o ≥35 con comorbilidades', 'Suplementación post-bariátrica: B12, hierro, vitamina D, calcio'],
  },
  {
    id: 'malnutrition', title: 'Cribado y Diagnóstico de Desnutrición', category: 'Desnutrición', year: 2021,
    summary: 'Criterios diagnósticos y herramientas de cribado para desnutrición.',
    keyPoints: ['Criterios GLIM: fenotípicos + etiológicos', 'Herramientas: MNA, MST, NRS-2002, MUST', 'Pérdida de peso >5% en 3 meses o >10% en 6 meses', 'IMC <18.5 o masa muscular reducida'],
  },
  {
    id: 'cancer', title: 'Nutrición en Oncología', category: 'Oncología', year: 2021,
    summary: 'Manejo nutricional del paciente oncológico: prevención de caquexia.',
    keyPoints: ['Necesidades: 25-30 kcal/kg/día, 1.2-2.0 g prot/kg/día', 'Omega-3 (EPA/DHA) puede mejorar apetito', 'Nutrición artificial si ingesta oral <60% >10 días', 'Manejo de mucositis, disfagia, diarrea'],
  },
  {
    id: 'diabetes', title: 'Nutrición en Diabetes', category: 'Diabetes', year: 2023,
    summary: 'Manejo dietético de diabetes mellitus tipo 1 y 2.',
    keyPoints: ['Distribución de macros flexible según preferencias', 'Calidad alimentaria > distribución de macros', 'Proteínas: 1.0-1.5 g/kg/día', 'Ejercicio: 150 min/semana moderado'],
  },
  {
    id: 'ckd', title: 'Nutrición en Enfermedad Renal Crónica', category: 'Nefrología', year: 2020,
    summary: 'Manejo nutricional en ERC pre y post-diálisis.',
    keyPoints: ['Pre-diálisis: 0.8 g prot/kg/día', 'Hemodiálisis: 1.0-1.2 g prot/kg/día', 'Diálisis peritoneal: 1.2-1.3 g prot/kg/día', 'Restricción de potasio y fósforo según niveles'],
  },
  {
    id: 'elderly', title: 'Nutrición en el Anciano', category: 'Geriatría', year: 2019,
    summary: 'Manejo nutricional del paciente geriátrico, sarcopenia y fragilidad.',
    keyPoints: ['Cribado con MNA o MNA-SF', 'Sarcopenia: pérdida de fuerza + masa muscular', 'Proteínas: 1.0-1.2 g/kg/día', 'Vitamina D: 800-2000 UI/día'],
  },
  {
    id: 'liver', title: 'Nutrición en Enfermedad Hepática', category: 'Hepatología', year: 2019,
    summary: 'Manejo nutricional en cirrosis y enfermedad hepática avanzada.',
    keyPoints: ['Cirrosis: 25-35 kcal/kg/día', 'Proteínas: 1.2-1.5 g/kg/día (incluir proteína vegetal)', 'Restricción de sodio en ascitis', 'Suplementación de vitaminas liposolubles'],
  },
  {
    id: 'surgery', title: 'Nutrición Perioperatoria', category: 'Cirugía', year: 2017,
    summary: 'Manejo nutricional pre y post-cirugía para optimizar resultados.',
    keyPoints: ['Screening con NRS-2002 preoperatorio', 'Nutrición prehabilitación 7-14 días antes', 'Rean precoz (6-8h postoperatorio)', 'Inmunonutrición: arginina, omega-3, nucleótidos'],
  },
];

const CATEGORIES = ['Todas', ...new Set(GUIDELINES.map((g) => g.category))];

export function EspenPage() {
  const [locale] = useLocale();
  const { t } = useTranslation(locale);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => GUIDELINES.filter((g) => {
    const matchSearch = !debouncedSearch || g.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || g.summary.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchCat = category === 'Todas' || g.category === category;
    return matchSearch && matchCat;
  }), [debouncedSearch, category]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('clinical.espEn')}</h1>
        <p className="text-text-3 text-sm mt-1">{t('clinical.espEnSubtitle')}</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            placeholder={t('clinical.espEnSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1 border border-border overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                category === cat ? 'bg-primary text-white' : 'text-text-3 hover:text-text hover:bg-surface-3'
              }`}
            >
              {cat === 'Todas' ? t('common.all') : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((g) => {
          const isOpen = expanded.has(g.id);
          return (
            <div key={g.id} className="glass-card overflow-hidden">
              <button
                onClick={() => toggle(g.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className="text-primary shrink-0" />
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-text">{g.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{g.category}</span>
                      <span className="text-[10px] text-text-3">{g.year}</span>
                    </div>
                  </div>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-text-3 shrink-0" /> : <ChevronRight size={16} className="text-text-3 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
                  <p className="text-sm text-text-2">{g.summary}</p>
                  <div>
                    <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">{t('clinical.keyPoints')}</h4>
                    <ul className="space-y-1.5">
                      {g.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
