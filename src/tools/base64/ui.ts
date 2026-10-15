import { copyText } from '../../ui/copy.ts';
import { announce } from '../../ui/status.ts';
import {
  EXAMPLE,
  FILE_CHUNK,
  HARD_LIMIT_BYTES,
  SOFT_LIMIT_BYTES,
  classify,
  decodeBase64,
  encodeBytes,
  encodeText,
  formatSize,
  hexPreview,
  looksLikeBase64,
  utf8Length,
} from './logic.ts';

// Ввод и файл живут только в переменных модуля: ни storage, ни URL, ни history.

function $<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Base64: нет ${selector}`);
  return found;
}

const PROGRESS_DELAY_MS = 400;
const FILE_HINT = 'Файл читается в этой вкладке, внешних запросов — 0';

const tool = document.querySelector<HTMLElement>('[data-b64-tool]');
if (tool) mount(tool);

function mount(root: HTMLElement): void {
  const input = $<HTMLTextAreaElement>('[data-input]');
  const textPane = $<HTMLElement>('[data-text-pane]');
  const filePane = $<HTMLElement>('[data-file-pane]');
  const fileInput = $<HTMLInputElement>('[data-file]');
  const pick = $<HTMLButtonElement>('[data-pick]');
  const fileInfo = $<HTMLElement>('[data-file-info]');
  const progress = $<HTMLElement>('[data-progress]');
  const progressBar = $<HTMLProgressElement>('[data-progress-bar]');
  const progressText = $<HTMLElement>('[data-progress-text]');
  const cancel = $<HTMLButtonElement>('[data-cancel]');
  const errorBox = $<HTMLElement>('[data-error]');
  const threshold = $<HTMLElement>('[data-threshold]');
  const thresholdText = $<HTMLElement>('[data-threshold-text]');
  const processButton = $<HTMLButtonElement>('[data-process]');
  const direction = $<HTMLFieldSetElement>('[data-direction]');
  const urlSafe = $<HTMLInputElement>('[data-url-safe]');
  const label = $<HTMLElement>('[data-result-label]');
  const output = $<HTMLPreElement>('[data-output]');
  const copy = $<HTMLButtonElement>('[data-copy]');
  const clear = $<HTMLButtonElement>('[data-clear]');
  const binary = $<HTMLElement>('[data-binary]');
  const binaryInfo = $<HTMLElement>('[data-binary-info]');
  const hex = $<HTMLPreElement>('[data-hex]');
  const download = $<HTMLButtonElement>('[data-download]');

  let userDirection: 'encode' | 'decode' | null = null;
  let decodedBytes: Uint8Array<ArrayBuffer> | null = null;
  let file: File | null = null;
  let reading = 0; // номер текущего чтения; отмена или новый файл его меняют
  let timer = 0;

  const source = (): 'text' | 'file' =>
    root.querySelector<HTMLInputElement>('input[name="b64-source"]:checked')?.value === 'file'
      ? 'file'
      : 'text';

  function setDirection(value: 'encode' | 'decode'): void {
    const radio = direction.querySelector<HTMLInputElement>(`input[value="${value}"]`);
    if (radio) radio.checked = true;
    urlSafe.disabled = value === 'decode';
  }

  function showError(text: string | null): void {
    errorBox.hidden = text === null;
    errorBox.textContent = text ?? '';
  }

  function showThreshold(text: string | null, canProcess: boolean): void {
    threshold.hidden = text === null;
    thresholdText.textContent = text ?? '';
    processButton.hidden = !canProcess;
  }

  function showText(text: string, isExample: boolean): void {
    output.hidden = false;
    output.textContent = text;
    binary.hidden = true;
    decodedBytes = null;
    label.textContent = isExample ? 'Пример' : 'Результат';
    copy.disabled = false;
  }

  function showBinary(bytes: Uint8Array<ArrayBuffer>): void {
    output.hidden = true;
    output.textContent = '';
    decodedBytes = bytes;
    binaryInfo.textContent = `Двоичные данные · ${formatSize(bytes.length)}`;
    hex.textContent = hexPreview(bytes);
    binary.hidden = false;
    label.textContent = 'Результат';
    copy.disabled = true;
  }

  function showNothing(): void {
    output.hidden = false;
    output.textContent = '';
    binary.hidden = true;
    decodedBytes = null;
    label.textContent = 'Результат';
    copy.disabled = true;
  }

  function sizeGate(bytes: number, force: boolean, what: string): boolean {
    if (bytes > HARD_LIMIT_BYTES) {
      showThreshold(
        `${what} ${formatSize(bytes)} — больше порога ${formatSize(HARD_LIMIT_BYTES)}. Такой объём вкладка не обработает`,
        false,
      );
      return false;
    }
    if (bytes > SOFT_LIMIT_BYTES && !force) {
      showThreshold(
        `${what} ${formatSize(bytes)} — больше порога ${formatSize(SOFT_LIMIT_BYTES)}. Обработка займёт несколько секунд`,
        true,
      );
      return false;
    }
    showThreshold(null, false);
    return true;
  }

  function runText(force = false): void {
    const text = input.value;
    showError(null);
    if (text.trim() === '') {
      showThreshold(null, false);
      if (userDirection === null) setDirection('encode');
      showText(encodeText(EXAMPLE, false), true);
      return;
    }
    if (!sizeGate(text.length * 3 < SOFT_LIMIT_BYTES ? 0 : utf8Length(text), force, 'Текст')) {
      showNothing();
      return;
    }
    const dir = userDirection ?? (looksLikeBase64(text) ? 'decode' : 'encode');
    setDirection(dir);
    if (dir === 'encode') {
      showText(encodeText(text, urlSafe.checked), false);
      return;
    }
    const decoded = decodeBase64(text);
    if (!decoded.ok) {
      showError(decoded.error);
      showNothing();
      return;
    }
    const content = classify(decoded.bytes);
    if (content.kind === 'text') showText(content.text, false);
    else showBinary(decoded.bytes);
  }

  function resetFile(): void {
    reading += 1;
    file = null;
    fileInput.value = '';
    fileInfo.textContent = FILE_HINT;
    progress.hidden = true;
    showThreshold(null, false);
    showError(null);
    showText(encodeText(EXAMPLE, false), true);
  }

  async function readFile(target: File, force = false): Promise<void> {
    fileInfo.textContent = `${target.name} · ${formatSize(target.size)}`;
    showError(null);
    if (!sizeGate(target.size, force, 'Файл')) {
      showNothing();
      return;
    }
    const id = ++reading;
    const parts: string[] = [];
    const progressTimer = window.setTimeout(() => {
      if (reading === id) progress.hidden = false;
    }, PROGRESS_DELAY_MS);
    try {
      for (let offset = 0; offset < target.size; offset += FILE_CHUNK) {
        // Порции читаются по одной намеренно: в памяти одна порция, отмена — между порциями.
        // oxlint-disable-next-line no-await-in-loop
        const chunk = new Uint8Array(await target.slice(offset, offset + FILE_CHUNK).arrayBuffer());
        if (reading !== id) return; // отменено или выбран другой файл
        parts.push(encodeBytes(chunk, urlSafe.checked));
        const percent = Math.round(
          (Math.min(offset + FILE_CHUNK, target.size) / target.size) * 100,
        );
        progressBar.value = percent;
        progressText.textContent = `Прочитано ${percent} %`;
      }
      showText(parts.join(''), false);
      announce('Файл закодирован');
    } catch {
      if (reading === id) {
        showError('Файл не читается. Выберите файл заново');
        showNothing();
      }
    } finally {
      window.clearTimeout(progressTimer);
      if (reading === id) progress.hidden = true;
    }
  }

  function run(force = false): void {
    if (source() === 'text') runText(force);
    else if (file) void readFile(file, force);
  }

  function flush(): void {
    if (timer === 0) return;
    window.clearTimeout(timer);
    timer = 0;
    run();
  }

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    const delay = input.value.length > 100_000 ? 400 : 150;
    timer = window.setTimeout(() => {
      timer = 0;
      run();
    }, delay);
  });

  root.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name === 'b64-source') {
      const isFile = target.value === 'file';
      textPane.hidden = isFile;
      filePane.hidden = !isFile;
      direction.hidden = isFile;
      if (isFile) {
        resetFile();
        pick.focus();
      } else {
        runText();
        input.focus();
      }
      return;
    }
    if (target.name === 'b64-direction') {
      userDirection = target.value === 'decode' ? 'decode' : 'encode';
      runText();
      return;
    }
    if (target === urlSafe) {
      run();
      return;
    }
    if (target === fileInput && fileInput.files?.[0]) {
      file = fileInput.files[0];
      void readFile(file);
    }
  });

  pick.addEventListener('click', () => fileInput.click());
  cancel.addEventListener('click', () => {
    resetFile();
    pick.focus();
  });
  processButton.addEventListener('click', () => run(true));

  copy.addEventListener('click', () => {
    flush();
    void copyText(copy, output.textContent ?? '');
  });

  clear.addEventListener('click', () => {
    input.value = '';
    userDirection = null;
    if (source() === 'file') resetFile();
    else runText();
    (source() === 'file' ? pick : input).focus();
  });

  download.addEventListener('click', () => {
    flush();
    if (!decodedBytes) return;
    // Файл собирается в памяти вкладки: blob:-адрес локальный, сети нет.
    const url = URL.createObjectURL(new Blob([decodedBytes], { type: 'application/octet-stream' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'decoded.bin';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  runText();
}
