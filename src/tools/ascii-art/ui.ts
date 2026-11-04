import { copyText } from '../../ui/copy.ts';
import { pick } from '../../ui/dom.ts';
import { hasUnsupported, isFontName, type FontName } from './logic.ts';

const EXAMPLE = 'DoKey';

const root = document.querySelector<HTMLElement>('[data-ascii-tool]');
if (root) void mount(root);

async function mount(tool: HTMLElement): Promise<void> {
  const input = pick<HTMLTextAreaElement>(tool, '[data-input]');
  const fonts = pick<HTMLFieldSetElement>(tool, '[data-fonts]');
  const output = pick<HTMLElement>(tool, '[data-output]');
  const label = pick<HTMLElement>(tool, '[data-label]');
  const warning = pick<HTMLElement>(tool, '[data-warning]');
  const copy = pick<HTMLButtonElement>(tool, '[data-copy]');

  const { render } = await import('./render.ts');
  let font: FontName = 'Standard';
  // Шрифт догружается асинхронно: результат старого запуска не перекрывает новый.
  let run = 0;

  async function update(): Promise<void> {
    run += 1;
    const id = run;
    const text = input.value;
    const art = await render(text === '' ? EXAMPLE : text, font);
    if (id !== run) return;
    output.textContent = art;
    label.textContent = text === '' ? 'Пример' : 'Результат';
    warning.hidden = !hasUnsupported(text);
  }

  input.addEventListener('input', () => void update());
  fonts.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && isFontName(event.target.value)) {
      font = event.target.value;
      void update();
    }
  });
  copy.addEventListener('click', () => {
    void update().then(() => copyText(copy, output.textContent ?? ''));
  });
  await update();
}
