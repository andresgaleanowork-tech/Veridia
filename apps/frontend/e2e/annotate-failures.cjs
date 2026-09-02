/**
 * Diagnóstico E2E para CI:
 *  1. Emite GitHub Actions annotations (::notice/::error) con stats del
 *     reporte JSON, cada spec fallida y el tail del output del runner.
 *  2. En CI, publica/actualiza un issue "E2E CI diagnostics" con el mismo
 *     contenido (canal legible sin acceso a los logs del job).
 *
 * Uso: node e2e/annotate-failures.cjs [results.json] [e2e-run.log]
 */
/* eslint-disable no-console -- Su función es imprimir annotations ::error:: para CI. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const reportPath = process.argv[2] || path.join(__dirname, '.results', 'results.json');
const logPath = process.argv[3] || '/tmp/e2e-run.log';

function clean(text, max = 6000) {
  return String(text)
    .replace(/::/g, ': :')
    .split('\n')
    .filter((l) => l.trim())
    .join('\n')
    .slice(-max);
}

function inline(text, max = 6000) {
  return clean(text, max).replace(/\n/g, ' ⏎ ');
}

// ---------------------------------------------------------------------------
// Construir el reporte de diagnóstico
// ---------------------------------------------------------------------------
const sections = [];

let failures = 0;
if (fs.existsSync(reportPath)) {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const s = report.stats || {};
    sections.push(
      `## Stats\n\nfailed=${s.failed ?? 0} · expected=${s.expected ?? 0} · flaky=${s.flaky ?? 0} · skipped=${s.skipped ?? 0} · duración=${Math.round((s.duration ?? 0) / 1000)}s`
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
          sections.push(`### ❌ ${title} › ${spec.title}\n\n\`\`\`\n${clean(raw, 2500)}\n\`\`\``);
        }
        walk(suite.suites, title);
      }
    }
    walk(report.suites, '');
    if (failures === 0) {
      sections.push('> ⚠️ El reporte JSON no registra specs fallidas: el fallo del step no es un test (ver output abajo).');
    }
  } catch (e) {
    sections.push(`⚠️ No se pudo parsear el reporte JSON: ${e.message}`);
  }
} else {
  sections.push('❌ No se generó el reporte JSON (`e2e/.results/results.json`): el runner falló antes de escribirlo.');
}

if (fs.existsSync(logPath)) {
  const log = fs.readFileSync(logPath, 'utf8');
  if (log.trim()) {
    sections.push(`## Output del runner (tail)\n\n\`\`\`\n${clean(log, 6000)}\n\`\`\``);
  }
}

const body = [
  'Diagnóstico del último fallo de E2E (actualizado automáticamente por CI).',
  `Run: ${process.env.GITHUB_SERVER_URL || ''}/${process.env.GITHUB_REPOSITORY || ''}/actions/runs/${process.env.GITHUB_RUN_ID || 'local'}`,
  `SHA: ${process.env.GITHUB_SHA || 'n/a'} · fecha: ${new Date().toISOString()}`,
  '',
  ...sections,
].join('\n');

// ---------------------------------------------------------------------------
// 1) Annotations
// ---------------------------------------------------------------------------
if (fs.existsSync(reportPath)) {
  try {
    const s = (JSON.parse(fs.readFileSync(reportPath, 'utf8')).stats) || {};
    console.error(
      `::notice title=E2E stats::failed=${s.failed ?? 0} expected=${s.expected ?? 0} flaky=${s.flaky ?? 0} skipped=${s.skipped ?? 0}`
    );
  } catch { /* noop */ }
}
for (const section of sections) {
  const firstLine = section.replace(/^#+\s*/, '').split('\n')[0].slice(0, 120);
  const level = section.startsWith('### ❌') ? 'error' : 'warning';
  console.error(`::${level} title=${firstLine.replace(/::/g, ': :')}::${inline(section, 2000)}`);
}

// ---------------------------------------------------------------------------
// 2) Publicar en CI (nunca rompe el job):
//    - En contexto de PR: comentario (reutilizado) en el PR
//    - En push directo: issue etiquetado ci-e2e-diagnostics
// ---------------------------------------------------------------------------
const MARKER = '<!-- e2e-diagnostics -->';

function publish() {
  if (!process.env.GITHUB_REPOSITORY || !process.env.GH_TOKEN) return;
  const repo = process.env.GITHUB_REPOSITORY;
  const gh = (args) =>
    execFileSync('gh', args, {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
      timeout: 90_000,
    });

  const fullBody = `${MARKER}\n${body}`;
  const prMatch = String(process.env.GITHUB_REF || '').match(/^refs\/pull\/(\d+)\//);

  try {
    if (prMatch) {
      const pr = prMatch[1];
      const listed = gh(['api', `repos/${repo}/issues/${pr}/comments`, '--jq', '.[] | select(.body | contains("e2e-diagnostics")) | .id']);
      const id = listed.trim().split('\n').filter(Boolean)[0];
      if (id) {
        gh(['api', `repos/${repo}/issues/comments/${id}`, '-X', 'PATCH', '-F', `body=${fullBody}`]);
        console.log(`Diagnóstico actualizado en el comentario del PR #${pr}`);
      } else {
        gh(['api', `repos/${repo}/issues/${pr}/comments`, '-F', `body=${fullBody}`]);
        console.log(`Diagnóstico publicado en el PR #${pr}`);
      }
      return;
    }
    gh(['label', 'create', 'ci-e2e-diagnostics', '--force', '--color', 'B60205', '--repo', repo]);
    const listed = gh(['issue', 'list', '--label', 'ci-e2e-diagnostics', '--state', 'open', '--json', 'number', '--repo', repo]);
    const existing = JSON.parse(listed || '[]')[0]?.number;
    if (existing) {
      gh(['issue', 'edit', String(existing), '--repo', repo, '--body', fullBody]);
      console.log(`Diagnóstico publicado en issue #${existing}`);
    } else {
      const created = gh(['issue', 'create', '--repo', repo, '--label', 'ci-e2e-diagnostics', '--title', `E2E CI diagnostics (run ${process.env.GITHUB_RUN_ID || ''})`, '--body', fullBody]);
      console.log(`Diagnóstico publicado en ${created.trim()}`);
    }
  } catch (e) {
    const msg = String(e.stderr || e.message || e).slice(0, 300);
    console.error(`::error title=E2E diagnóstico no publicado::${msg.replace(/\n/g, ' ⏎ ')}`);
  }
}

publish();
