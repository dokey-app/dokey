// Дерево JSON на <details>. Дети контейнера строятся при первом раскрытии, по 1000 за раз:
// большой документ не превращается в сотни тысяч DOM-узлов одним махом.
// Ввод попадает в DOM только через textContent.
//
// Путь узла копируется одной кнопкой над деревом: фокус или клик выбирает узел. Кнопка в
// каждой строке дала бы вложенный интерактивный элемент в <summary> и лишние остановки Tab.

import { countNodes, pathSegment, type JsonNode } from './logic.ts';

const CHUNK = 1000;
/** Выше — «Развернуть» прячется: построить всё дерево целиком слишком дорого. */
export const EXPAND_ALL_LIMIT = 5000;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function keyLabel(key: string | number | null): HTMLElement | null {
  if (key === null) return null;
  return el('span', typeof key === 'number' ? 'tree-index' : 'tree-key', String(key));
}

function children(node: JsonNode): [string | number, JsonNode][] {
  if (node.kind === 'object') return node.entries.map((e) => [e.key, e.value]);
  if (node.kind === 'array') return node.items.map((item, i) => [i, item]);
  return [];
}

function renderNode(node: JsonNode, key: string | number | null, path: string): HTMLLIElement {
  const li = el('li');
  if (node.kind !== 'object' && node.kind !== 'array') {
    li.className = 'tree-leaf';
    li.tabIndex = 0;
    li.dataset['path'] = path;
    const label = keyLabel(key);
    if (label) li.append(label, el('span', 'tree-punct', ': '));
    li.append(el('span', `tree-${node.kind === 'literal' ? node.raw : node.kind}`, node.raw));
    return li;
  }

  const size = node.kind === 'object' ? node.entries.length : node.items.length;
  const details = el('details');
  const summary = el('summary');
  const label = keyLabel(key);
  if (label) summary.append(label, el('span', 'tree-punct', ': '));
  summary.append(el('span', 'tree-meta', node.kind === 'object' ? `{${size}}` : `[${size}]`));
  summary.dataset['path'] = path;
  details.append(summary);
  details.dataset['rendered'] = 'false';
  details.addEventListener('toggle', () => {
    if (details.open) renderChildren(details, node, path);
  });
  li.append(details);
  return li;
}

function renderChildren(details: HTMLDetailsElement, node: JsonNode, path: string): void {
  if (details.dataset['rendered'] === 'true') return;
  details.dataset['rendered'] = 'true';
  const list = el('ul');
  details.append(list);
  const all = children(node);
  let shown = 0;
  const more = el('button', 'btn btn-small tree-more');
  more.type = 'button';
  const showNext = (): void => {
    for (const [key, child] of all.slice(shown, shown + CHUNK)) {
      list.append(renderNode(child, key, pathSegment(path, key)));
    }
    shown = Math.min(shown + CHUNK, all.length);
    const rest = all.length - shown;
    more.textContent = `Показать ещё ${Math.min(rest, CHUNK)} из ${rest}`;
    if (rest > 0) list.after(more);
    else more.remove();
  };
  more.addEventListener('click', showNext);
  showNext();
}

export interface Tree {
  expandAll(): void;
  collapseAll(): void;
  canExpandAll: boolean;
}

export function renderTree(container: HTMLElement, root: JsonNode): Tree {
  const ul = el('ul', 'tree-root');
  const li = renderNode(root, null, '$');
  ul.append(li);
  container.replaceChildren(ul);
  const rootDetails = li.querySelector('details');
  if (rootDetails) rootDetails.open = true;

  return {
    canExpandAll: countNodes(root) <= EXPAND_ALL_LIMIT,
    expandAll() {
      // Раскрытие рендерит детей синхронно (toggle-событие асинхронно, поэтому зовём сами).
      const queue = [...container.querySelectorAll('details')];
      while (queue.length > 0) {
        const details = queue.shift()!;
        details.open = true;
        details.dispatchEvent(new Event('toggle'));
        for (
          let more = details.querySelector<HTMLButtonElement>(':scope > .tree-more');
          more;
          more = details.querySelector<HTMLButtonElement>(':scope > .tree-more')
        ) {
          more.click();
        }
        queue.push(...details.querySelectorAll<HTMLDetailsElement>(':scope > ul > li > details'));
      }
    },
    collapseAll() {
      for (const details of container.querySelectorAll('details')) {
        details.open = details === rootDetails;
      }
    },
  };
}

/** Выбор узла фокусом или кликом; `onSelect` получает путь выбранного узла. */
export function bindSelection(container: HTMLElement, onSelect: (path: string) => void): void {
  const select = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const row = event.target.closest<HTMLElement>('[data-path]');
    if (!row || !container.contains(row)) return;
    container.querySelector('.is-selected')?.classList.remove('is-selected');
    row.classList.add('is-selected');
    onSelect(row.dataset['path'] ?? '$');
  };
  container.addEventListener('focusin', select);
  container.addEventListener('click', select);
}
