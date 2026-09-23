import { astroPreview } from './preview-server.ts';

// Парная половина к preview-server.ts: гасит фоновый сервер предпросмотра после прогона.
// Без неё порт 4321 остаётся занятым, и следующий прогон стартует на чужом сервере.
export default function globalTeardown(): void {
  astroPreview('stop');
}
