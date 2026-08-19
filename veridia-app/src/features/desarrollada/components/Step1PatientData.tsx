import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Activity, Ruler, Calendar, Weight, FileText, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import { PatientSelector } from './PatientSelector';
import type { Patient } from '@/types';
import { PATHOLOGY_PROFILES } from '@/features/desarrollada/lib/constants';
export interface Step1Props {
  patients: Patient[];
  selectedPatientId: string;
  onPatientSelect: (id: string) => void;
  state: {
    peso: number;
    altura: number;
    edad: number;
    sexo: 'M' | 'F';
    formula: string;
    fa: number;
    fe: number;
    ajuste: number;
    patKey: string;
    selectedPaths: string[];
    medicacion: string;
    alergias: string;
  };
  onChange: (state: Step1Props['state']) => void;
  onNext: () => void;
}

interface FormValues {
  peso: number;
  altura: number;
  edad: number;
  sexo: 'M' | 'F';
  formula: string;
  fa: number;
  fe: number;
  ajuste: number;
  patKey: string;
  medicacion: string;
  alergias: string;
}

export function Step1PatientData({ patients, selectedPatientId, onPatientSelect, state, onChange, onNext }: Step1Props) {
  const { control, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      peso: state.peso || 70,
      altura: state.altura || 165,
      edad: state.edad || 30,
      sexo: state.sexo || 'M',
      formula: state.formula || 'Mifflin-St Jeor',
      fa: state.fa || 1.55,
      fe: state.fe || 1,
      ajuste: state.ajuste || 0,
      patKey: state.patKey || '',
      medicacion: state.medicacion || '',
      alergias: state.alergias || '',
    },
  });

  const watched = watch();

  useEffect(() => {
    onChange({
      peso: watched.peso,
      altura: watched.altura,
      edad: watched.edad,
      sexo: watched.sexo,
      formula: watched.formula,
      fa: watched.fa,
      fe: watched.fe,
      ajuste: watched.ajuste,
      patKey: watched.patKey,
      selectedPaths: watched.patKey ? [watched.patKey] : state.selectedPaths,
      medicacion: watched.medicacion,
      alergias: watched.alergias,
    });
  }, [watched.peso, watched.altura, watched.edad, watched.sexo, watched.formula, watched.fa, watched.fe, watched.ajuste, watched.patKey, watched.medicacion, watched.alergias]);

  const selectedProfile = watched.patKey ? PATHOLOGY_PROFILES[watched.patKey] : null;

  const handlePathologyToggle = (key: string) => {
    const current = watched.patKey;
    const newPaths = current === key ? [] : [key];
    setValue('patKey', newPaths[0] || '');
    onChange({
      ...state,
      patKey: newPaths[0] || '',
      selectedPaths: newPaths,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
          📋
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Datos del paciente</h2>
          <p className="text-xs text-text-3">Complete los datos antropométricos y seleccione la patología.</p>
        </div>
      </div>

      <PatientSelector
        patients={patients}
        selectedId={selectedPatientId}
        onSelect={onPatientSelect}
      />

      <Card className="p-5 border-t-3 border-t-primary/60">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-text">Antropometría</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Controller
            control={control}
            name="peso"
            render={({ field }) => (
              <Input label="Peso (kg)" type="number" leftIcon={<Weight size={14} />} {...field} />
            )}
          />
          <Controller
            control={control}
            name="altura"
            render={({ field }) => (
              <Input label="Altura (cm)" type="number" leftIcon={<Ruler size={14} />} {...field} />
            )}
          />
          <Controller
            control={control}
            name="edad"
            render={({ field }) => (
              <Input label="Edad (años)" type="number" leftIcon={<Calendar size={14} />} {...field} />
            )}
          />
          <Controller
            control={control}
            name="sexo"
            render={({ field }) => (
              <div className="w-full">
                <label className="block text-sm font-medium text-text-2 mb-1.5">Sexo</label>
                <div className="flex gap-2">
                  {['M', 'F'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => field.onChange(s as 'M' | 'F')}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        field.value === s
                          ? 'bg-primary text-white border-primary shadow-glow'
                          : 'bg-surface border-border text-text-3 hover:text-text'
                      }`}
                    >
                      {s === 'M' ? '♂ Masculino' : '♀ Femenino'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      </Card>

      <Card className="p-5 border-t-3 border-t-accent/60">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-text">Parámetros de cálculo</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            control={control}
            name="formula"
            render={({ field }) => (
              <div className="w-full">
                <label className="block text-sm font-medium text-text-2 mb-1.5">Fórmula</label>
                <select
                  {...field}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                >
                  <option value="Mifflin-St Jeor">Mifflin-St Jeor</option>
                  <option value="Harris-Benedict">Harris-Benedict</option>
                  <option value="Owen">Owen</option>
                </select>
              </div>
            )}
          />
          <Controller
            control={control}
            name="fa"
            render={({ field }) => (
              <Input label="Factor actividad" type="number" step="0.05" {...field} />
            )}
          />
          <Controller
            control={control}
            name="fe"
            render={({ field }) => (
              <Input label="Factor estrés/temperatura" type="number" step="0.1" {...field} />
            )}
          />
        </div>
        <div className="mt-4">
          <Controller
            control={control}
            name="ajuste"
            render={({ field }) => (
              <Input label="Ajuste kcal" type="number" step="50" {...field} helperText="Ajuste manual (+/- kcal)" />
            )}
          />
        </div>
      </Card>

      <Card className="p-5 border-t-3 border-t-danger/60">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-danger" />
          <h3 className="text-sm font-semibold text-text">Patología clínica</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.values(PATHOLOGY_PROFILES).map((pat) => (
            <button
              key={pat.key}
              type="button"
              onClick={() => handlePathologyToggle(pat.key)}
              className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                watched.patKey === pat.key
                  ? 'bg-danger/10 border-danger/30 shadow-[0_0_12px_rgba(220,38,38,0.15)]'
                  : 'bg-surface border-border hover:border-danger/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                    watched.patKey === pat.key ? 'bg-danger border-danger text-white' : 'border-text-3'
                  }`}
                >
                  {watched.patKey === pat.key ? '✓' : ''}
                </div>
                <span className={`text-xs font-semibold ${watched.patKey === pat.key ? 'text-danger' : 'text-text'}`}>
                  {pat.name}
                </span>
              </div>
              <p className="text-[10px] text-text-3 mt-1 line-clamp-2">{pat.note}</p>
            </button>
          ))}
        </div>
        {selectedProfile && (
          <div className="mt-4 p-3 rounded-xl bg-danger/5 border border-danger/20">
            <p className="text-xs text-text-2 leading-relaxed">
              <span className="font-semibold text-danger">ESPEN:</span> {selectedProfile.espenMacros}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-text-3" />
          <h3 className="text-sm font-semibold text-text">Información adicional</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="medicacion"
            render={({ field }) => (
              <Input label="Medicación actual" placeholder="Ej: Metformina 850mg" {...field} />
            )}
          />
          <Controller
            control={control}
            name="alergias"
            render={({ field }) => (
              <Input label="Alergias / Intolerancias" placeholder="Ej: Lactosa, frutos secos" {...field} />
            )}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} size="lg" icon={<Activity size={18} />}>
          Calcular macros →
        </Button>
      </div>
    </div>
  );
}
