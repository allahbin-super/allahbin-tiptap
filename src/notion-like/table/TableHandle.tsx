import { FloatingPortal } from '@floating-ui/react';
import type { Editor } from '@tiptap/react';
import React, { useCallback, useMemo, useState } from 'react';
import { useNotionThemeClassName, useNotionThemeStyle } from '../notion-theme';
import { TableHandleMenu } from './TableHandleMenu';
import { colDragStart, dragEnd, rowDragStart } from './table-handle-plugin';
import { useTableHandlePositioning } from './use-table-handle-positioning';
import { useTableHandleState } from './use-table-handle-state';

export const TableHandle: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const state = useTableHandleState(editor);
  const [isRowVisible, setIsRowVisible] = useState(true);
  const [isColumnVisible, setIsColumnVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState<null | 'row' | 'column'>(null);

  const draggingState = useMemo(() => {
    if (!state?.draggingState) {
      return undefined;
    }
    return {
      draggedCellOrientation: state.draggingState.draggedCellOrientation,
      mousePos: state.draggingState.mousePos,
      initialOffset: state.draggingState.initialOffset
    };
  }, [state?.draggingState]);

  const { rowHandle, colHandle } = useTableHandlePositioning(
    state?.show || false,
    state?.referencePosCell || null,
    state?.referencePosTable || null,
    draggingState
  );
  const rowHandleStyle = useNotionThemeStyle(rowHandle.style);
  const colHandleStyle = useNotionThemeStyle(colHandle.style);
  const rowHandleClassName = useNotionThemeClassName(
    `atiptap-notion-table-handle atiptap-notion-table-handle--row${
      menuOpen === 'row' ? ' is-open' : ''
    }${state?.draggingState?.draggedCellOrientation === 'row' ? ' is-dragging' : ''}`
  );
  const colHandleClassName = useNotionThemeClassName(
    `atiptap-notion-table-handle atiptap-notion-table-handle--col${
      menuOpen === 'column' ? ' is-open' : ''
    }${state?.draggingState?.draggedCellOrientation === 'col' ? ' is-dragging' : ''}`
  );

  const onRowDragStart = useCallback((event: React.DragEvent) => {
    rowDragStart({
      dataTransfer: event.dataTransfer,
      currentTarget: event.currentTarget,
      clientY: event.clientY
    });
  }, []);

  const onColDragStart = useCallback((event: React.DragEvent) => {
    colDragStart({
      dataTransfer: event.dataTransfer,
      currentTarget: event.currentTarget,
      clientX: event.clientX
    });
  }, []);

  if (!editor || !editor.isEditable || !state) {
    return null;
  }

  const shouldShowRow =
    (isRowVisible && rowHandle.isMounted && typeof state.rowIndex === 'number') ||
    menuOpen === 'row';
  const shouldShowColumn =
    (isColumnVisible && colHandle.isMounted && typeof state.colIndex === 'number') ||
    menuOpen === 'column';

  return (
    <>
      {shouldShowRow ? (
        <FloatingPortal>
          <div
            ref={rowHandle.ref}
            className={rowHandleClassName}
            style={rowHandleStyle}
            draggable
            onDragStart={onRowDragStart}
            onDragEnd={dragEnd}
          >
            <TableHandleMenu
              editor={editor}
              orientation="row"
              index={state.rowIndex}
              tablePos={state.blockPos}
              tableNode={state.block}
              onOpenChange={open => {
                setMenuOpen(open ? 'row' : null);
                editor.commands[open ? 'freezeHandles' : 'unfreezeHandles']();
                setIsColumnVisible(!open);
              }}
            />
          </div>
        </FloatingPortal>
      ) : null}
      {shouldShowColumn ? (
        <FloatingPortal>
          <div
            ref={colHandle.ref}
            className={colHandleClassName}
            style={colHandleStyle}
            draggable
            onDragStart={onColDragStart}
            onDragEnd={dragEnd}
          >
            <TableHandleMenu
              editor={editor}
              orientation="column"
              index={state.colIndex}
              tablePos={state.blockPos}
              tableNode={state.block}
              onOpenChange={open => {
                setMenuOpen(open ? 'column' : null);
                editor.commands[open ? 'freezeHandles' : 'unfreezeHandles']();
                setIsRowVisible(!open);
              }}
            />
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
};
