import { tools } from '../registry/tools.ts';
import { showCharCount } from '../ui/char-count.ts';
import { copyText } from '../ui/copy.ts';
import { announce } from '../ui/status.ts';
import { DETECT_LIMIT_CHARS, choose, detect, type Candidate, type CandidateId } from './detect.ts';

// Ввод живёт только в переменных модуля и в поле: ни storage, ни URL, ни history.

function $<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Автоопределение: нет ${selector}`);
  return found;
}

function chip(candidate: Candidate, active: boolean): HTMLLabelElement {
  const label = document.createElement('label');
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'detect-candidate';
  radio.value = candidate.id;
  radio.checked = active;
  label.append(radio, candidate.label);
  return label;
}

/** Тип ввода — набор автоматических кандидатов. */
const signature = (list: Candidate[]): string =>
  list
    .filter((c) => c.auto)
    .map((c) => c.id)
    .join(',');

const root = document.querySelector<HTMLElement>('[data-detector]');
if (root) mount();

function mount(): void {
  const input = $<HTMLTextAreaElement>('[data-input]');
  const tooBig = $<HTMLElement>('[data-too-big]');
  const result = $<HTMLElement>('[data-result]');
  const chips = $<HTMLFieldSetElement>('[data-chips]');
  const head = $<HTMLElement>('[data-result-head]');
  const link = $<HTMLAnchorElement>('[data-tool-link]');
  const copy = $<HTMLButtonElement>('[data-copy]');
  const output = $<HTMLPreElement>('[data-output]');

  let candidates: Candidate[] = [];
  let manual: CandidateId | null = null;
  // Ручной выбор действует, пока тип ввода тот же — набор автоматических кандидатов.
  let manualFor = '';
  let lastAuto: CandidateId | null = null;
  let timer = 0;

  function render(): void {
    const legend = chips.querySelector('legend');
    const active = choose(candidates, manual);
    chips.replaceChildren(
      ...(legend ? [legend] : []),
      ...candidates.map((c) => chip(c, c.id === active?.id)),
    );
    result.hidden = candidates.length === 0;
    head.hidden = active === null;
    output.hidden = active === null;
    if (!active) return;
    output.textContent = active.output;
    const tool = tools.find((t) => t.id === active.toolId);
    link.href = `/${active.toolId}`;
    link.textContent = tool ? `Открыть ${tool.name}` : 'Открыть инструмент';
    if (!manual && active.id !== lastAuto) announce(active.label);
    lastAuto = manual ? lastAuto : active.id;
  }

  function run(): void {
    const text = input.value;
    showCharCount(document.querySelector('[data-char-count]'), text);
    tooBig.hidden = text.length <= DETECT_LIMIT_CHARS;
    tooBig.textContent = tooBig.hidden
      ? ''
      : 'Ввод больше 200 000 знаков — откройте нужный инструмент: там есть пороги и кнопка «Обработать»';
    if (text.trim() === '') {
      manual = null;
      lastAuto = null;
    }
    candidates = detect(text);
    if (manual && signature(candidates) !== manualFor) manual = null;
    render();
  }

  function flush(): void {
    if (timer === 0) return;
    window.clearTimeout(timer);
    timer = 0;
    run();
  }

  input.addEventListener('input', () => {
    // Очистка поля сбрасывает ручной выбор сразу, даже если новый ввод придёт до пересчёта.
    if (input.value.trim() === '') manual = null;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      run();
    }, 150);
  });

  // click, а не change: ручной выбор закрепляется и для чипса, выбранного автоматикой.
  chips.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== 'detect-candidate') return;
    flush();
    manual = target.value as CandidateId;
    manualFor = signature(candidates);
    render();
    chips.querySelector<HTMLInputElement>(`input[value="${manual}"]`)?.focus();
  });

  copy.addEventListener('click', () => {
    flush();
    void copyText(copy, output.textContent ?? '');
  });

  run();
}
