// У size-limit 13.0.3 и его плагина файлов нет собственных деклараций (ADR-16).
// Объявляем ровно ту часть API, которой пользуется gate:size, — а не `any` на весь модуль.
declare module '@size-limit/file' {
  const plugin: unknown[];
  export default plugin;
}

declare module 'size-limit' {
  interface SizeLimitCheck {
    files: string[];
    gzip?: boolean;
    size?: number;
  }
  export default function sizeLimit(
    plugins: unknown[],
    files: { checks: SizeLimitCheck[] } | string[],
  ): Promise<{ size?: number }[]>;
}
