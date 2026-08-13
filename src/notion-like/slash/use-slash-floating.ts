import type { UseFloatingOptions } from '@floating-ui/react';
import {
  autoUpdate,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles
} from '@floating-ui/react';
import { useEffect, useMemo } from 'react';

/** 把斜杠菜单锚定到当前装饰节点 */
export function useSlashFloating(
  show: boolean,
  reference: HTMLElement | null,
  zIndex: number,
  options?: Partial<UseFloatingOptions>
) {
  const { refs, context, floatingStyles } = useFloating({
    open: show,
    whileElementsMounted(referenceEl, floatingEl, update) {
      return autoUpdate(referenceEl, floatingEl, update);
    },
    ...options
  });

  const { isMounted, styles } = useTransitionStyles(context);
  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    refs.setReference(reference);
  }, [reference, refs]);

  return useMemo(
    () => ({
      isMounted,
      ref: refs.setFloating,
      style: {
        ...styles,
        ...floatingStyles,
        zIndex
      } as React.CSSProperties,
      getFloatingProps
    }),
    [floatingStyles, isMounted, refs.setFloating, styles, zIndex, getFloatingProps]
  );
}
