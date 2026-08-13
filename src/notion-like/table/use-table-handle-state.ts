import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useState } from 'react';
import type { TableHandlesState } from './table-handle-plugin';

export function useTableHandleState(editor?: Editor | null) {
  const [state, setState] = useState<TableHandlesState | null>(null);
  const onStateChange = useCallback((next: TableHandlesState) => {
    setState(next);
  }, []);

  useEffect(() => {
    if (!editor) {
      setState(null);
      return;
    }
    editor.on('tableHandleState', onStateChange);
    return () => {
      editor.off('tableHandleState', onStateChange);
    };
  }, [editor, onStateChange]);

  return state;
}
