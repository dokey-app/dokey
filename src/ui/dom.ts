/** Узел, без которого инструмент не работает: разметка и ui.ts расходятся — ошибка сразу. */
export function pick<T extends Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`Нет узла ${selector}`);
  return found;
}

/** Целое в границах из поля ввода; null — поле не проходит, причину объясняет вызывающий. */
export function parseCount(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const count = Number(value);
  return count >= min && count <= max ? count : null;
}
