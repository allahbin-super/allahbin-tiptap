import { FloatingPortal } from '@floating-ui/react';
import { TableMap } from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/react';
import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const isRow = orientation === 'row';
  const movedRef = useRef(false);
  const [dragState, setDragState] = useState<{
    startPos: number;
    originalHeight: number;
    originalWidth: number;
  } | null>(null);

  const startDrag = (event: React.MouseEvent) => {
    if (!state) return;
    const dims = TableMap.get(state.block);
    movedRef.current = false;
    setDragState({
      startPos: isRow ? event.clientY : event.clientX,
      originalHeight: dims.height,
      originalWidth: dims.width
    });
    onMouseDown();
    event.preventDefault();
  };

  const handleClick = () => {
    if (movedRef.current || !state) return;
    runPreservingCursor(editor, () => {
      selectLastCell(editor, state.block, state.blockPos, orientation);
      if (isRow) editor.commands.addRowAfter();
      else editor.commands.addColumnAfter();
    });
  };

  useEffect(() => {
    if (!dragState || !state) return;
    const handleMove = (event: MouseEvent) => {
      movedRef.current = true;
      const currentPos = isRow ? event.clientY : event.clientX;
      const cellSize = isRow ? EMPTY_CELL_HEIGHT : EMPTY_CELL_WIDTH;
      const currentDims = TableMap.get(state.block);
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
          selectLastCell(editor, state.block, state.blockPos, orientation);
          for (let i = 0; i < delta; i += 1) {
            if (isRow) editor.commands.addRowAfter();
            else editor.commands.addColumnAfter();
          }
        });
      } else {
        runPreservingCursor(editor, () => {
          const emptyCount = isRow
            ? countEmptyRowsFromEnd(editor, state.blockPos)
            : countEmptyColumnsFromEnd(editor, state.blockPos);
          const safeToRemove = Math.min(Math.abs(delta), emptyCount, currentCount - 1);
          selectLastCell(editor, state.block, state.blockPos, orientation);
          for (let i = 0; i < safeToRemove; i += 1) {
            if (isRow) editor.commands.deleteRow();
            else editor.commands.deleteColumn();
          }
        });
      }
    };
    const handleUp = () => {
      setDragState(null);
      onMouseUp();
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragState, editor, isRow, onMouseUp, orientation, state]);

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

  const freeze = useCallback(() => editor?.commands.freezeHandles(), [editor]);
  const unfreeze = useCallback(() => editor?.commands.unfreezeHandles(), [editor]);

  if (!editor || !state) {
    return null;
  }

  return (
    <>
      {state.showAddOrRemoveRowsButton && rowButton.isMounted ? (
        <FloatingPortal>
          <div ref={rowButton.ref} style={rowButton.style}>
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
          <div ref={columnButton.ref} style={columnButton.style}>
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
