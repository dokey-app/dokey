import { type Gate, pending, runGate } from './gate.ts';

// Предмет гейта вводит срез Э-1; до него гейт существует адресом и возвращает «пусто»
// (implementation-plan §2.2). Зелёный от «проверено» отличается словом ПУСТО в выводе.
//
// Множество проверяемых идентификаторов задано D-98 и шире, чем Tool.id: `Tool.id`, `pageId`,
// маршруты и `ContractClause.id`. Все четыре объявлены пожизненными (D-82 п. 2, п. 3, D-21),
// и до D-98 гейт был только у первого.
export const gate: Gate = {
  id: 'G-14',
  command: 'gate:toolids',
  claim: 'множество пожизненных идентификаторов только растёт',
  enabledIn: 'Э-1',
  run: () => pending('Э-1'),
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
