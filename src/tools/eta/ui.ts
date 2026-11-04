import { copyText } from '../../ui/copy.ts';
import { pick } from '../../ui/dom.ts';
import { formatNumber, parseDecimal } from '../../ui/number.ts';
import { eta, formatDuration, formatInstant } from './logic.ts';

const root = document.querySelector<HTMLElement>('[data-eta-tool]');
if (root) mount(root);

function mount(tool: HTMLElement): void {
  const total = pick<HTMLInputElement>(tool, '[data-total]');
  const done = pick<HTMLInputElement>(tool, '[data-done]');
  const amount = pick<HTMLInputElement>(tool, '[data-amount]');
  const start = pick<HTMLInputElement>(tool, '[data-start]');
  const units = pick<HTMLFieldSetElement>(tool, '[data-units]');
  const errorBox = pick<HTMLElement>(tool, '[data-error]');
  const copy = pick<HTMLButtonElement>(tool, '[data-copy]');
  const cell = (name: string) => pick<HTMLElement>(tool, `[data-eta="${name}"]`);

  const show = (values: Record<string, string>): void => {
    for (const [name, value] of Object.entries(values)) cell(name).textContent = value;
  };

  function run(): void {
    const values = [total, done, amount].map((field) => parseDecimal(field.value));
    const unit = units.querySelector<HTMLInputElement>('input:checked');
    const fail = (error: string): void => {
      errorBox.hidden = false;
      errorBox.textContent = error;
      show({ remaining: '', duration: '', local: '', utc: '' });
    };

    if (values.includes(null) || !unit) {
      fail('Всего, готово и скорость — числа: 1000 или 2,5');
      return;
    }
    const [totalValue, doneValue, amountValue] = values as [number, number, number];
    const result = eta({
      total: totalValue,
      done: doneValue,
      amount: amountValue,
      unitMs: Number(unit.value),
      startMs: start.value === '' ? Date.now() : new Date(start.value).getTime(),
    });
    if (!result.ok) {
      fail(result.error);
      return;
    }
    errorBox.hidden = true;
    show({
      remaining: formatNumber(result.remaining),
      duration: formatDuration(result.durationMs),
      local: formatInstant(result.finishMs / 1000, undefined, true),
      utc: formatInstant(result.finishMs / 1000, 'UTC', true),
    });
  }

  tool.addEventListener('input', run);
  copy.addEventListener('click', () => {
    run();
    void copyText(copy, cell('local').textContent ?? '');
  });
  run();
}
