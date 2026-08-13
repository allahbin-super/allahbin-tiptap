import type { Node } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/react';
import { MoreVertical } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  addRowOrColumn,
  clearRowOrColumn,
  deleteRowOrColumn,
  duplicateRowOrColumn,
  moveIndexedRowOrColumn,
  selectRowOrColumn,
  sortRowOrColumn,
  toggleHeaderRowOrColumn
} from './table-actions';
import type { Orientation } from './tiptap-table-utils';

const HIGHLIGHT_COLORS = [
  { label: '黄', value: '#fff1b8' },
  { label: '绿', value: '#d9f7be' },
  { label: '蓝', value: '#bae0ff' },
  { label: '红', value: '#ffccc7' },
  { label: '紫', value: '#efdbff' }
];

export const TableHandleMenu: React.FC<{
  editor: Editor;
  orientation: Orientation;
  index?: number;
  tablePos?: number;
  tableNode?: Node;
  onOpenChange?: (open: boolean) => void;
}> = ({ editor, orientation, index, tablePos, onOpenChange }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isRow = orientation === 'row';

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as globalThis.Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
      onOpenChange?.(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, onOpenChange]);

  const openMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof index === 'number' && typeof tablePos === 'number') {
      selectRowOrColumn(editor, tablePos, orientation, index);
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
    onOpenChange?.(false);
  };

  const menu = (
    <div
      ref={menuRef}
      className="atiptap-notion-drag-menu"
      role="menu"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      {index === 0 ? (
        <button
          type="button"
          className="atiptap-notion-drag-menu__item"
          onClick={() => run(() => toggleHeaderRowOrColumn(editor, orientation))}
        >
          {isRow ? '表头行' : '表头列'}
        </button>
      ) : null}
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() =>
          run(() =>
            moveIndexedRowOrColumn(editor, orientation, index ?? 0, isRow ? 'up' : 'left', tablePos)
          )
        }
      >
        {isRow ? '上移' : '左移'}
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() =>
          run(() =>
            moveIndexedRowOrColumn(
              editor,
              orientation,
              index ?? 0,
              isRow ? 'down' : 'right',
              tablePos
            )
          )
        }
      >
        {isRow ? '下移' : '右移'}
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() => run(() => addRowOrColumn(editor, orientation, 'before'))}
      >
        {isRow ? '上方插入行' : '左侧插入列'}
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() => run(() => addRowOrColumn(editor, orientation, 'after'))}
      >
        {isRow ? '下方插入行' : '右侧插入列'}
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() => run(() => sortRowOrColumn(editor, orientation, index ?? 0, 'asc', tablePos))}
      >
        排序 A-Z
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() =>
          run(() => sortRowOrColumn(editor, orientation, index ?? 0, 'desc', tablePos))
        }
      >
        排序 Z-A
      </button>
      <div className="atiptap-notion-drag-menu__label">颜色</div>
      <div className="atiptap-notion-highlight__panel" style={{ position: 'static' }}>
        {HIGHLIGHT_COLORS.map(color => (
          <button
            key={color.value}
            type="button"
            title={color.label}
            className="atiptap-notion-highlight__swatch"
            style={{ background: color.value }}
            onClick={() =>
              run(() => editor.chain().focus().setNodeBackgroundColor(color.value).run())
            }
          />
        ))}
        <button
          type="button"
          className="atiptap-notion-highlight__clear"
          onClick={() => run(() => editor.chain().focus().unsetNodeBackgroundColor().run())}
        >
          清除
        </button>
      </div>
      <div className="atiptap-notion-drag-menu__label">对齐</div>
      {(['left', 'center', 'right'] as const).map(align => (
        <button
          key={align}
          type="button"
          className="atiptap-notion-drag-menu__item"
          onClick={() => run(() => editor.chain().focus().setNodeTextAlign(align).run())}
        >
          {align === 'left' ? '水平居左' : align === 'center' ? '水平居中' : '水平居右'}
        </button>
      ))}
      {(['top', 'middle', 'bottom'] as const).map(align => (
        <button
          key={align}
          type="button"
          className="atiptap-notion-drag-menu__item"
          onClick={() => run(() => editor.chain().focus().setNodeVAlign(align).run())}
        >
          {align === 'top' ? '垂直居上' : align === 'middle' ? '垂直居中' : '垂直居下'}
        </button>
      ))}
      <div className="atiptap-notion-drag-menu__divider" />
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() => run(() => duplicateRowOrColumn(editor, orientation, index ?? 0, tablePos))}
      >
        {isRow ? '复制行' : '复制列'}
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() => run(() => clearRowOrColumn(editor, orientation, index ?? 0, tablePos))}
      >
        {isRow ? '清空行' : '清空列'}
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item atiptap-notion-drag-menu__item--danger"
        onClick={() => run(() => deleteRowOrColumn(editor, orientation))}
      >
        {isRow ? '删除行' : '删除列'}
      </button>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="atiptap-notion-table-handle__menu"
        title={isRow ? '行操作' : '列操作'}
        onMouseDown={event => event.stopPropagation()}
        onClick={openMenu}
      >
        <MoreVertical size={12} />
      </button>
      {open ? createPortal(menu, document.body) : null}
    </>
  );
};
