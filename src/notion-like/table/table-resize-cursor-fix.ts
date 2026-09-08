import { Plugin, PluginKey } from '@tiptap/pm/state';
import { columnResizingPluginKey } from '@tiptap/pm/tables';
import type { EditorView } from '@tiptap/pm/view';

const columnResizeCursorFixKey = new PluginKey('columnResizeCursorFix');

function clearColumnResizeHandle(view: EditorView) {
  if (view.isDestroyed) {
    return;
  }

  const pluginState = columnResizingPluginKey.getState(view.state);
  if (pluginState && pluginState.activeHandle > -1) {
    view.dispatch(view.state.tr.setMeta(columnResizingPluginKey, { setHandle: -1 }));
  }
  view.dom.classList.remove('resize-cursor');
}

/**
 * columnResizing keeps `activeHandle` after mouseup. If the pointer lands on a
 * floating table chrome (handles / extend buttons), the editor never gets
 * mousemove/mouseleave and the resize cursor + blue handle stick. Clear on
 * pointerup after the built-in plugin has finished.
 */
export function columnResizeCursorFix() {
  return new Plugin({
    key: columnResizeCursorFixKey,
    view(view) {
      const onPointerUp = () => {
        queueMicrotask(() => clearColumnResizeHandle(view));
      };

      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      return {
        destroy() {
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointercancel', onPointerUp);
          view.dom.classList.remove('resize-cursor');
        }
      };
    }
  });
}
