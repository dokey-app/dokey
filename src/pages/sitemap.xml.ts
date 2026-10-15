import type { APIRoute } from 'astro';
import { sitemapPaths, sitemapXml } from '../registry/sitemap.ts';
import { tools } from '../registry/tools.ts';

export const GET: APIRoute = ({ site }) =>
  new Response(sitemapXml(String(site), sitemapPaths(tools)), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
