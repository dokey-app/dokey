// Счётчик внешних запросов в шапке. Считает загруженные ресурсы с чужим origin
// (Resource Timing) и попытки, заблокированные CSP. Ожидаемое значение — 0; если
// когда-нибудь не 0, пользователь увидит это раньше нас.

const output = document.querySelector<HTMLElement>('[data-egress-count]');

if (output) {
  let count = 0;
  const render = (): void => {
    output.textContent = String(count);
  };

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (new URL(entry.name, location.href).origin !== location.origin) count += 1;
    }
    render();
  });
  observer.observe({ type: 'resource', buffered: true });

  document.addEventListener('securitypolicyviolation', (event) => {
    if (event.blockedURI.startsWith('http')) {
      count += 1;
      render();
    }
  });
}
