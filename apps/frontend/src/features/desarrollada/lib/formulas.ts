import type { MacroResult } from '@/types';

export function calcGEB(
  peso: number,
  altura: number,
  edad: number,
  sexo: 'M' | 'F',
  formula: string
): number {
  if (formula === 'Mifflin-St Jeor') {
    return 10 * peso + 6.25 * altura - 5 * edad + (sexo === 'M' ? 5 : -161);
  }
  if (formula === 'Harris-Benedict') {
    return sexo === 'M'
      ? 66.5 + 13.75 * peso + 5.003 * altura - 6.775 * edad
      : 655.1 + 9.563 * peso + 1.85 * altura - 4.676 * edad;
  }
  return sexo === 'M' ? 879 + 10.2 * peso : 795 + 7.18 * peso;
}

export function calcGET(geb: number, fa: number, fe: number, ajuste: number): number {
  return Math.round(geb * fa * fe) + ajuste;
}

export function calcMacros(
  get: number,
  protGkg: number,
  grasasPct: number,
  peso: number,
  fe: number = 1,
  ajuste: number = 0
): MacroResult {
  const protG = Math.round(protGkg * peso);
  const grasasG = Math.round((get * grasasPct) / 100 / 9);
  const hcG = Math.round((get - protG * 4 - grasasG * 9) / 4);
  const fibraG = Math.max(25, Math.round((14 * get) / 1000));
  const aguaL = Math.round((35 * peso / 1000) * 10) / 10;
  return {
    geb: 0,
    get,
    protGkg,
    grasasPct,
    protG,
    grasasG,
    hcG: Math.max(0, hcG),
    fibraG,
    aguaL,
    fe,
    ajuste,
  };
}

export function calcBMI(peso: number, altura: number): number {
  if (!altura) return 0;
  const alturaM = altura / 100;
  return Number((peso / (alturaM * alturaM)).toFixed(1));
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-warning' };
  if (bmi < 25) return { label: 'Normal', color: 'text-success' };
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-warning' };
  return { label: 'Obesidad', color: 'text-danger' };
}

export function getSemaforoStatus(actual: number, objetivo: number): 'green' | 'yellow' | 'red' {
  if (objetivo === 0) return 'yellow';
  const pct = (actual / objetivo) * 100;
  if (pct >= 90 && pct <= 110) return 'green';
  if (pct > 110) return 'red';
  return 'yellow';
}
