import type { Tool } from './tools.ts';

// Страницы вне реестра, которые индексируются. Служебные (/health, 404) сюда не входят.
export const staticPaths: readonly string[] = ['/', '/how-to-verify'];

export function sitemapPaths(tools: readonly Tool[]): string[] {
  return [...staticPaths, ...tools.map((tool) => `/${tool.id}`)];
}

export function sitemapXml(site: string, paths: readonly string[]): string {
  const base = site.replace(/\/$/, '');
  const urls = paths.map((path) => `  <url><loc>${base}${path}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
