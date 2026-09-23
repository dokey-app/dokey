import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect } from 'vitest';
import { GATE_MARKER, type GateResult } from '../../../scripts/gates/gate.ts';

// Стенд негативного прогона (D-106 п. 2, US-047 крит. 3). Гейт запускается целиком, отдельным
// процессом, в каталоге временной фикстуры: предмет — `dist` и `.size-limit.json` — он берёт из
// рабочего каталога. Импортом `gate.run()` тот же случай не проверить: код возврата, которым гейт
// валит конвейер, ставит `runGate`, а не `run`.
//
// Процесс асинхронный, а не `spawnSync`: синхронный запуск держит поток воркера, таймер Vitest
// при нём не срабатывает, и случай идёт до конца, утаскивая соседей по файлу (T-241).

const run = promisify(execFile);

/** Гейты, у которых предмет есть уже в Э-0 (`enabledIn: 'Э-0'`). Остальные одиннадцать — `pending`. */
export const GATES: Record<string, string> = {
  'G-02': 'scripts/gates/size.ts',
  'G-06': 'scripts/gates/meta.ts',
};

export interface Verdict extends GateResult {
  id: string;
  claim: string;
}

export interface GateRun {
  /** Код возврата процесса — им гейт валит конвейер. */
  code: number;
  /** Приговор, прочитанный из маркера `__GATE__`. */
  verdict: Verdict;
  out: string;
}

// Приговор берётся из маркера, а не из человеческого текста: вывод без ровно одного маркера —
// исключение, а не пустой приговор. «Пусто» за «проверено» не выдаётся и здесь.
function verdictOf(out: string, id: string): Verdict {
  const marked = out.split(/\r?\n/).filter((line) => line.startsWith(GATE_MARKER));
  const [line] = marked;
  if (line === undefined || marked.length !== 1) {
    throw new Error(
      `${id}: маркеров ${GATE_MARKER} в выводе ${marked.length}, приговора нет:\n${out}`,
    );
  }
  return JSON.parse(line.slice(GATE_MARKER.length)) as Verdict;
}

/** Прогон гейта в каталоге фикстуры: ключи `files` — пути от корня фикстуры. */
export async function gateOn(id: string, files: Record<string, string>): Promise<GateRun> {
  const script = GATES[id];
  if (script === undefined) throw new Error(`гейта ${id} нет в перечне негативного прогона`);
  const gate = resolve(script);
  const root = await mkdtemp(join(tmpdir(), `dokey-${id.toLowerCase()}-`));
  try {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
    const options = {
      cwd: root,
      encoding: 'utf8' as const,
      env: { ...process.env, DOKEY_GATE_JSON: '1' },
    };
    try {
      const { stdout } = await run(process.execPath, ['--experimental-strip-types', gate], options);
      return { code: 0, out: stdout, verdict: verdictOf(stdout, id) };
    } catch (error) {
      const failed = error as {
        code?: unknown;
        signal?: unknown;
        stdout?: string;
        stderr?: string;
      };
      // Процесс, убитый сигналом или не запустившийся, кода не даёт: молча за «поймал» это не
      // сходит.
      if (typeof failed.code !== 'number') {
        throw new Error(
          `${id}: процесс не вернул кода (${String(failed.signal)}):\n${failed.stderr ?? ''}`,
          { cause: error },
        );
      }
      const stdout = failed.stdout ?? '';
      return { code: failed.code, out: stdout, verdict: verdictOf(stdout, id) };
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/**
 * Приговор негативного случая: гейт обязан назвать исход `fail` **и** вернуть код 1. Одного
 * ненулевого кода мало — им же кончается падение процесса, и «красный, потому что сломан»
 * неотличим от «красного, потому что поймал». Возвращается `detail` — по нему случай сверяет,
 * что гейт назвал именно своё нарушение.
 */
export async function failureOf(id: string, files: Record<string, string>): Promise<string> {
  const { code, verdict, out } = await gateOn(id, files);
  expect(verdict.id, out).toBe(id);
  expect(verdict.status, out).toBe('fail');
  expect(code, out).toBe(1);
  return verdict.detail;
}
