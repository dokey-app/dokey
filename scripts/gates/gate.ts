// Общий каркас гейтов G-01…G-14 (test-plan §? «четырнадцать гейтов получают адреса»).
// Гейт возвращает один из трёх исходов: pass — предмет есть и он в порядке;
// skip — предмета ещё нет, гейт включается в названном этапе; fail — нарушение.

export type GateStatus = 'pass' | 'skip' | 'fail';

export interface GateResult {
  status: GateStatus;
  detail: string;
}

export interface Gate {
  /** Адрес гейта: G-01…G-14. */
  id: string;
  /** Команда пакета, которой гейт вызывается поодиночке. */
  command: string;
  /** Что гейт утверждает — формулировка test-plan. */
  claim: string;
  /** Этап, в котором у гейта появляется предмет. 'Э-0' — работает уже сейчас. */
  enabledIn: string;
  run(): Promise<GateResult> | GateResult;
}

/** Исход «предмета ещё нет»: гейт заведён адресом, но проверять нечего. */
export function pending(stage: string): GateResult {
  return { status: 'skip', detail: `нечего проверять — включается в ${stage}` };
}

export function pass(detail: string): GateResult {
  return { status: 'pass', detail };
}

export function fail(detail: string): GateResult {
  return { status: 'fail', detail };
}

/** Маркер машинного вывода: по нему общий раннер читает исход дочернего процесса. */
export const GATE_MARKER = '__GATE__';

/** Запуск одиночного гейта из его собственной команды `pnpm gate:*`. */
export async function runGate(gate: Gate): Promise<void> {
  const result = await gate.run();
  const mark = result.status === 'pass' ? 'OK  ' : result.status === 'skip' ? 'ПУСТО' : 'ПРОВАЛ';
  console.log(`${mark} ${gate.id} ${gate.claim} — ${result.detail}`);
  if (process.env['DOKEY_GATE_JSON'] === '1') {
    console.log(GATE_MARKER + JSON.stringify({ id: gate.id, claim: gate.claim, ...result }));
  }
  process.exitCode = result.status === 'fail' ? 1 : 0;
}
