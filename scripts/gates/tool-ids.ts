import { type Gate, pending, runGate } from './gate.ts';

// Предмет гейта вводит срез Э-1; до него гейт существует адресом и возвращает «пусто»
// (implementation-plan §2.2). Зелёный от «проверено» отличается словом ПУСТО в выводе.
export const gate: Gate = {
  id: 'G-14',
  command: 'gate:toolids',
  claim: 'множество Tool.id только растёт',
  enabledIn: 'Э-1',
  run: () => pending('Э-1'),
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
