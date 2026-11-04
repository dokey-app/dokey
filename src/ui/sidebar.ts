// Поиск по меню и прокрутка к текущему пункту. Запрос живёт только в поле: никуда не пишется.
// Меню работает и без этого файла: ссылки и разделы — обычный HTML.

const nav = document.querySelector<HTMLElement>('[data-nav]');
const search = nav?.querySelector<HTMLInputElement>('[data-nav-search]');

if (nav && search) {
  const items = [...nav.querySelectorAll<HTMLElement>('[data-nav-item]')];
  const groups = [...nav.querySelectorAll<HTMLDetailsElement>('[data-nav-group]')];
  const home = nav.querySelector<HTMLElement>('[data-nav-home]');
  const empty = nav.querySelector<HTMLElement>('[data-nav-empty]');
  // Что свернул пользователь: поиск раскрывает разделы, очистка поля возвращает как было.
  let collapsed: HTMLDetailsElement[] | null = null;

  const filter = (): void => {
    const query = search.value.trim().toLowerCase();
    if (query && !collapsed) collapsed = groups.filter((group) => !group.open);

    for (const item of items) item.hidden = !item.dataset['navItem']?.includes(query);
    for (const group of groups) {
      const matched = group.querySelector('[data-nav-item]:not([hidden])') !== null;
      group.hidden = !matched;
      if (query) group.open = true;
    }

    if (home) home.hidden = query !== '';
    if (empty) empty.hidden = groups.some((group) => !group.hidden);

    if (!query && collapsed) {
      for (const group of groups) group.open = !collapsed.includes(group);
      collapsed = null;
    }
  };

  search.addEventListener('input', filter);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && search.value) {
      event.preventDefault();
      search.value = '';
      filter();
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (getComputedStyle(nav).display === 'none') nav.showPopover();
      search.focus();
    }
  });

  // Переход — полная загрузка страницы, позиция прокрутки меню не сохраняется.
  nav.querySelector('.scroll [aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
}
