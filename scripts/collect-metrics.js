#!/usr/bin/env node
// Aggregates Playwright JSON report and prints a tiny summary for CI artifact
const fs = require('fs');

function readJson(path) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); } catch (_) { return null; }
}

const pw = readJson('test-results/playwright.json');
let total = 0, passed = 0, failed = 0;
if (pw && Array.isArray(pw.suites)) {
  const walk = (s) => {
    if (s.suites) s.suites.forEach(walk);
    if (s.specs) s.specs.forEach(spec => {
      spec.tests.forEach(t => {
        total += 1;
        const status = t.results?.[0]?.status || 'unknown';
        if (status === 'passed') passed += 1; else if (status === 'failed') failed += 1;
      });
    });
  };
  pw.suites.forEach(walk);
}

const summary = { total, passed, failed, timestamp: new Date().toISOString() };
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/summary.json', JSON.stringify(summary, null, 2));
console.log('Test summary:', summary);
