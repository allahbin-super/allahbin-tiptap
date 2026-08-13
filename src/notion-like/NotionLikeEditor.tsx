import { NodeRange } from '@tiptap/extension-node-range';
import { Placeholder } from '@tiptap/extensions';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
import { StarterKit } from '../starter-kit';
import { BlockDragHandle } from './BlockDragHandle';
import { FloatingToolbar } from './FloatingToolbar';
import './notion-like.css';
import { NotionSlashMenu } from './slash/SlashSuggestionMenu';

export type NotionLikeEditorProps = {
  /** Markdown 内容 */
  value?: string;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onChange?: (markdown: string, editor: Editor) => void;
  onReady?: (editor: Editor) => void;
};

const getMarkdown = (editor: Editor) => {
  const markdownStorage = editor.storage as {
    markdown?: { getMarkdown?: () => string };
  };
  return markdownStorage.markdown?.getMarkdown?.() || '';
};

/** Notion 风格 + Markdown 的块编辑器 */
export const NotionLikeEditor: React.FC<NotionLikeEditorProps> = ({
  value = '',
  placeholder = '输入 / 插入内容',
  editable = true,
  className,
  style,
  onChange,
  onReady
}) => {
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const lastMarkdownRef = useRef(value);
  onChangeRef.current = onChange;
  onReadyRef.current = onReady;

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    content: value,
    extensions: [
      StarterKit.configure({
        dropcursor: {
          color: '#1677ff',
          width: 2
        }
      }),
      NodeRange,
      Placeholder.configure({
        placeholder,
        emptyNodeClass: 'is-empty with-slash',
        showOnlyCurrent: true
      })
    ],
    editorProps: {
      attributes: {
        class: 'atiptap-notion-prosemirror',
        spellcheck: 'false'
      }
    },
    onCreate: ({ editor: currentEditor }) => {
      onReadyRef.current?.(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }) => {
      const markdown = getMarkdown(currentEditor);
      lastMarkdownRef.current = markdown;
      onChangeRef.current?.(markdown, currentEditor);
    }
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || editor.isDestroyed || value === undefined) {
      return;
    }
    if (value === lastMarkdownRef.current) {
      return;
    }
    lastMarkdownRef.current = value || '';
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return <div className="atiptap-notion-loading">编辑器加载中...</div>;
  }

  return (
    <div className={classNames('atiptap-notion', className)} style={style}>
      <BlockDragHandle editor={editor} />
      <FloatingToolbar editor={editor} />
      <NotionSlashMenu editor={editor} />
      <EditorContent editor={editor} className="atiptap-notion-content" />
    </div>
  );
};

export default NotionLikeEditor;
