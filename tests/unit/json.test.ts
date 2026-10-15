import { describe, expect, it } from 'vitest';
import {
  MAX_DEPTH,
  countNodes,
  describeError,
  parseJson,
  pathSegment,
  stringify,
  type JsonNode,
} from '../../src/tools/json/logic.ts';

const pretty = { indent: 2, sortKeys: false };
const minified = { indent: 0, sortKeys: false };

function parse(src: string): JsonNode {
  const result = parseJson(src);
  if (!result.ok) throw new Error(describeError(result.error));
  return result.value;
}

function errorOf(src: string): string {
  const result = parseJson(src);
  if (result.ok) throw new Error(`ожидалась ошибка для ${src}`);
  return describeError(result.error);
}

describe('разбор корректного JSON', () => {
  it.each([
    ['{}'],
    ['[]'],
    ['"строка"'],
    ['0'],
    ['-0.5e-3'],
    ['true'],
    ['null'],
    ['{"a":[1,{"b":null}],"c":"\\u0041\\n"}'],
    [' \n\t{ "a" : 1 }\r\n'],
  ])('%s', (src) => {
    expect(parseJson(src).ok).toBe(true);
  });

  it('совпадает с JSON.parse по смыслу на смешанном документе', () => {
    const src = '{"a":"x\\"y","b":[1,2.5,-3e2,true,false,null],"c":{"d":"\\u00e9"}}';
    expect(JSON.parse(stringify(parse(src), minified))).toEqual(JSON.parse(src));
  });
});

describe('числа и строки сохраняют исходную запись', () => {
  it('большие целые не округляются', () => {
    expect(stringify(parse('{"id":12345678901234567890}'), minified)).toBe(
      '{"id":12345678901234567890}',
    );
  });

  it('1.0, 1e7 и -0 выводятся как записаны', () => {
    expect(stringify(parse('[1.0,1e7,-0,1E+2]'), minified)).toBe('[1.0,1e7,-0,1E+2]');
  });

  it('escape-последовательности строк не переписываются', () => {
    expect(stringify(parse('["\\u0041\\/"]'), minified)).toBe('["\\u0041\\/"]');
  });
});

describe('форматирование', () => {
  it('отступ в два пробела, пустые контейнеры в одну строку', () => {
    expect(stringify(parse('{"a":[1,2],"b":{},"c":[]}'), pretty)).toBe(
      '{\n  "a": [\n    1,\n    2\n  ],\n  "b": {},\n  "c": []\n}',
    );
  });

  it('минификация убирает все пробелы вне строк', () => {
    expect(stringify(parse('{ "a b" : [ 1 , 2 ] }'), minified)).toBe('{"a b":[1,2]}');
  });

  it('сортировка ключей рекурсивна и не трогает порядок массивов', () => {
    const out = stringify(parse('{"b":1,"a":{"d":[3,1],"c":2}}'), { indent: 0, sortKeys: true });
    expect(out).toBe('{"a":{"c":2,"d":[3,1]},"b":1}');
  });

  it('повторяющиеся ключи сохраняются', () => {
    expect(stringify(parse('{"a":1,"a":2}'), minified)).toBe('{"a":1,"a":2}');
  });
});

describe('ошибки называют причину, строку и позицию', () => {
  it.each([
    ['{"a":1 "b":2}', 'Ожидалась запятая. Строка 1, позиция 8'],
    ['{\n  "a": 1,\n  "b": 2', 'Структура не закрыта: не хватает }. Строка 3, позиция 9'],
    ['[1, 2', 'Структура не закрыта: не хватает ]. Строка 1, позиция 6'],
    ['{"a":1,}', 'Лишняя запятая перед }. Строка 1, позиция 7'],
    ['[1,]', 'Лишняя запятая перед ]. Строка 1, позиция 3'],
    ["{'a':1}", 'Ожидалось имя поля в двойных кавычках. Строка 1, позиция 2'],
    ["['a']", 'Строки в JSON берутся в двойные кавычки, а не в одинарные. Строка 1, позиция 2'],
    ['{"a" 1}', 'Ожидалось двоеточие после имени поля. Строка 1, позиция 6'],
    ['"abc', 'Строка не закрыта: не хватает ". Строка 1, позиция 1'],
    ['"a\nb"', 'Перевод строки внутри строки — замените его на \\n. Строка 1, позиция 3'],
    ['"\\x"', 'Некорректная escape-последовательность. Строка 1, позиция 2'],
    ['01', 'Число не может начинаться с нуля. Строка 1, позиция 1'],
    ['1.', 'Некорректное число: после точки нужна цифра. Строка 1, позиция 1'],
    ['{} {}', 'Лишние данные после конца документа. Строка 1, позиция 4'],
    ['', 'Ожидалось значение. Строка 1, позиция 1'],
    ['nul', 'Ожидалось значение. Строка 1, позиция 1'],
  ])('%j', (src, message) => {
    expect(errorOf(src)).toBe(message);
  });

  it('текст ошибки не длиннее 120 знаков', () => {
    const deep = '['.repeat(MAX_DEPTH + 1);
    expect(errorOf(deep).length).toBeLessThanOrEqual(120);
  });
});

describe('глубина', () => {
  it(`${MAX_DEPTH} уровней — можно, ${MAX_DEPTH + 1} — отказ`, () => {
    expect(parseJson('['.repeat(MAX_DEPTH) + ']'.repeat(MAX_DEPTH)).ok).toBe(true);
    expect(errorOf('['.repeat(MAX_DEPTH + 1) + ']'.repeat(MAX_DEPTH + 1))).toMatch(
      /^Вложенность глубже 1000 уровней/,
    );
  });
});

describe('пути и подсчёт узлов', () => {
  it('JSONPath: идентификаторы через точку, остальное в скобках', () => {
    expect(pathSegment('$', 'items')).toBe('$.items');
    expect(pathSegment('$.items', 0)).toBe('$.items[0]');
    expect(pathSegment('$', 'first name')).toBe('$["first name"]');
    expect(pathSegment('$', '1st')).toBe('$["1st"]');
  });

  it('countNodes считает контейнеры и листья', () => {
    expect(countNodes(parse('{"a":[1,2],"b":null}'))).toBe(5);
  });
});
