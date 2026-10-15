// Реестр инструментов — единственный источник маршрутов инструментов и sitemap.
// Запись добавляется последней в срезе инструмента, вместе со страницей src/pages/<id>.astro.
// После релиза `id` не меняется никогда: это URL в закладках и поисковой выдаче.

export interface Faq {
  q: string;
  a: string;
}

export interface Tool {
  /** kebab-case, совпадает с сегментом маршрута: `/jwt`. */
  id: string;
  /** Продуктовое имя, не переводится: «JWT Inspector». */
  name: string;
  /** <title> и H1 с поисковой формулировкой. */
  title: string;
  /** meta description и вводный абзац, ≤ 240 знаков. */
  description: string;
  /** 3–5 вопросов лендинга. */
  faq: Faq[];
  /** true → ввод обнуляется при уходе со страницы (JWT). */
  sensitiveInput: boolean;
}

export const tools: readonly Tool[] = [];

export function getTool(id: string): Tool {
  const tool = tools.find((t) => t.id === id);
  if (!tool) throw new Error(`Инструмента «${id}» нет в src/registry/tools.ts`);
  return tool;
}
