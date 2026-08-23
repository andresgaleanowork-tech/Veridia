import { useState, useMemo } from 'react';
import { Calculator, Info, ArrowUpDown } from 'lucide-react';

type Sex = 'M' | 'F';
type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'intenso' | 'muy_intenso';
type Formula = 'harris_benedict' | 'mifflin' | 'who' | 'fao';
type Objective = 'perder' | 'mantener' | 'ganar';

interface PatientData {
  age: string;
  sex: Sex;
  weight: string;
  height: string;
  activity: ActivityLevel;
  objective: Objective;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, { label: string; factor: number; desc: string }> = {
  sedentario: { label: 'Sedentario', factor: 1.2, desc: 'Trabajo de oficina, poco movimiento' },
  ligero: { label: 'Ligero (1-2d/sem)', factor: 1.375, desc: 'Ejercicio ligero 1-3 días/semana' },
  moderado: { label: 'Moderado (3-4d/sem)', factor: 1.55, desc: 'Ejercicio moderado 3-5 días/semana' },
  intenso: { label: 'Intenso (5-6d/sem)', factor: 1.725, desc: 'Ejercicio intenso 6-7 días/semana' },
  muy_intenso: { label: 'Muy intenso (atleta)', factor: 1.9, desc: 'Atleta o trabajo físico muy exigente' },
};

const OBJECTIVE_FACTORS: Record<Objective, { label: string; adj: number; color: string }> = {
  perder: { label: 'Pérdida de peso', adj: -500, color: 'text-warning' },
  mantener: { label: 'Mantenimiento', adj: 0, color: 'text-success' },
  ganar: { label: 'Ganancia muscular', adj: 300, color: 'text-info' },
};

export function FormulaPage() {
  const [data, setData] = useState<PatientData>({
    age: '',
    sex: 'F',
    weight: '',
    height: '',
    activity: 'sedentario',
    objective: 'mantener',
  });
  const [formula, setFormula] = useState<Formula>('mifflin');

  const results = useMemo(() => {
    const age = parseFloat(data.age);
    const weight = parseFloat(data.weight);
    const height = parseFloat(data.height);

    if (!age || !weight || !height || age < 1 || age > 120 || weight < 20 || weight > 300 || height < 100 || height > 250) {
      return null;
    }

    // BMR calculation
    let bmr = 0;
    let formulaName = '';

    switch (formula) {
      case 'mifflin':
        bmr = data.sex === 'M'
          ? 10 * weight + 6.25 * height - 5 * age + 5
          : 10 * weight + 6.25 * height - 5 * age - 161;
        formulaName = 'Mifflin-St Jeor';
        break;
      case 'harris_benedict':
        bmr = data.sex === 'M'
          ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
          : 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
        formulaName = 'Harris-Benedict (revisada)';
        break;
      case 'who':
        bmr = data.sex === 'M'
          ? 11.6 * weight + 502 + 10.7 * height / 100 * 100 - 3.8 * age
          : 8.7 * weight + 254 + 3.1 * height / 100 * 100 - 4.3 * age;
        formulaName = 'OMS';
        break;
      case 'fao':
        bmr = data.sex === 'M'
          ? 11.5 * weight + 593 - 5.0 * age + 10.7 * height / 100 * 100
          : 8.3 * weight + 445 - 4.7 * age + 9.0 * height / 100 * 100;
        formulaName = 'FAO/WHO/UNU';
        break;
    }

    const activityFactor = ACTIVITY_FACTORS[data.activity].factor;
    const tdee = bmr * activityFactor;
    const objectiveAdj = OBJECTIVE_FACTORS[data.objective].adj;
    const targetCalories = Math.round(tdee + objectiveAdj);

    // Macros
    const proteinG = Math.round(weight * (data.objective === 'ganar' ? 2.0 : data.objective === 'perder' ? 1.6 : 1.2));
    const fatPct = data.objective === 'perder' ? 0.25 : 0.30;
    const fatG = Math.round((targetCalories * fatPct) / 9);
    const carbCalories = targetCalories - (proteinG * 4) - (fatG * 9);
    const carbG = Math.round(Math.max(0, carbCalories / 4));

    // BMI
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Bajo peso';
    else if (bmi < 25) bmiCategory = 'Normal';
    else if (bmi < 30) bmiCategory = 'Sobrepeso';
    else if (bmi < 35) bmiCategory = 'Obesidad I';
    else if (bmi < 40) bmiCategory = 'Obesidad II';
    else bmiCategory = 'Obesidad III';

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories,
      proteinG,
      fatG,
      carbG,
      bmi: bmi.toFixed(1),
      bmiCategory,
      formulaName,
    };
  }, [data, formula]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Fórmula Desarrollada</h1>
        <p className="text-text-3 text-sm mt-1">Calculadora de requerimientos nutricionales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Calculator size={14} className="text-primary" />
              Datos del Paciente
            </h3>

            {/* Age */}
            <div>
              <label className="text-xs text-text-3 mb-1 block">Edad (años)</label>
              <input
                type="number"
                value={data.age}
                onChange={(e) => setData((p) => ({ ...p, age: e.target.value }))}
                placeholder="35"
                min={1}
                max={120}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Sex */}
            <div>
              <label className="text-xs text-text-3 mb-1 block">Sexo biológico</label>
              <div className="flex gap-2">
                {(['M', 'F'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setData((p) => ({ ...p, sex: s }))}
                    aria-pressed={data.sex === s}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      data.sex === s ? 'bg-primary text-white' : 'bg-surface-2 border border-border text-text-3 hover:text-text'
                    }`}
                  >
                    {s === 'M' ? 'Masculino' : 'Femenino'}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="text-xs text-text-3 mb-1 block">Peso (kg)</label>
              <input
                type="number"
                value={data.weight}
                onChange={(e) => setData((p) => ({ ...p, weight: e.target.value }))}
                placeholder="70"
                min={20}
                max={300}
                step={0.1}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Height */}
            <div>
              <label className="text-xs text-text-3 mb-1 block">Altura (cm)</label>
              <input
                type="number"
                value={data.height}
                onChange={(e) => setData((p) => ({ ...p, height: e.target.value }))}
                placeholder="165"
                min={100}
                max={250}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-xs text-text-3 mb-1 block">Nivel de actividad</label>
              <select
                value={data.activity}
                onChange={(e) => setData((p) => ({ ...p, activity: e.target.value as ActivityLevel }))}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              >
                {Object.entries(ACTIVITY_FACTORS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-text-3 mt-1">{ACTIVITY_FACTORS[data.activity].desc}</p>
            </div>

            {/* Objective */}
            <div>
              <label className="text-xs text-text-3 mb-1 block">Objetivo</label>
              <div className="flex gap-2">
                {Object.entries(OBJECTIVE_FACTORS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setData((p) => ({ ...p, objective: key as Objective }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      data.objective === key ? 'bg-primary text-white' : 'bg-surface-2 border border-border text-text-3 hover:text-text'
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formula selector */}
            <div>
              <label className="text-xs text-text-3 mb-1 block">Fórmula</label>
              <select
                value={formula}
                onChange={(e) => setFormula(e.target.value as Formula)}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              >
                <option value="mifflin">Mifflin-St Jeor (recomendada)</option>
                <option value="harris_benedict">Harris-Benedict (revisada)</option>
                <option value="who">OMS</option>
                <option value="fao">FAO/WHO/UNU</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {!results ? (
            <div className="glass-card p-12 text-center">
              <Calculator size={40} className="text-text-3 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-text mb-1">Completa los datos</h3>
              <p className="text-text-3 text-sm">Introduce edad, peso y altura para calcular los requerimientos.</p>
            </div>
          ) : (
            <>
              {/* TMB & TDEE */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5 text-center">
                  <div className="text-xs text-text-3 mb-1">Tasa Metabólica Basal (TMB)</div>
                  <div className="text-3xl font-bold text-primary">{results.bmr}</div>
                  <div className="text-xs text-text-3">kcal/día</div>
                  <div className="text-[10px] text-text-3 mt-1">Fórmula: {results.formulaName}</div>
                </div>
                <div className="glass-card p-5 text-center">
                  <div className="text-xs text-text-3 mb-1">Gasto Energético Total (GET/TDEE)</div>
                  <div className="text-3xl font-bold text-accent">{results.tdee}</div>
                  <div className="text-xs text-text-3">kcal/día</div>
                  <div className="text-[10px] text-text-3 mt-1">Actividad: {ACTIVITY_FACTORS[data.activity].label}</div>
                </div>
              </div>

              {/* Target calories */}
              <div className={`glass-card p-5 text-center glow-border`}>
                <div className="text-xs text-text-3 mb-1">Calorías Objetivo</div>
                <div className={`text-4xl font-bold ${OBJECTIVE_FACTORS[data.objective].color}`}>
                  {results.targetCalories}
                </div>
                <div className="text-xs text-text-3">kcal/día — {OBJECTIVE_FACTORS[data.objective].label}</div>
              </div>

              {/* Macros */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-text mb-4">Macronutrientes</h3>
                <div className="grid grid-cols-3 gap-4">
                  <MacroCard label="Proteínas" grams={results.proteinG} calories={results.proteinG * 4} pct={Math.round((results.proteinG * 4 / results.targetCalories) * 100)} color="from-accent to-success" />
                  <MacroCard label="Grasas" grams={results.fatG} calories={results.fatG * 9} pct={Math.round((results.fatG * 9 / results.targetCalories) * 100)} color="from-warning to-danger" />
                  <MacroCard label="Carbohidratos" grams={results.carbG} calories={results.carbG * 4} pct={Math.round((results.carbG * 4 / results.targetCalories) * 100)} color="from-primary to-info" />
                </div>
              </div>

              {/* BMI */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                  <ArrowUpDown size={14} />
                  Índice de Masa Corporal
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-text">{results.bmi}</div>
                  <div>
                    <div className={`text-sm font-medium ${
                      results.bmiCategory === 'Normal' ? 'text-success' :
                      results.bmiCategory.includes('Bajo') ? 'text-warning' :
                      'text-danger'
                    }`}>{results.bmiCategory}</div>
                    <div className="text-[10px] text-text-3">kg/m²</div>
                  </div>
                </div>
                {/* BMI scale visual */}
                <div className="mt-3 h-3 rounded-full overflow-hidden flex">
                  <div className="flex-1 bg-info/40" />
                  <div className="flex-1 bg-success/60" />
                  <div className="flex-1 bg-warning/60" />
                  <div className="flex-1 bg-danger/40" />
                  <div className="flex-1 bg-danger/60" />
                </div>
                <div className="flex justify-between text-[9px] text-text-3 mt-1">
                  <span>&lt;18.5</span>
                  <span>18.5-25</span>
                  <span>25-30</span>
                  <span>30-35</span>
                  <span>&gt;35</span>
                </div>
              </div>

              {/* Clinical notes */}
              <div className="glass-card p-5 border-info/20">
                <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                  <Info size={14} className="text-info" />
                  Notas Clínicas
                </h3>
                <ul className="text-xs text-text-3 space-y-1">
                  <li>• La TMB calculada es una estimación. Para precisión clínica considerar bioimpedancia.</li>
                  <li>• La fórmula de Mifflin-St Jeor es la más precisa para población general (ADA 2024).</li>
                  <li>• Pacientes obesos (IMC {'>'}30): considerar peso ajustado para TMB.</li>
                  <li>• Ajustar según respuesta clínica, adherencia y objetivos individuales.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MacroCard({ label, grams, calories, pct, color }: {
  label: string; grams: number; calories: number; pct: number; color: string;
}) {
  return (
    <div className="bg-surface-2 rounded-xl p-4 border border-border text-center">
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} mx-auto mb-2 flex items-center justify-center`}>
        <span className="text-white text-xs font-bold">{pct}%</span>
      </div>
      <div className="text-lg font-bold text-text">{grams}g</div>
      <div className="text-xs text-text-3">{label}</div>
      <div className="text-[10px] text-text-3">{calories} kcal</div>
    </div>
  );
}
