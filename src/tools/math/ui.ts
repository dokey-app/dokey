import { copyText } from '../../ui/copy.ts';
import { pick } from '../../ui/dom.ts';
import { evaluate } from './logic.ts';

const EXAMPLE = '2 ^ 10 + sqrt(16)';

const root = document.querySelector<HTMLElement>('[data-math-tool]');
if (root) mount(root);

function mount(tool: HTMLElement): void {
  const input = pick<HTMLInputElement>(tool, '[data-input]');
  const output = pick<HTMLElement>(tool, '[data-output]');
  const label = pick<HTMLElement>(tool, '[data-label]');
  const errorBox = pick<HTMLElement>(tool, '[data-error]');
  const copy = pick<HTMLButtonElement>(tool, '[data-copy]');

  function run(): void {
    const empty = input.value.trim() === '';
    const result = evaluate(empty ? EXAMPLE : input.value);
    label.textContent = empty ? 'Пример' : 'Результат';
    errorBox.hidden = result.ok;
    input.setAttribute('aria-invalid', String(!result.ok));
    if (result.ok) {
      output.textContent = result.text;
      return;
    }
    output.textContent = '';
    errorBox.textContent = `${result.error}. Позиция ${result.position}`;
  }

  input.addEventListener('input', run);
  copy.addEventListener('click', () => void copyText(copy, output.textContent ?? ''));
}
