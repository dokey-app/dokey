import { copyText } from '../../ui/copy.ts';
import { parseCount, pick } from '../../ui/dom.ts';
import { obfuscate } from './logic.ts';

const root = document.querySelector<HTMLElement>('[data-obfuscator-tool]');
if (root) mount(root);

function mount(tool: HTMLElement): void {
  const input = pick<HTMLTextAreaElement>(tool, '[data-input]');
  const first = pick<HTMLInputElement>(tool, '[data-first]');
  const last = pick<HTMLInputElement>(tool, '[data-last]');
  const spaces = pick<HTMLInputElement>(tool, '[data-spaces]');
  const output = pick<HTMLElement>(tool, '[data-output]');
  const errorBox = pick<HTMLElement>(tool, '[data-error]');
  const copy = pick<HTMLButtonElement>(tool, '[data-copy]');

  function run(): void {
    const keepFirst = parseCount(first.value, 0, 1000);
    const keepLast = parseCount(last.value, 0, 1000);
    const valid = keepFirst !== null && keepLast !== null;
    errorBox.hidden = valid;
    if (!valid) {
      errorBox.textContent = 'Сколько оставить — целое число от 0 до 1000';
      output.textContent = '';
      return;
    }
    output.textContent = obfuscate(input.value, {
      keepFirst,
      keepLast,
      keepSpaces: spaces.checked,
    });
  }

  tool.addEventListener('input', run);
  copy.addEventListener('click', () => void copyText(copy, output.textContent ?? ''));
  // Сюда вставляют то, что хотят скрыть: bfcache не должен сохранить это после ухода.
  window.addEventListener('pagehide', () => {
    input.value = '';
    output.textContent = '';
  });
  run();
}
