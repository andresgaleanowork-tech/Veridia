/**
 * Emite GitHub Actions annotations (::error::) con los detalles de cada test
 * E2E fallido, leídos del reporte JSON de Playwright.
 *
 * Útil cuando no es posible revisar los logs del job: el resumen del check
 * muestra qué test falló y el primer trozo del error.
 *
 * Uso: node e2e/annotate-failures.cjs [ruta-al-results.json]
 */
/* eslint-disable no-console -- Su función es imprimir annotations ::error:: para CI. */
const fs = require('node:fs');
const path = require('node:path');

const reportPath = process.argv[2] || path.join(__dirname, '.results', 'results.json');

if (!fs.existsSync(reportPath)) {
  console.error('::error title=E2E::No se encontró el reporte JSON (e2e/.results/results.json)');
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
let failures = 0;

function walk(suites, prefix) {
  for (const suite of suites || []) {
    const title = suite.title ? `${prefix} ${suite.title}`.trim() : prefix;
    for (const spec of suite.specs || []) {
      const results =
        spec.results ||
        (spec.tests || []).flatMap((t) => t.results || []);
      const failed = results.find((r) => r.status === 'failed' || r.status === 'timedOut');
      if (!failed) continue;
      failures++;
      const raw = failed.error?.message || 'sin mensaje de error';
      const summary = raw
        .split('\n')
        .filter((l) => l.trim())
        .slice(0, 4)
        .join(' | ')
        .slice(0, 800);
      console.error(`::error title=E2E: ${title} › ${spec.title}::${summary}`);
    }
    walk(suite.suites, title);
  }
}

walk(report.suites, '');

if (failures === 0) {
  console.log('Sin fallos registrados en el reporte JSON (¿falló el runner antes de los tests?).');
} else {
  console.log(`Total de tests fallidos: ${failures}`);
}
