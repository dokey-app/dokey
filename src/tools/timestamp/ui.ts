import { copyText } from '../../ui/copy.ts';
import { EXAMPLE, detectUnit, parseTimestamp, rows, type Row, type Unit } from './logic.ts';

// Ввод живёт только в переменных модуля и в поле формы: ни storage, ни URL, ни history.

function $<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Timestamp: нет ${selector}`);
  return found;
}

function rowElement(row: Row): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'row';
  const dt = document.createElement('dt');
  dt.textContent = row.name;
  const dd = document.createElement('dd');
  const code = document.createElement('code');
  code.textContent = row.value;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-small';
  button.textContent = 'Скопировать';
  button.dataset['copyName'] = row.name;
  button.setAttribute('aria-label', `Скопировать: ${row.name}`);
  dd.append(code, button);
  wrap.append(dt, dd);
  return wrap;
}

const tool = document.querySelector<HTMLElement>('[data-ts-tool]');
if (tool) mount(tool);

function mount(root: HTMLElement): void {
  const input = $<HTMLInputElement>('[data-input]');
  const units = $<HTMLFieldSetElement>('[data-units]');
  const now = $<HTMLButtonElement>('[data-now]');
  const errorBox = $<HTMLElement>('[data-error]');
  const label = $<HTMLElement>('[data-result-label]');
  const note = $<HTMLElement>('[data-note]');
  const list = $<HTMLElement>('[data-rows]');
  const clear = $<HTMLButtonElement>('[data-clear]');

  let userUnit: Unit | null = null;
  let current: Row[] = [];
  let timer = 0;

  function setUnit(unit: Unit): void {
    const radio = units.querySelector<HTMLInputElement>(`input[value="${unit}"]`);
    if (radio) radio.checked = true;
  }

  function show(ms: number, isExample: boolean): void {
    current = rows(ms, true, Date.now());
    list.replaceChildren(...current.map(rowElement));
    label.textContent = isExample ? 'Пример' : 'Результат';
  }

  function run(): void {
    const text = input.value.trim();
    errorBox.hidden = true;
    note.hidden = true;
    if (text === '') {
      units.hidden = true;
      userUnit = null;
      const example = parseTimestamp(EXAMPLE);
      if (example.ok) show(example.ms, true);
      return;
    }
    const auto = detectUnit(text);
    units.hidden = auto === null && userUnit === null;
    if (auto && userUnit === null) setUnit(auto);
    const parsed = parseTimestamp(text, units.hidden ? null : userUnit);
    if (!parsed.ok) {
      errorBox.hidden = false;
      errorBox.textContent = parsed.error;
      current = [];
      list.replaceChildren();
      label.textContent = 'Результат';
      return;
    }
    if (parsed.source === 'iso') {
      units.hidden = true;
      note.hidden = !parsed.zoneAssumed;
    }
    show(parsed.ms, false);
  }

  function flush(): void {
    if (timer === 0) return;
    window.clearTimeout(timer);
    timer = 0;
    run();
  }

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      run();
    }, 150);
  });

  // click, а не change: чипс, уже выставленный по числу цифр, change не порождает.
  units.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name === 'ts-unit') {
      userUnit = target.value === 'ms' ? 'ms' : 's';
      window.clearTimeout(timer);
      timer = 0;
      run();
    }
  });

  // Строки пересоздаются при пересчёте, поэтому значение берётся по имени строки после flush().
  root.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-copy-name]');
    if (!button) return;
    const name = button.dataset['copyName'];
    flush();
    const row = current.find((r) => r.name === name);
    const target =
      list.querySelector<HTMLButtonElement>(`button[data-copy-name="${CSS.escape(name ?? '')}"]`) ??
      button;
    if (row) void copyText(target, row.value);
  });

  now.addEventListener('click', () => {
    input.value = String(Math.floor(Date.now() / 1000));
    userUnit = null;
    window.clearTimeout(timer);
    timer = 0;
    run();
    input.focus();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    window.clearTimeout(timer);
    timer = 0;
    run();
    input.focus();
  });

  run();
}
