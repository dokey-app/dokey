import { spawnSync } from 'node:child_process';
import { GATE_MARKER, type GateResult } from './gate.ts';

// Все четырнадцать адресов гейтов заведены в Э-0; исполняются те, у кого есть предмет
// (implementation-plan §2.2). Пустой гейт печатает этап включения — иначе через месяц
// «зелёный, потому что проверено» не отличается от «зелёного, потому что пусто».
//
// Каждый гейт идёт отдельным процессом: гейт, поднимающий браузер, обязан валить себя,
// а не весь прогон, — иначе один упавший инструмент прячет исход тринадцати остальных.
const GATES = [
  { id: 'G-01', command: 'gate:lh', file: 'lighthouse.ts' },
  { id: 'G-02', command: 'gate:size', file: 'size.ts' },
  { id: 'G-03', command: 'gate:persist', file: 'persistence.ts' },
  { id: 'G-04', command: 'gate:egress', file: 'egress.ts' },
  { id: 'G-05', command: 'gate:fields', file: 'fields.ts' },
  { id: 'G-06', command: 'gate:meta', file: 'meta.ts' },
  { id: 'G-07', command: 'gate:sitemap', file: 'sitemap.ts' },
  { id: 'G-08', command: 'gate:ladder', file: 'ladder.ts' },
  { id: 'G-09', command: 'gate:a11y', file: 'a11y.ts' },
  { id: 'G-10', command: 'gate:provisional', file: 'provisional.ts' },
  { id: 'G-11', command: 'gate:nomouse', file: 'no-mouse.ts' },
  { id: 'G-12', command: 'gate:words', file: 'marker-words.ts' },
  { id: 'G-13', command: 'gate:subset', file: 'font-subset.ts' },
  { id: 'G-14', command: 'gate:toolids', file: 'tool-ids.ts' },
] as const;

const MARK: Record<GateResult['status'], string> = {
  pass: 'OK    ',
  skip: 'ПУСТО ',
  fail: 'ПРОВАЛ',
};

interface Reported extends GateResult {
  id: string;
  claim: string;
}

const results: { command: string; report: Reported }[] = [];

for (const entry of GATES) {
  const child = spawnSync(
    process.execPath,
    ['--experimental-strip-types', `scripts/gates/${entry.file}`],
    { encoding: 'utf8', env: { ...process.env, DOKEY_GATE_JSON: '1' } },
  );
  const output = `${child.stdout ?? ''}${child.stderr ?? ''}`;
  const marker = output
    .split('\n')
    .findLast((line) => line.startsWith(GATE_MARKER))
    ?.slice(GATE_MARKER.length);

  const report: Reported = marker
    ? (JSON.parse(marker) as Reported)
    : {
        id: entry.id,
        claim: '(гейт не отчитался)',
        status: 'fail',
        detail: `процесс завершился с кодом ${child.status} и не оставил результата`,
      };
  results.push({ command: entry.command, report });
}

console.log('\nЧетырнадцать гейтов TECH-06\n');
for (const { report } of results) {
  const head = report.detail.split('\n')[0] ?? '';
  console.log(`${MARK[report.status]} ${report.id.padEnd(5)} ${report.claim.padEnd(46)} ${head}`);
}

const failed = results.filter((entry) => entry.report.status === 'fail');
const skipped = results.filter((entry) => entry.report.status === 'skip');

console.log(
  `\nисполнено ${results.length - failed.length - skipped.length},` +
    ` пусто ${skipped.length}, провалено ${failed.length}`,
);

if (skipped.length > 0) {
  console.log('\nВыключены — предмета ещё нет:');
  for (const { command, report } of skipped) {
    console.log(`  ${report.id} ${command.padEnd(18)} ${report.detail}`);
  }
}

if (failed.length > 0) {
  console.log('\nПровалены:');
  for (const { report } of failed) console.log(`  ${report.id} — ${report.detail}`);
  process.exit(1);
}
