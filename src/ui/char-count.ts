// Счётчик символов в шапке карточки ввода: «1 024 симв.» без разделителей разрядов,
// с неразрывным пробелом перед единицей (дизайн-система, «Числа и единицы»).
export function showCharCount(target: HTMLElement | null, value: string): void {
  if (target) target.textContent = `${value.length} симв.`;
}
