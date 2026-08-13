import type { Editor } from '@tiptap/core';
import { Check, Link as LinkIcon, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export type LinkPopoverProps = {
  editor: Editor;
  /** 作为划词栏按钮使用 */
  compact?: boolean;
};

/** antd 风格链接编辑浮层，去掉 window.prompt */
export const LinkPopover: React.FC<LinkPopoverProps> = ({ editor, compact = true }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = editor.isActive('link');

  useEffect(() => {
    if (!open) {
      return;
    }
    setUrl((editor.getAttributes('link').href as string) || '');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [editor, open]);

  const apply = () => {
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setOpen(false);
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setUrl('');
    setOpen(false);
  };

  return (
    <div className="atiptap-notion-link" ref={panelRef}>
      <button
        type="button"
        className={compact ? 'atiptap-notion-bubble__btn' : 'atiptap-notion-link__trigger'}
        title="链接"
        data-active={isActive || open ? 'true' : 'false'}
        onMouseDown={event => event.preventDefault()}
        onClick={() => setOpen(current => !current)}
      >
        <LinkIcon size={15} />
        {compact ? null : <span>链接</span>}
      </button>
      {open ? (
        <div className="atiptap-notion-link__panel" role="dialog" aria-label="编辑链接">
          <input
            ref={inputRef}
            type="url"
            className="atiptap-notion-link__input"
            placeholder="粘贴链接..."
            value={url}
            onChange={event => setUrl(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                apply();
              }
              if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
          />
          <button
            type="button"
            className="atiptap-notion-link__action"
            title="应用"
            onClick={apply}
          >
            <Check size={14} />
          </button>
          {isActive ? (
            <button
              type="button"
              className="atiptap-notion-link__action atiptap-notion-link__action--danger"
              title="移除链接"
              onClick={remove}
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
