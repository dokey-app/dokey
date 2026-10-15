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
  const label = button.dataset['label'] ?? button.textContent ?? '';
  button.dataset['label'] = label;
  button.textContent = 'Скопировано';
  announce('Скопировано');
  window.setTimeout(() => {
    button.textContent = label;
  }, COPIED_MS);
}
