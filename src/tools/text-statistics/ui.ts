import { pick } from '../../ui/dom.ts';
import { textStats, type TextStats } from './logic.ts';

const root = document.querySelector<HTMLElement>('[data-stats-tool]');
if (root) mount(root);

function mount(tool: HTMLElement): void {
  const input = pick<HTMLTextAreaElement>(tool, '[data-input]');
  const cells = [...tool.querySelectorAll<HTMLElement>('[data-stat]')];

  function run(): void {
    const stats = textStats(input.value);
    for (const cell of cells) {
      cell.textContent = String(stats[cell.dataset['stat'] as keyof TextStats]);
    }
  }

  input.addEventListener('input', run);
  pick<HTMLButtonElement>(tool, '[data-clear]').addEventListener('click', () => {
    input.value = '';
    run();
    input.focus();
  });
  run();
}
