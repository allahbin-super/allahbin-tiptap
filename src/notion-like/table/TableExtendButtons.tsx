import { FloatingPortal } from '@floating-ui/react';
import { TableMap } from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/react';
import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNotionThemeClassName, useNotionThemeStyle } from '../notion-theme';
import type { Orientation } from './tiptap-table-utils';
import {
  EMPTY_CELL_HEIGHT,
  EMPTY_CELL_WIDTH,
  countEmptyColumnsFromEnd,
  countEmptyRowsFromEnd,
  marginRound,
  runPreservingCursor,
  selectLastCell
} from './tiptap-table-utils';
import { useTableExtendRowColumnButtonsPositioning } from './use-table-extend-row-column';
import { useTableHandleState } from './use-table-handle-state';

const ExtendButton: React.FC<{
  editor: Editor;
  orientation: Orientation;
  onMouseDown: () => void;
  onMouseUp: () => void;
}> = ({ editor, orientation, onMouseDown, onMouseUp }) => {
  const state = useTableHandleState(editor);
  const stateRef = useRef(state);
  stateRef.current = state;
  const isRow = orientation === 'row';
  const movedRef = useRef(false);
  const draggingRef = useRef(false);
  const [dragState, setDragState] = useState<{
    startPos: number;
    originalHeight: number;
    originalWidth: number;
  } | null>(null);

  const finishDrag = useCallback(() => {
    if (!draggingRef.current) {
      return;
    }
    draggingRef.current = false;
    setDragState(null);
    document.documentElement.style.removeProperty('cursor');
    onMouseUp();
  }, [onMouseUp]);

  const startDrag = (event: React.MouseEvent) => {
    const current = stateRef.current;
    if (!current) return;
    const dims = TableMap.get(current.block);
    movedRef.current = false;
    draggingRef.current = true;
    setDragState({
      startPos: isRow ? event.clientY : event.clientX,
      originalHeight: dims.height,
      originalWidth: dims.width
    });
    document.documentElement.style.cursor = isRow ? 'row-resize' : 'col-resize';
    onMouseDown();
    event.preventDefault();
  };

  const handleClick = () => {
    const current = stateRef.current;
    if (movedRef.current || !current) return;
    runPreservingCursor(editor, () => {
      selectLastCell(editor, current.block, current.blockPos, orientation);
      if (isRow) editor.commands.addRowAfter();
      else editor.commands.addColumnAfter();
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (event: MouseEvent) => {
      const current = stateRef.current;
      if (!current) return;
      movedRef.current = true;
      const currentPos = isRow ? event.clientY : event.clientX;
      const cellSize = isRow ? EMPTY_CELL_HEIGHT : EMPTY_CELL_WIDTH;
      const currentDims = TableMap.get(current.block);
      const currentCount = isRow ? currentDims.height : currentDims.width;
      const originalCount = isRow ? dragState.originalHeight : dragState.originalWidth;
      const newCount = Math.max(
        1,
        originalCount + marginRound((currentPos - dragState.startPos) / cellSize, 0.3)
      );
      const delta = newCount - currentCount;
      if (delta === 0) return;
      if (delta > 0) {
        runPreservingCursor(editor, () => {
          selectLastCell(editor, current.block, current.blockPos, orientation);
          for (let i = 0; i < delta; i += 1) {
            if (isRow) editor.commands.addRowAfter();
            else editor.commands.addColumnAfter();
          }
        });
      } else {
        runPreservingCursor(editor, () => {
          const emptyCount = isRow
            ? countEmptyRowsFromEnd(editor, current.blockPos)
            : countEmptyColumnsFromEnd(editor, current.blockPos);
          const safeToRemove = Math.min(Math.abs(delta), emptyCount, currentCount - 1);
          selectLastCell(editor, current.block, current.blockPos, orientation);
          for (let i = 0; i < safeToRemove; i += 1) {
            if (isRow) editor.commands.deleteRow();
            else editor.commands.deleteColumn();
          }
        });
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
      if (draggingRef.current) {
        draggingRef.current = false;
        document.documentElement.style.removeProperty('cursor');
        onMouseUp();
      }
    };
  }, [dragState, editor, finishDrag, isRow, onMouseUp, orientation]);

  if (!editor.isEditable) return null;

  return (
    <button
      type="button"
      className={`atiptap-notion-table-extend atiptap-notion-table-extend--${isRow ? 'row' : 'col'}${dragState ? ' is-editing' : ''}`}
      title={isRow ? '加行 / 拖拽增减' : '加列 / 拖拽增减'}
      onClick={handleClick}
      onMouseDown={startDrag}
    >
      <Plus size={12} />
    </button>
  );
};

export const TableExtendButtons: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const state = useTableHandleState(editor);
  const { rowButton, columnButton } = useTableExtendRowColumnButtonsPositioning(
    Boolean(state?.showAddOrRemoveColumnsButton),
    Boolean(state?.showAddOrRemoveRowsButton),
    state?.referencePosTable || null
  );
  const rowButtonStyle = useNotionThemeStyle(rowButton.style);
  const columnButtonStyle = useNotionThemeStyle(columnButton.style);
  const rowButtonClassName = useNotionThemeClassName();
  const columnButtonClassName = useNotionThemeClassName();

  const freeze = useCallback(() => editor?.commands.freezeHandles(), [editor]);
  const unfreeze = useCallback(() => editor?.commands.unfreezeHandles(), [editor]);

  if (!editor || !state) {
    return null;
  }

  return (
    <>
      {state.showAddOrRemoveRowsButton && rowButton.isMounted ? (
        <FloatingPortal>
          <div ref={rowButton.ref} className={rowButtonClassName} style={rowButtonStyle}>
            <ExtendButton
              editor={editor}
              orientation="row"
              onMouseDown={freeze}
              onMouseUp={unfreeze}
            />
          </div>
        </FloatingPortal>
      ) : null}
      {state.showAddOrRemoveColumnsButton && columnButton.isMounted ? (
        <FloatingPortal>
          <div ref={columnButton.ref} className={columnButtonClassName} style={columnButtonStyle}>
            <ExtendButton
              editor={editor}
              orientation="column"
              onMouseDown={freeze}
              onMouseUp={unfreeze}
            />
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
};
