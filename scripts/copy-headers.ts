import { copyFile } from 'node:fs/promises';

// `_headers` — единственный источник заголовков (ST-03), поэтому он лежит в infra,
// а не в public: в public его правил бы кто угодно мимо сверки копий.
// Сборка кладёт его в dist, откуда хостинг его и читает.
await copyFile('infra/headers/_headers', 'dist/_headers');
console.log('infra/headers/_headers -> dist/_headers');
