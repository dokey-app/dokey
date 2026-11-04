import { copyText } from '../../ui/copy.ts';
import { pick } from '../../ui/dom.ts';
import { numeronym } from './logic.ts';

const EXAMPLE = 'internationalization';

const root = document.querySelector<HTMLElement>('[data-numeronym-tool]');
if (root) mount(root);

function mount(tool: HTMLElement): void {
  const input = pick<HTMLInputElement>(tool, '[data-input]');
  const output = pick<HTMLElement>(tool, '[data-output]');
  const label = pick<HTMLElement>(tool, '[data-label]');
  const copy = pick<HTMLButtonElement>(tool, '[data-copy]');

  input.addEventListener('input', () => {
    const empty = input.value === '';
    output.textContent = numeronym(empty ? EXAMPLE : input.value);
    label.textContent = empty ? 'Пример' : 'Результат';
  });
  copy.addEventListener('click', () => void copyText(copy, output.textContent ?? ''));
}
