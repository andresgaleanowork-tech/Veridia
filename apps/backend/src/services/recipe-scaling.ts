export interface ScaledIngredient {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface ScaledRecipe {
  id: string;
  nombre: string;
  raciones: number;
  racionesOriginales: number;
  factorEscalado: number;
  kcal: number;
  prot: number;
  grasas: number;
  hc: number;
  fibra: number;
  ingredientes: ScaledIngredient[];
}

function parseIngredient(text: string): { nombre: string; cantidad: number; unidad: string } {
  const trimmed = text.trim();
  const match = trimmed.match(/^([\d.,]+)\s*([a-zA-Zµμg]*)\s*(.*)$/);
  if (!match) return { nombre: trimmed, cantidad: 0, unidad: '' };
  const cantidad = parseFloat(match[1].replace(',', '.')) || 0;
  const unidad = match[2] || '';
  const nombre = match[3].trim();
  return { nombre, cantidad, unidad };
}

export function scaleRecipe(recipe: any, targetServings: number): ScaledRecipe {
  const scaleFactor = targetServings / (Number(recipe.raciones) || 1);

  const ingredientes: ScaledIngredient[] = (Array.isArray(recipe.ingredientes) ? recipe.ingredientes : [])
    .map((ing: string) => {
      const parsed = parseIngredient(ing);
      return {
        nombre: parsed.nombre,
        cantidad: parsed.cantidad > 0 ? Math.round(parsed.cantidad * scaleFactor * 100) / 100 : 0,
        unidad: parsed.unidad,
      };
    });

  const toNum = (v: any) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
  };

  return {
    id: String(recipe.id),
    nombre: String(recipe.nombre || ''),
    raciones: targetServings,
    racionesOriginales: Number(recipe.raciones) || 1,
    factorEscalado: Math.round(scaleFactor * 100) / 100,
    kcal: Math.round(toNum(recipe.kcal) * scaleFactor),
    prot: Math.round(toNum(recipe.prot) * scaleFactor * 10) / 10,
    grasas: Math.round(toNum(recipe.grasas) * scaleFactor * 10) / 10,
    hc: Math.round(toNum(recipe.hc) * scaleFactor * 10) / 10,
    fibra: Math.round(toNum(recipe.fibra) * scaleFactor * 10) / 10,
    ingredientes,
  };
}
