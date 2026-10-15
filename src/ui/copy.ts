import { alertNow, announce } from './status.ts';

const COPIED_MS = 1200;
const DENIED = 'Браузер не дал доступ к буферу обмена. Выделите результат и скопируйте: Ctrl + C';

/**
 * «Скопировать» → «Скопировано» на 1,2 с — только после того, как буфер обмена
 * действительно принял текст. Отказ браузера объясняется, а не прячется.
 */
export async function copyText(button: HTMLButtonElement, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    alertNow(DENIED);
    return;
  }
  // У кнопки с иконкой меняется только текст: иконка остаётся на месте.
  const target = button.querySelector<HTMLElement>('.btn-text') ?? button;
  const label = button.dataset['label'] ?? target.textContent ?? '';
  button.dataset['label'] = label;
  target.textContent = 'Скопировано';
  announce('Скопировано');
  window.setTimeout(() => {
    target.textContent = label;
  }, COPIED_MS);
}
