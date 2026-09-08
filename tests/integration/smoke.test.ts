import { describe, expect, it } from 'vitest';

// RUN-02, browser mode. Каркас уровня: убеждается, что прогон идёт в настоящем браузере,
// а не в подделке окружения — иначе проверки ИНВ-01 и ИНВ-02 ничего не стоят.
describe('окружение уровня RUN-02', () => {
  it('это настоящий браузер, а не jsdom', () => {
    expect(typeof window).toBe('object');
    expect(navigator.userAgent).not.toContain('jsdom');
  });

  it('Web Crypto доступен — подделывать getRandomValues не придётся', () => {
    expect(typeof crypto.getRandomValues).toBe('function');
    const buffer = crypto.getRandomValues(new Uint8Array(8));
    expect(buffer).toHaveLength(8);
  });

  it('носители ввода пусты на старте (ИНВ-02)', () => {
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
