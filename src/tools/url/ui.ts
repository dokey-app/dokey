import { copyText } from '../../ui/copy.ts';
import {
  EXAMPLE,
  detectMode,
  parseUrl,
  percentDecode,
  percentEncode,
  type Component,
  type Mode,
  type QueryRow,
} from './logic.ts';

// Ввод живёт только в переменных модуля и в поле формы: ни storage, ни URL, ни history.

function $<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`URL: нет ${selector}`);
  return found;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function copyButton(text: string, visible: string, label: string): HTMLButtonElement {
  const button = el('button', 'btn btn-small', visible);
  button.type = 'button';
  button.dataset['copyText'] = text;
  button.setAttribute('aria-label', label);
  return button;
}

function componentRow(c: Component): HTMLElement {
  const row = el('div', 'row');
  const dd = el('dd');
  dd.append(
    el('code', undefined, c.value),
    copyButton(c.value, 'Скопировать', `Скопировать: ${c.name}`),
  );
  row.append(el('dt', undefined, c.name), dd);
  return row;
}

function queryRow(q: QueryRow): HTMLTableRowElement {
  const tr = el('tr');
  const key = el('td');
  key.append(el('code', undefined, q.key));
  const value = el('td');
  value.append(el('code', undefined, q.value));
  const actions = el('td', 'cell-actions');
  actions.append(
    copyButton(q.value, 'Значение', `Скопировать значение ${q.key}`),
    copyButton(q.raw, 'Пару', `Скопировать пару ${q.key}`),
  );
  tr.append(key, value, actions);
  return tr;
}

const tool = document.querySelector<HTMLElement>('[data-url-tool]');
if (tool) mount(tool);

function mount(root: HTMLElement): void {
  const input = $<HTMLTextAreaElement>('[data-input]');
  const errorBox = $<HTMLElement>('[data-error]');
  const label = $<HTMLElement>('[data-result-label]');
  const output = $<HTMLPreElement>('[data-output]');
  const parsed = $<HTMLElement>('[data-parsed]');
  const components = $<HTMLElement>('[data-components]');
  const querySection = $<HTMLElement>('[data-query-section]');
  const query = $<HTMLElement>('[data-query]');
  const copy = $<HTMLButtonElement>('[data-copy]');
  const clear = $<HTMLButtonElement>('[data-clear]');

  let userMode: Mode | null = null;
  let mainCopy = '';
  let timer = 0;

  function setMode(mode: Mode): void {
    const radio = root.querySelector<HTMLInputElement>(`input[name="url-mode"][value="${mode}"]`);
    if (radio) radio.checked = true;
  }

  function fail(message: string): void {
    errorBox.hidden = false;
    errorBox.textContent = message;
    output.hidden = true;
    parsed.hidden = true;
    label.textContent = 'Результат';
    mainCopy = '';
    copy.disabled = true;
  }

  function showText(text: string): void {
    errorBox.hidden = true;
    parsed.hidden = true;
    output.hidden = false;
    output.textContent = text;
    label.textContent = 'Результат';
    mainCopy = text;
    copy.disabled = false;
  }

  function showParsed(source: string, isExample: boolean): void {
    const result = parseUrl(source);
    if (!result.ok) {
      fail(result.error);
      return;
    }
    errorBox.hidden = true;
    output.hidden = true;
    parsed.hidden = false;
    components.replaceChildren(...result.components.map(componentRow));
    query.replaceChildren(...result.query.map(queryRow));
    querySection.hidden = result.query.length === 0;
    label.textContent = isExample ? 'Пример' : 'Результат';
    mainCopy = result.href;
    copy.disabled = false;
  }

  function run(): void {
    const source = input.value;
    if (source.trim() === '') {
      if (userMode === null) setMode('parse');
      showParsed(EXAMPLE, true);
      return;
    }
    const mode = userMode ?? detectMode(source);
    setMode(mode);
    if (mode === 'parse') {
      showParsed(source, false);
      return;
    }
    const result = mode === 'decode' ? percentDecode(source) : percentEncode(source);
    if (result.ok) showText(result.text);
    else fail(result.error);
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

  // click, а не change: чипс, уже отмеченный автоопределением, change не порождает,
  // а ручной выбор должен закрепиться и для него. Выбор стрелками тоже даёт click.
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name === 'url-mode') {
      userMode = target.value as Mode;
      window.clearTimeout(timer);
      timer = 0;
      run();
    }
  });

  // Кнопки копирования в строках компонентов и query — и из сборки, и построенные здесь.
  root.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-copy-text]');
    if (button) void copyText(button, button.dataset['copyText'] ?? '');
  });

  copy.addEventListener('click', () => {
    flush();
    void copyText(copy, mainCopy);
  });

  clear.addEventListener('click', () => {
    input.value = '';
    userMode = null;
    run();
    input.focus();
  });

  run();
}
