import {build} from 'esbuild';
import {chromium} from 'playwright';
import {applyPatch, revertPatch} from './lib/patch.mjs';
import {CASES, OFFSET, PORT, measure} from './lib/measure.mjs';
import {serve} from './lib/server.mjs';

const mode = process.argv[2] ?? 'repro';

const bundle = () =>
  build({
    entryPoints: [new URL('./src/app.tsx', import.meta.url).pathname],
    outfile: new URL('./public/app.js', import.meta.url).pathname,
    bundle: true,
    jsx: 'automatic',
    define: {'process.env.NODE_ENV': '"production"'},
    logLevel: 'warning',
  });

async function run(browser) {
  await bundle();
  return measure(browser);
}

const pad = (s, n) => String(s).padEnd(n);

/** Why a row failed -- misposition and a needless flip are different complaints. */
function reason(r) {
  if (r.placement !== r.expect) {
    return `flipped to ${r.placement} where the static page keeps ${r.expect}`;
  }
  if (r.gap !== OFFSET) return `gap ${r.gap}px, expected ${OFFSET}px`;
  return 'off screen';
}

function table(rows, columns) {
  console.log(columns.map(([h, w]) => pad(h, w)).join(''));
  for (const r of rows) {
    console.log(columns.map(([, w, get]) => pad(get(r), w)).join(''));
  }
}

const server = await serve(PORT);
const browser = await chromium.launch({channel: 'chromium'});

try {
  await revertPatch();
  const stock = await run(browser);

  if (mode === 'repro') {
    console.log(`react-aria as published -- ${CASES.length} placements\n`);
    table(stock, [
      ['case', 28, (r) => r.name],
      ['placement', 11, (r) => r.placement],
      ['expected', 10, (r) => r.expect],
      ['overlay y', 11, (r) => r.overlayY],
      ['gap', 8, (r) => r.gap],
      ['on screen', 11, (r) => r.onScreen],
      ['emitted', 18, (r) => r.emitted],
      ['', 8, (r) => (r.pass ? '' : '<-- BUG')],
    ]);

    const bad = stock.filter((r) => !r.pass);
    console.log(`\nscrollHeight - clientHeight = ${stock[0].overshoot}`);
    console.log(`misplaced: ${bad.length} of ${stock.length}`);
    for (const r of bad) {
      console.log(`  ${r.name}: ${reason(r)}`);
    }
    process.exit(bad.length > 0 ? 1 : 0);
  }

  // verify-fix: same released package, same page, patch applied.
  await applyPatch();
  const patched = await run(browser);
  await revertPatch();

  const merged = stock.map((s, i) => ({...s, stockPass: s.pass, patchedPass: patched[i].pass, patchedGap: patched[i].gap, patchedEmitted: patched[i].emitted, patchedPlacement: patched[i].placement}));

  console.log(`stock vs patched -- ${CASES.length} placements\n`);
  table(merged, [
    ['case', 28, (r) => r.name],
    ['stock', 9, (r) => (r.stockPass ? 'ok' : 'WRONG')],
    ['patched', 9, (r) => (r.patchedPass ? 'ok' : 'WRONG')],
    ['stock gap', 11, (r) => r.gap],
    ['patched gap', 13, (r) => r.patchedGap],
    ['patched emits', 20, (r) => r.patchedEmitted],
  ]);

  const regressed = merged.filter((r) => r.stockPass && !r.patchedPass);
  const fixed = merged.filter((r) => !r.stockPass && r.patchedPass);
  const preExisting = merged.filter((r) => !r.stockPass && !r.patchedPass);

  console.log(`\nfixed by the patch:        ${fixed.length}`);
  for (const r of fixed) console.log(`  ${r.name}: gap ${r.gap} -> ${r.patchedGap}`);
  console.log(`regressed by the patch:    ${regressed.length}`);
  for (const r of regressed) console.log(`  ${r.name}`);
  console.log(`wrong in both (not addressed by this patch): ${preExisting.length}`);
  for (const r of preExisting) {
    console.log(`  ${r.name}: stock ${r.placement}/gap ${r.gap}, patched ${r.patchedPlacement}/gap ${r.patchedGap}`);
  }

  const ok = regressed.length === 0 && fixed.length > 0;
  console.log(`\nfix works and regresses nothing: ${ok}`);
  process.exit(ok ? 0 : 1);
} finally {
  await browser.close();
  server.close();
}
