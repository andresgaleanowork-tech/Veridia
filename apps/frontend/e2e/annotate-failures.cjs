/**
 * Emite GitHub Actions annotations con los detalles de cada test E2E
 * fallido (reporte JSON de Playwright) y, si existe, el tramo final del
 * output del runner. Así el resumen del check muestra el fallo sin
 * necesidad de abrir los logs del job.
 *
 * Uso: node e2e/annotate-failures.cjs [results.json] [e2e-run.log]
 */
/* eslint-disable no-console -- Su función es imprimir annotations ::error:: para CI. */
const fs = require('node:fs');
const path = require('node:path');

const reportPath = process.argv[2] || path.join(__dirname, '.results', 'results.json');
const logPath = process.argv[3] || '/tmp/e2e-run.log';

function inline(text, max = 6000) {
  return String(text)
    .replace(/::/g, ': :')
    .split('\n')
    .filter((l) => l.trim())
    .join(' ⏎ ')
    .slice(-max);
}

// 1) Reporte JSON: stats + tests fallidos
let failures = 0;
if (fs.existsSync(reportPath)) {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const s = report.stats || {};
    console.error(
      `::notice title=E2E stats::failed=${s.failed ?? 0} expected=${s.expected ?? 0} flaky=${s.flaky ?? 0} skipped=${s.skipped ?? 0} duration=${Math.round((s.duration ?? 0) / 1000)}s`
    );

    function walk(suites, prefix) {
      for (const suite of suites || []) {
        const title = suite.title ? `${prefix} ${suite.title}`.trim() : prefix;
        for (const spec of suite.specs || []) {
          const results = spec.results || (spec.tests || []).flatMap((t) => t.results || []);
          const failed = results.find((r) => r.status === 'failed' || r.status === 'timedOut');
          if (!failed) continue;
          failures++;
          const raw = failed.error?.message || 'sin mensaje de error';
          console.error(`::error title=E2E: ${title} › ${spec.title}::${inline(raw, 2000)}`);
        }
        walk(suite.suites, title);
      }
    }
    walk(report.suites, '');
    if (failures === 0) {
      console.error('::warning title=E2E::Reporte JSON sin fallos de specs — el fallo del step no es un test (ver output abajo).');
    }
  } catch (e) {
    console.error(`::warning title=E2E::No se pudo parsear el reporte JSON: ${e.message}`);
  }
} else {
  console.error('::error title=E2E::No se generó el reporte JSON (e2e/.results/results.json) — el runner falló antes de escribirlo.');
}

// 2) Tail del output del runner (últimos 6000 chars limpios)
if (fs.existsSync(logPath)) {
  const log = fs.readFileSync(logPath, 'utf8');
  if (log.trim()) {
    console.error(`::error title=E2E output (tail)::. ${inline(log, 6000)}`);
  }
}
