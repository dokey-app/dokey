import { copyText } from '../../ui/copy.ts';
import { pick } from '../../ui/dom.ts';
import { formatNumber, parseDecimal } from '../../ui/number.ts';
import { changeBetween, percentOf, shareOf, type PercentResult } from './logic.ts';

const CALCS: Record<string, (a: number, b: number) => PercentResult> = {
  of: percentOf,
  share: shareOf,
  change: changeBetween,
};

function mountCard(card: HTMLElement): void {
  const a = pick<HTMLInputElement>(card, '[data-a]');
  const b = pick<HTMLInputElement>(card, '[data-b]');
  const value = pick<HTMLElement>(card, '[data-value]');
  const errorBox = pick<HTMLElement>(card, '[data-error]');
  const copy = pick<HTMLButtonElement>(card, '[data-copy]');
  const calc = CALCS[card.dataset['calc'] ?? ''];
  const unit = card.dataset['unit'] ?? '';
  let plain = '';

  function run(): void {
    errorBox.hidden = true;
    plain = '';
    value.textContent = '—';
    if (a.value.trim() === '' || b.value.trim() === '') return;

    const left = parseDecimal(a.value);
    const right = parseDecimal(b.value);
    const result =
      left === null || right === null || !calc
        ? { ok: false as const, error: 'Нужны числа: 15 или 2,5' }
        : calc(left, right);
    if (!result.ok) {
      errorBox.hidden = false;
      errorBox.textContent = result.error;
      return;
    }
    plain = formatNumber(result.value);
    value.textContent = `${plain}${unit}`;
  }

  card.addEventListener('input', run);
  copy.addEventListener('click', () => {
    run();
    void copyText(copy, plain);
  });
}

for (const card of document.querySelectorAll<HTMLElement>('[data-percent-tool] [data-calc]')) {
  mountCard(card);
}
