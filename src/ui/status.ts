// Статус-регионы макета (Base.astro): вежливый `status` и срочный `alert`.
// Текст сначала очищается, чтобы повтор того же сообщения тоже был объявлен.

function say(selector: string, text: string): void {
  const region = document.querySelector<HTMLElement>(selector);
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = text;
  });
}

export const announce = (text: string): void => say('[data-status]', text);
export const alertNow = (text: string): void => say('[data-alert]', text);
