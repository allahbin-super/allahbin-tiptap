export type ScrollParent = HTMLElement | Window;

const OVERFLOW_RE = /(auto|scroll|overlay)/;

export const collectScrollParents = (el: HTMLElement | null): ScrollParent[] => {
  const parents: ScrollParent[] = [];
  let current: HTMLElement | null = el?.parentElement ?? null;
  while (current) {
    const style = getComputedStyle(current);
    if (OVERFLOW_RE.test(style.overflowY) || OVERFLOW_RE.test(style.overflowX)) {
      parents.push(current);
    }
    current = current.parentElement;
  }
  parents.push(window);
  return parents;
};

export const findScrollContainer = (el: HTMLElement): ScrollParent => {
  return collectScrollParents(el)[0] ?? window;
};

export const onScrollParents = (el: HTMLElement | null, handler: () => void): (() => void) => {
  const parents = collectScrollParents(el);
  parents.forEach(parent => {
    parent.addEventListener('scroll', handler, { passive: true, capture: true });
  });
  return () => {
    parents.forEach(parent => {
      parent.removeEventListener('scroll', handler, true);
    });
  };
};

export const scrollElementIntoContainer = (el: HTMLElement, offset = 24) => {
  const scroller = findScrollContainer(el);
  if (scroller instanceof Window) {
    el.scrollIntoView({ block: 'start' });
    return;
  }
  const scrollerRect = scroller.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  scroller.scrollTop += elRect.top - scrollerRect.top - offset;
};
