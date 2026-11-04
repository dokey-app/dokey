import { copyText } from '../../ui/copy.ts';
import { parseCount, pick } from '../../ui/dom.ts';
import { cryptoRandom, generateLorem } from './logic.ts';

const root = document.querySelector<HTMLElement>('[data-lorem-tool]');
if (root) mount(root);

function mount(tool: HTMLElement): void {
  const field = (name: string) => pick<HTMLInputElement>(tool, `[data-${name}]`);
  const start = field('start');
  const html = field('html');
  const output = pick<HTMLElement>(tool, '[data-output]');
  const errorBox = pick<HTMLElement>(tool, '[data-error]');
  const copy = pick<HTMLButtonElement>(tool, '[data-copy]');

  function run(): void {
    const paragraphs = parseCount(field('paragraphs').value, 1, 100);
    const sentencesMin = parseCount(field('s-min').value, 1, 50);
    const sentencesMax = parseCount(field('s-max').value, 1, 50);
    const wordsMin = parseCount(field('w-min').value, 1, 100);
    const wordsMax = parseCount(field('w-max').value, 1, 100);
    const valid =
      paragraphs !== null &&
      sentencesMin !== null &&
      sentencesMax !== null &&
      wordsMin !== null &&
      wordsMax !== null &&
      sentencesMin <= sentencesMax &&
      wordsMin <= wordsMax;
    errorBox.hidden = valid;
    if (!valid) {
      errorBox.textContent =
        'Нужны целые числа: абзацев до 100, предложений до 50, слов до 100, «от» не больше «до»';
      return;
    }
    output.textContent = generateLorem(
      {
        paragraphs,
        sentencesMin,
        sentencesMax,
        wordsMin,
        wordsMax,
        startWithLorem: start.checked,
        asHtml: html.checked,
      },
      cryptoRandom,
    );
  }

  tool.addEventListener('input', run);
  pick<HTMLButtonElement>(tool, '[data-generate]').addEventListener('click', run);
  copy.addEventListener('click', () => void copyText(copy, output.textContent ?? ''));
  run();
}
