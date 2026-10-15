// Автоопределение ввода на главной: лестница от специфичного к общему поверх логики
// инструментов (своих разборщиков здесь нет). Кандидат попадает в список, только если его
// результат осмыслен; первый применяется сразу, остальные — чипсами в порядке лестницы.
// Регулярные выражения линейны: без вложенных квантификаторов и обратных ссылок.

import { classify, decodeBase64, encodeText } from '../tools/base64/logic.ts';
import { parseJson, stringify } from '../tools/json/logic.ts';
import { decodeJwt } from '../tools/jwt/logic.ts';
import { parseTimestamp, rows } from '../tools/timestamp/logic.ts';
import { parseUrl, percentDecode, percentEncode } from '../tools/url/logic.ts';
import { inspect } from '../tools/uuid/logic.ts';

export type CandidateId =
  | 'jwt'
  | 'json'
  | 'uuid'
  | 'url'
  | 'percent'
  | 'timestamp'
  | 'base64'
  | 'base64-encode'
  | 'url-encode';

export interface Candidate {
  id: CandidateId;
  /** Подпись чипса. */
  label: string;
  /** Инструмент, где с вводом можно сделать больше. */
  toolId: string;
  /** Результат в текстовом виде — то, что показывается и копируется. */
  output: string;
  /** Применяется сам (true) или только по нажатию (кодирование). */
  auto: boolean;
}

/** Выше — автоопределение не запускается: тяжёлый ввод — в инструменте, с порогами. */
export const DETECT_LIMIT_CHARS = 200_000;

const lines = (pairs: { name: string; value: string }[]): string =>
  pairs.map((p) => `${p.name}: ${p.value}`).join('\n');

/** 1970–2100: секунды — 10 цифр, миллисекунды — 13. */
const TS_MIN_MS = 0;
const TS_MAX_MS = Date.UTC(2100, 0, 1);
const TS_DIGITS = /^\d{10}$|^\d{13}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?)?(Z|[+-]\d{2}:?\d{2})?$/i;
const BASE64_SHAPE = /^[A-Za-z0-9+/\-_]+={0,2}$/;
const PERCENT = /%[0-9a-fA-F]{2}/;

type Step = (text: string, nowMs: number) => Omit<Candidate, 'auto'> | null;

const LADDER: Step[] = [
  (text) => {
    const jwt = decodeJwt(text);
    if (!jwt.ok) return null;
    return {
      id: 'jwt',
      label: 'JWT',
      toolId: 'jwt',
      output: `header\n${jwt.value.header}\n\npayload\n${jwt.value.payload}`,
    };
  },
  (text) => {
    const json = parseJson(text);
    if (!json.ok || (json.value.kind !== 'object' && json.value.kind !== 'array')) return null;
    return {
      id: 'json',
      label: 'JSON',
      toolId: 'json',
      output: stringify(json.value, { indent: 2, sortKeys: false }),
    };
  },
  (text) => {
    const trimmed = text.trim();
    if (trimmed.length > 45) return null;
    const result = inspect(trimmed);
    if (!result.ok) return null;
    return { id: 'uuid', label: 'UUID/ULID', toolId: 'uuid', output: lines(result.fields) };
  },
  (text) => {
    const trimmed = text.trim();
    if (/\s/.test(trimmed)) return null;
    const result = parseUrl(trimmed);
    if (!result.ok) return null;
    const query = result.query.map((q) => `  ${q.key} = ${q.value}`).join('\n');
    return {
      id: 'url',
      label: 'URL',
      toolId: 'url',
      output: lines(result.components) + (query ? `\n\nПараметры query\n${query}` : ''),
    };
  },
  (text) => {
    if (!PERCENT.test(text)) return null;
    const decoded = percentDecode(text);
    if (!decoded.ok) return null;
    return { id: 'percent', label: 'Percent-декодировать', toolId: 'url', output: decoded.text };
  },
  (text, nowMs) => {
    const trimmed = text.trim();
    if (!TS_DIGITS.test(trimmed) && !ISO_DATE.test(trimmed)) return null;
    const parsed = parseTimestamp(trimmed);
    if (!parsed.ok || parsed.ms < TS_MIN_MS || parsed.ms >= TS_MAX_MS) return null;
    return {
      id: 'timestamp',
      label: 'Timestamp',
      toolId: 'unix-timestamp',
      output: lines(rows(parsed.ms, true, nowMs)),
    };
  },
  (text) => {
    const trimmed = text.trim();
    if (trimmed.length < 4 || trimmed.length % 4 !== 0 || !BASE64_SHAPE.test(trimmed)) return null;
    const decoded = decodeBase64(trimmed);
    if (!decoded.ok || decoded.bytes.length === 0) return null;
    const content = classify(decoded.bytes);
    if (content.kind !== 'text') return null;
    return { id: 'base64', label: 'Base64-декодировать', toolId: 'base64', output: content.text };
  },
];

/** Кандидаты в порядке лестницы; кодирование — в конце и только по нажатию. */
export function detect(input: string, nowMs: number = Date.now()): Candidate[] {
  if (input.trim() === '' || input.length > DETECT_LIMIT_CHARS) return [];
  const found: Candidate[] = [];
  for (const step of LADDER) {
    const candidate = step(input, nowMs);
    if (candidate) found.push({ ...candidate, auto: true });
  }
  found.push({
    id: 'base64-encode',
    label: 'Base64-кодировать',
    toolId: 'base64',
    output: encodeText(input, false),
    auto: false,
  });
  const urlEncoded = percentEncode(input);
  if (urlEncoded.ok) {
    found.push({
      id: 'url-encode',
      label: 'URL-кодировать',
      toolId: 'url',
      output: urlEncoded.text,
      auto: false,
    });
  }
  return found;
}

/** Кандидат, который применяется сам: первый осмысленный. Ручной выбор сильнее. */
export function choose(candidates: Candidate[], manual: CandidateId | null): Candidate | null {
  if (manual) {
    const picked = candidates.find((c) => c.id === manual);
    if (picked) return picked;
  }
  return candidates.find((c) => c.auto) ?? null;
}
