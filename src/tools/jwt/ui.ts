import { copyText } from '../../ui/copy.ts';
import { announce } from '../../ui/status.ts';
import {
  EXAMPLE,
  claimLabel,
  decodeJwt,
  formatInstant,
  verifiability,
  verifyHmac,
  type DecodedJwt,
} from './logic.ts';

// Токен и ключ живут только в переменных модуля и в полях формы. На уходе со страницы
// (pagehide — в том числе в bfcache) всё обнуляется: sensitiveInput в реестре.

function $<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`JWT Inspector: нет ${selector}`);
  return found;
}

const tool = document.querySelector<HTMLElement>('[data-jwt-tool]');
if (tool) mount();

function mount(): void {
  const input = $<HTMLTextAreaElement>('[data-input]');
  const errorBox = $<HTMLElement>('[data-error]');
  const label = $<HTMLElement>('[data-result-label]');
  const header = $<HTMLPreElement>('[data-header]');
  const payload = $<HTMLPreElement>('[data-payload]');
  const signature = $<HTMLPreElement>('[data-signature]');
  const claimsSection = $<HTMLElement>('[data-claims-section]');
  const claims = $<HTMLElement>('[data-claims]');
  const verdict = $<HTMLElement>('[data-verdict]');
  const verify = $<HTMLDetailsElement>('[data-verify]');
  const hint = $<HTMLElement>('[data-verify-hint]');
  const key = $<HTMLInputElement>('[data-key]');
  const toggleKey = $<HTMLButtonElement>('[data-toggle-key]');
  const verifyButton = $<HTMLButtonElement>('[data-verify-button]');
  const clear = $<HTMLButtonElement>('[data-clear]');
  const copyButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-copy]')];

  let current: DecodedJwt | null = null;
  let timer = 0;

  function setVerdict(text: string, tone: 'ok' | 'bad' | null): void {
    verdict.textContent = text;
    verdict.classList.toggle('ok', tone === 'ok');
    verdict.classList.toggle('bad', tone === 'bad');
  }

  function renderClaims(jwt: DecodedJwt): void {
    const now = Math.floor(Date.now() / 1000);
    claims.replaceChildren(
      ...jwt.claims.map((claim) => {
        const row = document.createElement('div');
        const dt = document.createElement('dt');
        dt.textContent = claim.name;
        const dd = document.createElement('dd');
        const main = document.createElement('span');
        main.className = 'claim-label';
        main.textContent = claimLabel(claim, now);
        const raw = document.createElement('span');
        raw.className = 'claim-raw';
        raw.textContent = `${claim.seconds} · местное: ${formatInstant(claim.seconds, undefined)}`;
        dd.append(main, raw);
        row.append(dt, dd);
        return row;
      }),
    );
    claimsSection.hidden = jwt.claims.length === 0;
  }

  function updateVerifyState(): void {
    if (!current) {
      verifyButton.disabled = true;
      return;
    }
    const how = verifiability(current.alg);
    if (how.kind !== 'hmac') {
      hint.textContent = how.message;
      key.disabled = true;
      verifyButton.disabled = true;
      return;
    }
    if (!globalThis.crypto?.subtle) {
      hint.textContent = 'Проверка подписи недоступна: страница открыта не по HTTPS';
      key.disabled = true;
      verifyButton.disabled = true;
      return;
    }
    hint.textContent = 'Ключ нужен только для проверки подписи';
    key.disabled = false;
    verifyButton.disabled = key.value === '';
  }

  function show(jwt: DecodedJwt | null, isExample: boolean): void {
    current = jwt;
    copyButtons.forEach((b) => (b.disabled = jwt === null));
    if (!jwt) {
      header.textContent = '';
      payload.textContent = '';
      signature.textContent = '';
      claims.replaceChildren();
      claimsSection.hidden = true;
      label.textContent = 'Результат';
      setVerdict('', null);
      updateVerifyState();
      return;
    }
    label.textContent = isExample ? 'Пример' : 'Результат';
    header.textContent = jwt.header;
    payload.textContent = jwt.payload;
    signature.textContent = jwt.signature;
    renderClaims(jwt);
    const how = verifiability(jwt.alg);
    setVerdict(how.kind === 'none' ? how.message : 'Подпись не проверялась', null);
    updateVerifyState();
  }

  function run(): void {
    const source = input.value;
    if (source.trim() === '') {
      errorBox.hidden = true;
      const example = decodeJwt(EXAMPLE);
      show(example.ok ? example.value : null, true);
      return;
    }
    const result = decodeJwt(source);
    errorBox.hidden = result.ok;
    errorBox.textContent = result.ok ? '' : result.error;
    show(result.ok ? result.value : null, false);
  }

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      run();
    }, 120);
  });

  // Действие над результатом не должно опередить отложенный разбор: иначе проверится
  // или скопируется предыдущий токен.
  function flush(): void {
    if (timer === 0) return;
    window.clearTimeout(timer);
    timer = 0;
    run();
  }

  key.addEventListener('input', () => {
    updateVerifyState();
    // Вердикт относится к прежнему ключу — после правки ключа он больше не верен.
    const checked = verdict.classList.contains('ok') || verdict.classList.contains('bad');
    if (current && checked) setVerdict('Подпись не проверялась', null);
  });

  toggleKey.addEventListener('click', () => {
    const masked = key.classList.toggle('masked');
    toggleKey.textContent = masked ? 'Показать' : 'Скрыть';
    toggleKey.setAttribute('aria-pressed', String(!masked));
  });

  verifyButton.addEventListener('click', async () => {
    flush();
    if (!current) return;
    const how = verifiability(current.alg);
    if (how.kind !== 'hmac' || key.value === '') return;
    const ok = await verifyHmac(current, how.hash, key.value);
    setVerdict(
      ok ? 'Подпись верна' : 'Подпись не совпала. Проверьте ключ подписи и алгоритм',
      ok ? 'ok' : 'bad',
    );
    announce(verdict.textContent ?? '');
  });

  for (const button of copyButtons) {
    button.addEventListener('click', () => {
      flush();
      const source = button.dataset['copy'] === 'header' ? header : payload;
      void copyText(button, source.textContent ?? '');
    });
  }

  clear.addEventListener('click', () => {
    input.value = '';
    key.value = '';
    run();
    input.focus();
  });

  function wipe(): void {
    window.clearTimeout(timer);
    input.value = '';
    key.value = '';
    current = null;
    verify.open = false;
    show(null, false);
  }

  window.addEventListener('pagehide', wipe);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) run();
  });

  run();
}
