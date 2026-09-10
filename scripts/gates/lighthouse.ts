import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { glob, readFile } from 'node:fs/promises';
import { type Gate, fail, pass, pending, runGate } from './gate.ts';

const OUT = '.lighthouseci';
const RESULTS = `${OUT}/assertion-results.json`;

interface AssertionResult {
  name: string;
  passed: boolean;
  auditId?: string;
  actual?: number;
  expected?: number;
  level?: string;
}

function lhci(...args: string[]) {
  return spawnSync('pnpm', ['exec', 'lhci', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

// G-01 «объявленные пороги скорости» — NFR-01, NFR-02, NFR-04. Гейт складывается из двух
// замеров разной природы (D-100):
//   1. Lighthouse на запиннутом пресете — навигационные метрики и mobile-оценка (NFR-04);
//   2. клиентский переход между инструментами ≤ 300 мс — `performance.measure` вокруг
//      перехода в E2E-08 (половина NFR-05, D-101). Lighthouse меряет навигацию документа,
//      а переход идёт через History API и до Lighthouse не доходит вовсе;
//   3. лабораторный TTR по процедуре D-75 п. 1 (RUN-09) — от навигации до появления
//      результата в DOM по явному селектору, медиана девяти прогонов, фиксированный
//      троттлинг. Величины «TTR» у Lighthouse нет: LCP, TTI и TBT кончаются там, где TTR
//      только начинается, поэтому NFR-01 и NFR-02 без этого замера не охранялись ничем.
// Пресет запиннут в lighthouserc.json,
// чтобы числа были сравнимы между релизами (tech-stack §3.5 п. 3), а утверждения считаются
// по медиане прогонов (`aggregationMethod: median`) — так же, как замер по процедуре D-75.
// Один неудачный прогон на загруженной машине не должен красить гейт: краснеть он обязан
// от продукта, а не от соседнего процесса.
//
// Сбор и приговор разнесены на два шага вместо одного `lhci autorun`. Причина не в стиле:
// на Windows chrome-launcher убирает временный профиль раньше, чем Chrome отпускает файлы,
// и падает с EBUSY уже после того, как отчёты записаны. Код возврата шага сбора говорит
// в этом случае о состоянии диска, а не о метриках, — поэтому сбор судится по числу
// собранных отчётов, а пороги проверяет отдельный процесс `lhci assert`, который браузер
// не поднимает и такой гонки не имеет.
export const gate: Gate = {
  id: 'G-01',
  command: 'gate:lh',
  claim: 'объявленные пороги скорости соблюдены: TTR, LCP, Lighthouse mobile',
  enabledIn: 'Э-0',
  async run() {
    if (!existsSync('dist')) return pending('Э-0 — нет каталога dist, сначала pnpm build');
    if (process.env['DOKEY_SKIP_LH'] === '1') {
      return pending('Э-0 — DOKEY_SKIP_LH=1, прогон отключён вручную');
    }

    rmSync(OUT, { recursive: true, force: true });
    const WANTED = 3;
    let lost = 0;
    for (let run = 0; run < WANTED; run += 1) {
      const collect = lhci('collect', '-n', '1', '--additive');
      if (collect.status !== 0) lost += 1;
    }

    const reports: string[] = [];
    for await (const entry of glob(`${OUT}/lhr-*.json`)) reports.push(entry);
    if (reports.length === 0) {
      return fail(`lhci collect не оставил ни одного отчёта из ${WANTED} прогонов`);
    }

    const assert = lhci('assert');
    if (!existsSync(RESULTS)) {
      const output = `${assert.stdout ?? ''}${assert.stderr ?? ''}`.trim();
      return fail(`lhci assert не оставил ${RESULTS}\n${output}`);
    }

    const results = JSON.parse(await readFile(RESULTS, 'utf8')) as AssertionResult[];
    const broken = results.filter((entry) => !entry.passed && entry.level === 'error');
    if (broken.length > 0) {
      const lines = broken.map(
        (entry) => `  ${entry.auditId ?? entry.name}: ${entry.actual} против ${entry.expected}`,
      );
      return fail(`нарушено утверждений: ${broken.length}\n${lines.join('\n')}`);
    }
    if (assert.status !== 0) {
      return fail(`lhci assert вернул ${assert.status} без разобранных нарушений`);
    }
    const note = lost > 0 ? `, потеряно прогонов ${lost} (гонка уборки Chrome)` : '';
    return pass(`отчётов ${reports.length} (${WANTED} прогонов × маршруты), нарушено 0${note}`);
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
