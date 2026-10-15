import { copyText } from '../../ui/copy.ts';
import { announce } from '../../ui/status.ts';
import { createGenerator, inspect, parseCount, type Field, type Kind } from './logic.ts';

// Сгенерированные значения и проверяемый ввод живут только в переменных модуля и в DOM.

function $<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`UUID: нет ${selector}`);
  return found;
}

function valueItem(value: string, index: number): HTMLLIElement {
  const li = document.createElement('li');
  const code = document.createElement('code');
  code.textContent = value;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-small';
  button.textContent = 'Скопировать';
  button.dataset['copyText'] = value;
  button.setAttribute('aria-label', `Скопировать значение ${index + 1}`);
  li.append(code, button);
  return li;
}

function fieldRow(field: Field): HTMLElement {
  const row = document.createElement('div');
  row.className = 'row';
  const dt = document.createElement('dt');
  dt.textContent = field.name;
  const dd = document.createElement('dd');
  const code = document.createElement('code');
  code.textContent = field.value;
  dd.append(code);
  row.append(dt, dd);
  return row;
}

const tool = document.querySelector<HTMLElement>('[data-uuid-tool]');
if (tool) mount(tool);

function mount(root: HTMLElement): void {
  const kinds = $<HTMLFieldSetElement>('[data-kind]');
  const count = $<HTMLInputElement>('[data-count]');
  const generate = $<HTMLButtonElement>('[data-generate]');
  const countError = $<HTMLElement>('[data-count-error]');
  const unavailable = $<HTMLElement>('[data-unavailable]');
  const copyAll = $<HTMLButtonElement>('[data-copy-all]');
  const list = $<HTMLOListElement>('[data-values]');
  const inspectInput = $<HTMLInputElement>('[data-inspect]');
  const inspectError = $<HTMLElement>('[data-inspect-error]');
  const fields = $<HTMLElement>('[data-fields]');

  // Подделывать случайность нельзя: без getRandomValues значений нет вовсе.
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    unavailable.hidden = false;
    generate.disabled = true;
    kinds.disabled = true;
    count.disabled = true;
  }
  const generator = createGenerator((bytes) => {
    crypto.getRandomValues(bytes);
  });

  let values: string[] = [];
  let timer = 0;

  const kind = (): Kind => {
    const value = root.querySelector<HTMLInputElement>('input[name="uuid-kind"]:checked')?.value;
    return value === 'v7' || value === 'ulid' ? value : 'v4';
  };

  function run(): void {
    if (generate.disabled) return;
    const parsed = parseCount(count.value);
    countError.hidden = parsed.ok;
    countError.textContent = parsed.ok ? '' : parsed.error;
    count.setAttribute('aria-invalid', String(!parsed.ok));
    if (!parsed.ok) return;
    const k = kind();
    values = Array.from({ length: parsed.count }, () => generator.next(k));
    list.replaceChildren(...values.map(valueItem));
    copyAll.disabled = false;
    announce(
      values.length === 1 ? 'Сгенерировано значение' : `Сгенерировано значений: ${values.length}`,
    );
  }

  generate.addEventListener('click', run);
  count.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') run();
  });
  // click, а не change: повторный клик по выбранному чипсу тоже даёт новый пакет.
  kinds.addEventListener('click', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === 'uuid-kind') run();
  });

  root.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-copy-text]');
    if (button) void copyText(button, button.dataset['copyText'] ?? '');
  });
  copyAll.addEventListener('click', () => void copyText(copyAll, values.join('\n')));

  function runInspect(): void {
    const text = inspectInput.value;
    if (text.trim() === '') {
      inspectError.hidden = true;
      fields.replaceChildren();
      return;
    }
    const result = inspect(text);
    inspectError.hidden = result.ok;
    inspectError.textContent = result.ok ? '' : result.error;
    fields.replaceChildren(...(result.ok ? result.fields.map(fieldRow) : []));
  }

  inspectInput.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(runInspect, 150);
  });

  run();
}
