import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sitemapPaths, sitemapXml } from '../../src/registry/sitemap.ts';
import { tools, type Tool } from '../../src/registry/tools.ts';

const fake: Tool = {
  id: 'jwt',
  name: 'JWT Inspector',
  icon: 'key-round',
  title: 'Декодировать JWT',
  description: 'Разбор JWT в браузере.',
  faq: [],
  sensitiveInput: true,
};

describe('реестр', () => {
  it('id уникальны и в kebab-case', () => {
    const ids = tools.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('иконка каждого инструмента есть в lucide-static', () => {
    for (const tool of tools) {
      expect(existsSync(`node_modules/lucide-static/icons/${tool.icon}.svg`), tool.id).toBe(true);
    }
  });

  it('H1 (продуктовое имя) — до трёх слов', () => {
    for (const tool of tools) expect(tool.name.split(/\s+/).length, tool.id).toBeLessThanOrEqual(3);
  });

  it('у каждого инструмента 3–5 вопросов FAQ и описание ≤ 240 знаков', () => {
    for (const tool of tools) {
      expect(tool.faq.length, tool.id).toBeGreaterThanOrEqual(3);
      expect(tool.faq.length, tool.id).toBeLessThanOrEqual(5);
      expect(tool.description.length, tool.id).toBeLessThanOrEqual(240);
    }
  });
});

describe('sitemap', () => {
  it('содержит главную и маршрут каждого инструмента', () => {
    expect(sitemapPaths([fake])).toEqual(['/', '/how-to-verify', '/jwt']);
  });

  it('собирает абсолютные адреса без двойного слеша', () => {
    const xml = sitemapXml('https://dokey.ru/', ['/', '/jwt']);
    expect(xml).toContain('<loc>https://dokey.ru/</loc>');
    expect(xml).toContain('<loc>https://dokey.ru/jwt</loc>');
    expect(xml).not.toContain('ru//');
  });
});
