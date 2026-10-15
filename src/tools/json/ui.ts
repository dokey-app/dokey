import { copyText } from '../../ui/copy.ts';
import {
  EXAMPLE,
  HARD_LIMIT_BYTES,
  SOFT_LIMIT_BYTES,
  describeError,
  parseJson,
  stringify,
  utf8Bytes,
  type JsonError,
} from './logic.ts';
import { bindSelection, renderTree } from './tree.ts';

// Состояние ввода живёт только в переменных этого модуля: ни storage, ни URL, ни history.

const root = document.querySelector<HTMLElement>('[data-json-tool]');
if (root) mount(root);

function $<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`JSON Workbench: нет ${selector}`);
  return found;
}

function mount(tool: HTMLElement): void {
  const input = $<HTMLTextAreaElement>('[data-input]');
  const output = $<HTMLPreElement>('[data-output]');
  const label = $<HTMLElement>('[data-result-label]');
  const errorBox = $<HTMLElement>('[data-error]');
  const errorText = $<HTMLElement>('[data-error-text]');
  const gotoError = $<HTMLButtonElement>('[data-goto-error]');
  const threshold = $<HTMLElement>('[data-threshold]');
  const thresholdText = $<HTMLElement>('[data-threshold-text]');
  const processButton = $<HTMLButtonElement>('[data-process]');
  const sort = $<HTMLInputElement>('[data-sort]');
  const copy = $<HTMLButtonElement>('[data-copy]');
  const clear = $<HTMLButtonElement>('[data-clear]');
  const treeSection = $<HTMLElement>('[data-tree-section]');
  const treeBox = $<HTMLElement>('[data-tree]');
  const expand = $<HTMLButtonElement>('[data-expand]');
  const collapse = $<HTMLButtonElement>('[data-collapse]');
  const selectedPath = $<HTMLElement>('[data-selected-path]');
  const copyPath = $<HTMLButtonElement>('[data-copy-path]');

  let tree: ReturnType<typeof renderTree> | null = null;
  let lastError: JsonError | null = null;
  let timer = 0;

  const mb = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
  const formatMb = (bytes: number): string => `${mb.format(bytes / 1_000_000)} МБ`;

  const mode = (): 'format' | 'minify' =>
    tool.querySelector<HTMLInputElement>('input[name="json-mode"]:checked')?.value === 'minify'
      ? 'minify'
      : 'format';

  function showError(error: JsonError | null): void {
    lastError = error;
    errorBox.hidden = error === null;
    errorText.textContent = error ? describeError(error) : '';
  }

  function showThreshold(text: string | null, canProcess: boolean): void {
    threshold.hidden = text === null;
    thresholdText.textContent = text ?? '';
    processButton.hidden = !canProcess;
  }

  function render(source: string, isExample: boolean): void {
    const result = parseJson(source);
    if (!result.ok) {
      showError(result.error);
      output.textContent = '';
      label.textContent = 'Результат';
      copy.disabled = true;
      treeSection.hidden = true;
      return;
    }
    showError(null);
    const indent = mode() === 'minify' ? 0 : 2;
    output.textContent = stringify(result.value, { indent, sortKeys: sort.checked });
    label.textContent = isExample ? 'Пример' : 'Результат';
    copy.disabled = false;
    tree = renderTree(treeBox, result.value);
    selectedPath.textContent = '$';
    expand.hidden = !tree.canExpandAll;
    treeSection.hidden = false;
  }

  function run(force = false): void {
    const source = input.value;
    if (source.trim() === '') {
      showThreshold(null, false);
      render(EXAMPLE, true);
      return;
    }
    // Длина в UTF-16 × 3 — верхняя граница байт UTF-8: точный счёт нужен только у порога.
    const bytes = source.length * 3 < SOFT_LIMIT_BYTES ? 0 : utf8Bytes(source);
    if (bytes > HARD_LIMIT_BYTES) {
      showThreshold(
        `Документ ${formatMb(bytes)} — больше порога ${formatMb(HARD_LIMIT_BYTES)}. Такой объём вкладка не обработает`,
        false,
      );
      return;
    }
    if (bytes > SOFT_LIMIT_BYTES && !force) {
      showThreshold(
        `Документ ${formatMb(bytes)} — больше порога ${formatMb(SOFT_LIMIT_BYTES)}. Обработка займёт несколько секунд`,
        true,
      );
      return;
    }
    showThreshold(null, false);
    render(source, false);
  }

  function schedule(): void {
    window.clearTimeout(timer);
    // Большой документ не пересчитывается на каждое нажатие клавиши.
    const delay = input.value.length > 100_000 ? 400 : 150;
    timer = window.setTimeout(() => {
      timer = 0;
      run();
    }, delay);
  }

  // Действие над результатом не должно опередить отложенный пересчёт: иначе скопируется
  // или подсветится результат предыдущего ввода.
  function flush(): void {
    if (timer === 0) return;
    window.clearTimeout(timer);
    timer = 0;
    run();
  }

  input.addEventListener('input', schedule);
  tool.addEventListener('change', (event) => {
    if (event.target !== input) run();
  });
  processButton.addEventListener('click', () => run(true));

  gotoError.addEventListener('click', () => {
    flush();
    if (!lastError) return;
    input.focus();
    input.setSelectionRange(lastError.offset, Math.min(lastError.offset + 1, input.value.length));
  });

  copy.addEventListener('click', () => {
    flush();
    void copyText(copy, output.textContent ?? '');
  });

  clear.addEventListener('click', () => {
    input.value = '';
    run();
    input.focus();
  });

  expand.addEventListener('click', () => tree?.expandAll());
  collapse.addEventListener('click', () => tree?.collapseAll());
  bindSelection(treeBox, (path) => {
    selectedPath.textContent = path;
  });
  copyPath.addEventListener(
    'click',
    () => void copyText(copyPath, selectedPath.textContent ?? '$'),
  );

  run();
}
