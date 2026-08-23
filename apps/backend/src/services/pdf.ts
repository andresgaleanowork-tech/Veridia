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

const generatePDF = async (params: { template: string; data: any; filename: string }): Promise<Buffer> => {
  const { template, data } = params;
  const compiledTemplate = loadTemplate(template);
  const html = compiledTemplate(data);
  const browser = await puppeteer.launch({ headless: 'new' as any, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' as any });
    return Buffer.from(await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } })) as Buffer;
  } finally { await browser.close(); }
};

export const generateMealPlanPDF = async (plan: any, patient: any, branding: any = {}): Promise<Buffer> => {
  const data = {
    patient: { name: `${patient.nombre} ${patient.apellidos}`, dni: patient.dni },
    plan: { name: plan.nombre, date: new Date().toLocaleDateString('es-AR'), kcal: plan.kcal_objetivo, protein: plan.prot_g, carbs: plan.hc_g, fat: plan.grasas_g, fiber: plan.fibra_g },
    meals: plan.comidas || plan.meals || [], days: plan.dias || plan.days || [],
    branding: { name: branding.name || 'Veridia HealthTech', color: branding.primaryColor || '#0891B2', logo: branding.logoUrl || null },
  };
  return generatePDF({ template: 'meal-plan', data, filename: `plan-${plan.nombre || plan.id}.pdf` });
};

export const generateClinicalReportPDF = async (patient: any, history: any, analytics: any[], branding: any = {}): Promise<Buffer> => {
  const data = {
    patient: { name: `${patient.nombre} ${patient.apellidos}`, dni: patient.dni, dob: patient.fecha_nacimiento, gender: patient.sexo, phone: patient.telefono, email: patient.email },
    history: history || {}, analytics: analytics || [], alerts: patient.alerts || [],
    branding: { name: branding.name || 'Veridia HealthTech', color: branding.primaryColor || '#0891B2', logo: branding.logoUrl || null },
  };
  return generatePDF({ template: 'clinical-report', data, filename: `reporte-${patient.nombre}_${patient.apellidos}.pdf` });
};

export const generateInvoicePDF = async (invoice: any, patient: any, branding: any = {}): Promise<Buffer> => {
  const data = {
    invoice: { id: invoice.id, numero: invoice.numero, fecha: invoice.fecha, estado: invoice.estado, total: invoice.total, lineas: invoice.lineas || [] },
    patient: { name: `${patient.nombre} ${patient.apellidos}`, dni: patient.dni, email: patient.email, address: patient.direccion },
    payments: invoice.pagos || [],
    branding: { name: branding.name || 'Veridia HealthTech', nif: branding.nif || '', address: branding.address || '', color: branding.primaryColor || '#0891B2' },
  };
  return generatePDF({ template: 'invoice', data, filename: `factura-${invoice.numero}.pdf` });
};

export default { generatePDF, generateMealPlanPDF, generateClinicalReportPDF, generateInvoicePDF };
