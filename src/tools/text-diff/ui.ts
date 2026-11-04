import { copyText } from '../../ui/copy.ts';
import { pick } from '../../ui/dom.ts';
import { diffLines, formatDiff, type DiffLine } from './logic.ts';

const SIGN = { same: '', add: '+', del: '−' };

function lineElement(line: DiffLine): HTMLElement {
  const row = document.createElement('div');
  row.className = `diff-line diff-${line.kind}`;
  const sign = document.createElement('span');
  sign.textContent = SIGN[line.kind];
  const text = document.createElement('span');
  text.textContent = line.text;
  row.append(sign, text);
  return row;
}

const root = document.querySelector<HTMLElement>('[data-diff-tool]');
if (root) mount(root);

function mount(tool: HTMLElement): void {
  const before = pick<HTMLTextAreaElement>(tool, '[data-before]');
  const after = pick<HTMLTextAreaElement>(tool, '[data-after]');
  const list = pick<HTMLElement>(tool, '[data-lines]');
  const summary = pick<HTMLElement>(tool, '[data-summary]');
  const same = pick<HTMLElement>(tool, '[data-same]');
  const errorBox = pick<HTMLElement>(tool, '[data-error]');
  const copy = pick<HTMLButtonElement>(tool, '[data-copy]');

  let current: DiffLine[] = [];
  let timer = 0;

  function run(): void {
    const result = diffLines(before.value, after.value);
    errorBox.hidden = result.ok;
    same.hidden = true;
    if (!result.ok) {
      errorBox.textContent = result.error;
      current = [];
      list.replaceChildren();
      summary.textContent = '+0 −0';
      return;
    }
    current = result.lines;
    summary.textContent = `+${result.added} −${result.removed}`;
    const changed = result.added + result.removed > 0;
    same.hidden = changed || before.value === '';
    list.replaceChildren(...(changed ? result.lines.map(lineElement) : []));
  }

  function flush(): void {
    if (timer === 0) return;
    window.clearTimeout(timer);
    timer = 0;
    run();
  }

  tool.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      run();
    }, 200);
  });

  copy.addEventListener('click', () => {
    flush();
    void copyText(copy, formatDiff(current));
  });
}
