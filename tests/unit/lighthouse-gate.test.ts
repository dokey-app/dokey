import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { RUNS, shortOfRuns } from '../../scripts/gates/lighthouse.ts';

// RUN-01. Устойчивость приговора G-01 (T-229). Приговор считается по медиане прогонов
// одного адреса, и держится он на двух настройках: `aggregationMethod: median` в утверждениях
// и число прогонов, попадающих в одну группу. `lhci assert` делит отчёты по `finalUrl`
// целиком, вместе с портом (`@lhci/utils/src/assertions.js`, `getAllAssertionResults` —
// `_.groupBy(lhrs, lhr => lhr.finalUrl)`), а свой сервер `lhci collect` поднимает на
// случайном порту (`collect/fallback-server.js`, `server.listen(0)`). Отсюда правило:
// все прогоны маршрута снимаются одним вызовом `lhci collect`, иначе групп столько же,
// сколько прогонов, и медиана в каждой считается по одному значению.

interface Rc {
  ci: {
    collect: { numberOfRuns: number };
    assert: { aggregationMethod: string };
  };
}

async function rc(): Promise<Rc> {
  return JSON.parse(await readFile('lighthouserc.json', 'utf8')) as Rc;
}

describe('G-01: медиана считается по прогонам одного адреса', () => {
  // Число прогонов и пороги — предмет решения, а не настройки: T-229 требует вопроса Q-NN
  // до того, как их двинут (D-100, NFR-04). Тест держит число на месте, а не одобряет его.
  it('прогонов на маршрут — три, и все берутся одним сбором', async () => {
    expect((await rc()).ci.collect.numberOfRuns).toBe(3);
    expect(RUNS).toBe(3);
  });

  it('утверждения считаются по медиане', async () => {
    expect((await rc()).ci.assert.aggregationMethod).toBe('median');
  });

  // Дефект T-229: три отдельных вызова `lhci collect` дали три порта, шесть групп по одному
  // отчёту вместо двух по три, и любой единственный неудачный прогон красил гейт
  // (`categories:performance` 0.85 и 0.77 против 0.95 на прогонах PR #1, при перезапуске зелено).
  it('видит вырожденную медиану: свой порт у каждого прогона', () => {
    const urls = [54_913, 57_398, 63_742].flatMap((port) => [
      `http://localhost:${port}/index.html`,
      `http://localhost:${port}/health/index.html`,
    ]);
    expect(shortOfRuns(urls, RUNS)).toHaveLength(6);
    expect(shortOfRuns(urls, RUNS)[0]).toContain('отчётов 1, а не 3');
  });

  it('видит недобранный прогон: отчётов меньше числа прогонов', () => {
    const urls = [
      'http://localhost:54913/index.html',
      'http://localhost:54913/index.html',
      'http://localhost:54913/index.html',
      'http://localhost:54913/health/index.html',
      'http://localhost:54913/health/index.html',
    ];
    expect(shortOfRuns(urls, RUNS)).toEqual([
      'http://localhost:54913/health/index.html: отчётов 2, а не 3',
    ]);
  });

  it('молчит на полном наборе: один порт, три прогона на каждый маршрут', () => {
    const urls = ['/index.html', '/health/index.html'].flatMap((path) =>
      Array.from({ length: RUNS }, () => `http://localhost:54913${path}`),
    );
    expect(shortOfRuns(urls, RUNS)).toEqual([]);
  });
});
