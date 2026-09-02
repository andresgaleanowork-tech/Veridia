import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

const templatesCache = new Map<string, HandlebarsTemplateDelegate>();

const loadTemplate = (name: string): HandlebarsTemplateDelegate => {
  if (templatesCache.has(name)) return templatesCache.get(name)!;
  const templatePath = path.join(__dirname, '..', 'templates', 'pdf', `${name}.hbs`);
  if (!fs.existsSync(templatePath)) throw new Error(`PDF template not found: ${name}`);
  const source = fs.readFileSync(templatePath, 'utf-8');
  const compiled = Handlebars.compile(source);
  templatesCache.set(name, compiled);
  return compiled;
};

export interface Branding {
  name?: string;
  primaryColor?: string;
  logoUrl?: string;
  nif?: string;
  address?: string;
}

export interface PDFPatient {
  id?: string;
  nombre?: string | null;
  apellidos?: string | null;
  dni?: string | null;
  fecha_nacimiento?: string | null;
  fechaNacimiento?: string | null;
  sexo?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  alerts?: unknown[];
}

export interface PDFPlan {
  id: string;
  nombre?: string | null;
  kcalObjetivo?: number | null;
  prot_g?: number | null;
  hc_g?: number | null;
  grasas_g?: number | null;
  fibra_g?: number | null;
  comidas?: unknown;
  meals?: unknown;
  dias?: unknown;
  days?: unknown;
}

export interface PDFHistory {
  antecedentes?: string | null;
  alergias?: string | null;
  medicacion?: string | null;
  observaciones?: string | null;
}

export interface PDFInvoice {
  id: string;
  numero?: string | null;
  fecha?: string | Date | null;
  estado?: string | null;
  total?: number | string | null;
  createdAt?: unknown;
  lineas?: unknown;
  pagos?: unknown;
}

const generatePDF = async (params: { template: string; data: Record<string, unknown>; filename: string }): Promise<Buffer> => {
  const { template, data } = params;
  const compiledTemplate = loadTemplate(template);
  const html = compiledTemplate(data);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return Buffer.from(await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } })) as Buffer;
  } finally { await browser.close(); }
};

export const generateMealPlanPDF = async (plan: PDFPlan, patient: PDFPatient, branding: Branding = {}): Promise<Buffer> => {
  const data = {
    patient: { name: `${patient.nombre || ''} ${patient.apellidos || ''}`, dni: patient.dni || '—' },
    plan: { name: plan.nombre, date: new Date().toLocaleDateString('es-AR'), kcal: plan.kcalObjetivo ?? '—', protein: plan.prot_g, carbs: plan.hc_g, fat: plan.grasas_g, fiber: plan.fibra_g },
    meals: plan.comidas || plan.meals || [], days: plan.dias || plan.days || [],
    branding: { name: branding.name || 'Veridia HealthTech', color: branding.primaryColor || '#0891B2', logo: branding.logoUrl || null },
  };
  return generatePDF({ template: 'meal-plan', data, filename: `plan-${plan.nombre || plan.id}.pdf` });
};

export const generateClinicalReportPDF = async (patient: PDFPatient, history: PDFHistory | null | undefined, analytics: unknown[], branding: Branding = {}): Promise<Buffer> => {
  const data = {
    patient: { name: `${patient.nombre || ''} ${patient.apellidos || ''}`, dni: patient.dni || '—', dob: patient.fecha_nacimiento || patient.fechaNacimiento || '—', gender: patient.sexo, phone: patient.telefono, email: patient.email },
    history: history || {}, analytics: analytics || [], alerts: patient.alerts || [],
    branding: { name: branding.name || 'Veridia HealthTech', color: branding.primaryColor || '#0891B2', logo: branding.logoUrl || null },
  };
  return generatePDF({ template: 'clinical-report', data, filename: `reporte-${patient.nombre}_${patient.apellidos}.pdf` });
};

export const generateInvoicePDF = async (invoice: PDFInvoice, patient: PDFPatient, branding: Branding = {}): Promise<Buffer> => {
  const data = {
    invoice: { id: invoice.id, numero: invoice.numero, fecha: invoice.fecha, estado: invoice.estado, total: invoice.total, lineas: invoice.lineas || [] },
    patient: { name: `${patient.nombre || ''} ${patient.apellidos || ''}`, dni: patient.dni || '—', email: patient.email || '—', address: patient.direccion || '—' },
    payments: invoice.pagos || [],
    branding: { name: branding.name || 'Veridia HealthTech', nif: branding.nif || '', address: branding.address || '', color: branding.primaryColor || '#0891B2' },
  };
  return generatePDF({ template: 'invoice', data, filename: `factura-${invoice.numero}.pdf` });
};

export default { generatePDF, generateMealPlanPDF, generateClinicalReportPDF, generateInvoicePDF };
