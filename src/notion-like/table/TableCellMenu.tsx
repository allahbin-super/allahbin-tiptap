import type { Editor } from '@tiptap/react';
import { Grip, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotionThemeClassName, useNotionThemeStyle } from '../notion-theme';
import {
  canMergeCells,
  canSplitCell,
  clearSelectedCells,
  mergeOrSplitCells
} from './table-actions';

const HIGHLIGHT_COLORS = [
  { label: '黄', value: '#fff1b8' },
  { label: '绿', value: '#d9f7be' },
  { label: '蓝', value: '#bae0ff' },
  { label: '红', value: '#ffccc7' },
  { label: '紫', value: '#efdbff' }
];

export const TableCellMenu: React.FC<{
  editor?: Editor | null;
  onOpenChange?: (open: boolean) => void;
  onResizeStart?: (handle: 'tl' | 'tr' | 'bl' | 'br' | null) => (event: React.MouseEvent) => void;
}> = ({ editor, onOpenChange }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuClassName = useNotionThemeClassName('atiptap-notion-drag-menu');
  const menuStyle = useNotionThemeStyle({ top: menuPos.top, left: menuPos.left });
  const cellMenuClassName = useNotionThemeClassName('atiptap-notion-table-cellmenu');

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

  if (!editor) {
    return null;
  }

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
    onOpenChange?.(false);
  };

  const menu = (
    <div ref={menuRef} className={menuClassName} role="menu" style={menuStyle}>
      {canMergeCells(editor) ? (
        <button
          type="button"
          className="atiptap-notion-drag-menu__item"
          onClick={() => run(() => mergeOrSplitCells(editor, 'merge'))}
        >
          合并单元格
        </button>
      ) : null}
      {canSplitCell(editor) ? (
        <button
          type="button"
          className="atiptap-notion-drag-menu__item"
          onClick={() => run(() => mergeOrSplitCells(editor, 'split'))}
        >
          拆分单元格
        </button>
      ) : null}
      <div className="atiptap-notion-drag-menu__label">颜色</div>
      <div className="atiptap-notion-drag-menu__colors">
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
          title="清除"
          className="atiptap-notion-highlight__swatch atiptap-notion-highlight__swatch--clear"
          onClick={() => run(() => editor.chain().focus().unsetNodeBackgroundColor().run())}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      </div>
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
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() => run(() => clearSelectedCells(editor))}
      >
        清空单元格
      </button>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cellMenuClassName}
        data-open={open ? 'true' : 'false'}
        title="单元格操作"
        onMouseDown={event => event.preventDefault()}
        onClick={event => {
          const rect = event.currentTarget.getBoundingClientRect();
          setMenuPos({ top: rect.bottom + 4, left: rect.left });
          const next = !open;
          setOpen(next);
          onOpenChange?.(next);
        }}
      >
        <Grip size={16} />
      </button>
      {open ? createPortal(menu, document.body) : null}
    </>
  );
};
