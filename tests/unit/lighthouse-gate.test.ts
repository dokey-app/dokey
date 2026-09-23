import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type Collect,
  RUNS,
  htmlFiles,
  plannedRoutes,
  profileCleanupRace,
  shortOfRuns,
} from '../../scripts/gates/lighthouse.ts';

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
    collect: Collect;
    assert: { aggregationMethod: string };
  };
}

async function rc(): Promise<Rc> {
  return JSON.parse(await readFile('lighthouserc.json', 'utf8')) as Rc;
}

/** Набор отчётов «столько-то прогонов на адрес», как его отдаёт `collected()`. */
function collected(runsByPath: Record<string, number>, port = 54_913): string[] {
  return Object.entries(runsByPath).flatMap(([path, count]) =>
    Array.from({ length: count }, () => `http://localhost:${port}${path}`),
  );
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
    const planned = ['/index.html', '/health/index.html'];
    const urls = [54_913, 57_398, 63_742].flatMap((port) =>
      planned.map((path) => `http://localhost:${port}${path}`),
    );
    expect(shortOfRuns(urls, RUNS, planned)).toHaveLength(6);
    expect(shortOfRuns(urls, RUNS, planned)[0]).toContain('отчётов 1, а не 3');
  });

  it('видит недобранный прогон: отчётов меньше числа прогонов', () => {
    const urls = collected({ '/index.html': 3, '/health/index.html': 2 });
    expect(shortOfRuns(urls, RUNS, ['/index.html', '/health/index.html'])).toEqual([
      'http://localhost:54913/health/index.html: отчётов 2, а не 3',
    ]);
  });

  // Дефект T-229 (вторая находка): счёт вёлся только по адресам, у которых есть хоть один
  // отчёт, — маршрут с нулём отчётов в Map не попадал вовсе. Путь реален: `runOnUrl`
  // (`@lhci/cli/src/collect/collect.js`) бросает на первом же неудачном прогоне, цикл по
  // urls в `runCommand` обрывается, и отчёты предыдущих адресов остаются на диске. Набор
  // «три отчёта на `/` и ноль на `/health`» проходил как полный, а `lhci assert` судил
  // один маршрут из двух.
  it('видит маршрут, по которому отчётов нет вовсе', () => {
    const planned = ['/index.html', '/health/index.html'];
    const short = shortOfRuns(collected({ '/index.html': RUNS }), RUNS, planned);
    expect(short).toHaveLength(1);
    expect(short[0]).toContain('/health/index.html');
    expect(short[0]).toContain('отчётов 0');
  });

  it('видит лишний адрес: отчёт по маршруту, которого нет в плане сбора', () => {
    const short = shortOfRuns(collected({ '/index.html': RUNS, '/404.html': RUNS }), RUNS, [
      '/index.html',
    ]);
    expect(short).toHaveLength(1);
    expect(short[0]).toContain('/404.html');
  });

  it('молчит на полном наборе: один порт, три прогона на каждый маршрут', () => {
    const planned = ['/index.html', '/health/index.html'];
    const urls = collected({ '/index.html': RUNS, '/health/index.html': RUNS });
    expect(shortOfRuns(urls, RUNS, planned)).toEqual([]);
  });
});

describe('G-01: список маршрутов берётся из источника сбора, а не из гейта', () => {
  it('план — это html-файлы каталога сборки по пресету', async () => {
    const collect = (await rc()).ci.collect;
    expect(plannedRoutes(collect, ['index.html', 'health/index.html'])).toEqual([
      '/index.html',
      '/health/index.html',
    ]);
    // Появился маршрут в сборке — появился и в плане: руками список не правится.
    expect(plannedRoutes(collect, ['index.html', 'tools/json/index.html'])).toEqual([
      '/index.html',
      '/tools/json/index.html',
    ]);
  });

  it('план повторяет отбор @lhci/cli: чёрный список, потолок автопоиска, явные адреса', () => {
    const files = ['a.html', 'b.html', 'c.html'];
    const base: Collect = { numberOfRuns: RUNS, staticDistDir: 'dist' };
    expect(plannedRoutes({ ...base, autodiscoverUrlBlocklist: '/b.html' }, files)).toEqual([
      '/a.html',
      '/c.html',
    ]);
    expect(plannedRoutes({ ...base, maxAutodiscoverUrls: 2 }, files)).toEqual([
      '/a.html',
      '/b.html',
    ]);
    expect(plannedRoutes({ ...base, url: 'http://localhost/x.html' }, files)).toEqual(['/x.html']);
  });

  it('html-файлы ищутся так же, как их ищет `lhci collect`', () => {
    const root = mkdtempSync(join(tmpdir(), 'dokey-lh-'));
    mkdirSync(join(root, 'health'));
    mkdirSync(join(root, 'tools', 'json'), { recursive: true });
    mkdirSync(join(root, 'node_modules'));
    writeFileSync(join(root, 'index.html'), '');
    writeFileSync(join(root, 'robots.txt'), '');
    writeFileSync(join(root, 'health', 'index.html'), '');
    writeFileSync(join(root, 'tools', 'json', 'index.html'), '');
    writeFileSync(join(root, 'node_modules', 'x.html'), '');

    expect(htmlFiles(root, 2).toSorted()).toEqual([
      'health/index.html',
      'index.html',
      'tools/json/index.html',
    ]);
    // Глубина ограничивает обход ровно так же, как `staticDirFileDiscoveryDepth`.
    expect(htmlFiles(root, 0)).toEqual(['index.html']);
  });
});

describe('G-01: ненулевой код сбора списывается только на уборку профиля Chrome', () => {
  const tail = String.raw`Error: EBUSY: resource busy or locked, rmdir 'C:\Users\r\AppData\Local\Temp\lighthouse.1234567'`;
  const collectLog = [
    'Started a web server on port 54913...',
    'Running Lighthouse 3 time(s) on http://localhost:54913/index.html',
    'Running Lighthouse 3 time(s) on http://localhost:54913/health/index.html',
    'Done running Lighthouse!',
  ].join('\n');

  it('уборка профиля после полного обхода адресов — списывается', () => {
    expect(profileCleanupRace(`${collectLog}\n${tail}`, 'win32')).toBe(true);
  });

  it('вне Windows такой гонки нет — код разбирается, а не списывается', () => {
    expect(profileCleanupRace(`${collectLog}\n${tail}`, 'linux')).toBe(false);
  });

  // Тот самый случай из /check: сбор оборвался на маршруте, «Done running Lighthouse!»
  // не напечатано, а отчёты предыдущего адреса лежат на диске.
  it('обрыв обхода адресов не списывается, даже если ошибка про профиль', () => {
    const broken = [
      'Started a web server on port 54913...',
      'Running Lighthouse 3 time(s) on http://localhost:54913/index.html',
      tail,
    ].join('\n');
    expect(profileCleanupRace(broken, 'win32')).toBe(false);
  });

  it('другая ошибка после полного обхода не списывается', () => {
    const other = `${collectLog}\nError: connect ECONNREFUSED 127.0.0.1:54913`;
    expect(profileCleanupRace(other, 'win32')).toBe(false);
  });
});
