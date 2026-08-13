import { Extension } from '@tiptap/core';
import { NodeRange } from '@tiptap/extension-node-range';
import { Placeholder, TrailingNode } from '@tiptap/extensions';
import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import classNames from 'classnames';
import 'highlight.js/styles/github.css';
import React, { useEffect, useRef, useState } from 'react';
import type { UploaderFunc } from '../image-upload';
import { createImageUploadExtensions, insertImageFiles, pickLocalImage } from '../image-upload';
import { StarterKit } from '../starter-kit';
import { BlockDragHandle } from './BlockDragHandle';
import { FloatingToolbar } from './FloatingToolbar';
import { duplicateNode, moveBlock } from './block-actions';
import {
  ImageUploadNode,
  NotionImage,
  downloadSelectedImage,
  insertImageUploadNode,
  selectNearestImage,
  setImageAlign
} from './image';
import './notion-like.css';
import { NotionSlashMenu } from './slash/SlashSuggestionMenu';
import {
  NotionTableKit,
  TableCellAttrs,
  TableCellMenu,
  TableExtendButtons,
  TableHandle,
  TableHandleExtension,
  TableSelectionOverlay
} from './table';

/** 点击编辑器底部空白时，把光标落到末尾可编辑块 */
function focusTrailingBlockOnEmptyClick(view: EditorView, event: MouseEvent): boolean {
  if (!(event.target instanceof Element) || !view.dom.contains(event.target)) {
    return false;
  }
  // 点在具体块上时交给默认行为
  if (event.target !== view.dom && event.target.closest('.ProseMirror > *')) {
    return false;
  }

  const lastChild = view.dom.lastElementChild;
  if (!lastChild) {
    return false;
  }

  const lastBottom = lastChild.getBoundingClientRect().bottom;
  if (event.clientY <= lastBottom) {
    return false;
  }

  const { doc } = view.state;
  const selection = TextSelection.near(doc.resolve(doc.content.size), -1);
  view.dispatch(view.state.tr.setSelection(selection));
  view.focus();
  return true;
}

export type NotionContentMode = 'html' | 'md' | 'json';

export type NotionLikeEditorProps = {
  /**
   * @description 回传 / 赋值模式
   * @default "md"
   */
  mode?: NotionContentMode;
  /** 富文本的值：html / md 为字符串，json 为对象 */
  value?: any;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  imageUploader?: UploaderFunc;
  onChange?: (value: any, editor: Editor) => void;
  onReady?: (editor: Editor) => void;
};

const getMarkdown = (editor: Editor) => {
  const markdownStorage = editor.storage as {
    markdown?: { getMarkdown?: () => string };
  };
  return markdownStorage.markdown?.getMarkdown?.() || '';
};

const getValueByMode = (editor: Editor, mode: NotionContentMode) => {
  if (mode === 'json') {
    return editor.getJSON();
  }
  if (mode === 'html') {
    return editor.getHTML();
  }
  return getMarkdown(editor);
};

const isSameValue = (a: any, b: any, mode: NotionContentMode) => {
  if (mode === 'json') {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }
  return (a ?? '') === (b ?? '');
};

const normalizeContent = (value: any, mode: NotionContentMode) => {
  if (value === undefined || value === null || value === '') {
    return mode === 'json' ? { type: 'doc', content: [{ type: 'paragraph' }] } : '';
  }
  if (mode === 'json' && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return { type: 'doc', content: [{ type: 'paragraph' }] };
    }
  }
  return value;
};

const BlockShortcuts = Extension.create({
  name: 'atiptapBlockShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-d': () => duplicateNode(this.editor),
      'Mod-Shift-ArrowUp': () => moveBlock(this.editor, -1),
      'Mod-Shift-ArrowDown': () => moveBlock(this.editor, 1),
      'Mod-Shift-i': () => insertImageUploadNode(this.editor),
      'Alt-Shift-l': () => setImageAlign(this.editor, 'left'),
      'Alt-Shift-e': () => setImageAlign(this.editor, 'center'),
      'Alt-Shift-r': () => setImageAlign(this.editor, 'right'),
      'Mod-Shift-d': () => {
        void downloadSelectedImage(this.editor);
        return true;
      }
    };
  }
});

/** Notion 风格块编辑器，支持 html / md / json 读写 */
export const NotionLikeEditor: React.FC<NotionLikeEditorProps> = ({
  mode = 'md',
  value = '',
  placeholder = '输入 / 插入内容',
  editable = true,
  className,
  style,
  imageUploader,
  onChange,
  onReady
}) => {
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const modeRef = useRef(mode);
  const lastValueRef = useRef(value);
  const [imageUrlOpen, setImageUrlOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  onChangeRef.current = onChange;
  onReadyRef.current = onReady;
  modeRef.current = mode;

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    content: normalizeContent(value, mode),
    extensions: [
      StarterKit.configure({
        image: false,
        table: false,
        dropcursor: {
          color: '#1677ff',
          width: 2
        }
      }),
      NotionImage.configure({
        allowBase64: true
      }),
      ImageUploadNode,
      NotionTableKit,
      TableHandleExtension,
      TableCellAttrs,
      NodeRange,
      BlockShortcuts,
      TrailingNode.configure({
        node: 'paragraph',
        notAfter: ['paragraph']
      }),
      ...createImageUploadExtensions(imageUploader),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'image' || node.type.name === 'imageUpload') {
            return '';
          }
          return placeholder;
        },
        emptyNodeClass: ({ node }) => {
          if (node.type.name === 'image' || node.type.name === 'imageUpload') {
            return '';
          }
          return 'is-empty with-slash';
        },
        showOnlyCurrent: true
      })
    ],
    editorProps: {
      attributes: {
        class: 'atiptap-notion-prosemirror',
        spellcheck: 'false'
      },
      handleClick: (view, _pos, event) => focusTrailingBlockOnEmptyClick(view, event)
    },
    onCreate: ({ editor: currentEditor }) => {
      currentEditor.storage.imageUploader.requestUrlInsert = () => setImageUrlOpen(true);
      lastValueRef.current = getValueByMode(currentEditor, modeRef.current);
      onReadyRef.current?.(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = getValueByMode(currentEditor, modeRef.current);
      lastValueRef.current = nextValue;
      onChangeRef.current?.(nextValue, currentEditor);
    }
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    editor.storage.imageUploader.upload = imageUploader;
    editor.storage.imageUploader.requestUrlInsert = () => setImageUrlOpen(true);
  }, [editor, imageUploader]);

  useEffect(() => {
    if (!editor || editor.isDestroyed || value === undefined) {
      return;
    }
    if (isSameValue(value, lastValueRef.current, mode)) {
      return;
    }
    const content = normalizeContent(value, mode);
    lastValueRef.current = mode === 'json' ? content : value || '';
    editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, value, mode]);

  if (!editor) {
    return <div className="atiptap-notion-loading">编辑器加载中...</div>;
  }

  return (
    <div className={classNames('atiptap-notion', className)} style={style}>
      <BlockDragHandle editor={editor} />
      <FloatingToolbar editor={editor} />
      <TableHandle editor={editor} />
      <TableExtendButtons editor={editor} />
      <TableSelectionOverlay editor={editor} cellMenu={TableCellMenu} />
      <NotionSlashMenu editor={editor} />
      {imageUrlOpen ? (
        <div className="atiptap-notion-image-url">
          <input
            autoFocus
            type="url"
            className="atiptap-notion-link__input"
            placeholder="输入图片地址 https://"
            value={imageUrl}
            onChange={event => setImageUrl(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && imageUrl.trim()) {
                editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
                selectNearestImage(editor);
                setImageUrl('');
                setImageUrlOpen(false);
              }
              if (event.key === 'Escape') {
                setImageUrlOpen(false);
              }
            }}
          />
          <button
            type="button"
            className="atiptap-notion-link__action"
            onClick={() => {
              if (!imageUrl.trim()) {
                return;
              }
              editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
              selectNearestImage(editor);
              setImageUrl('');
              setImageUrlOpen(false);
            }}
          >
            插入
          </button>
          <button
            type="button"
            className="atiptap-notion-link__action"
            onClick={() => {
              pickLocalImage(file => {
                void insertImageFiles(editor, [file], imageUploader);
                setImageUrlOpen(false);
              });
            }}
          >
            本地
          </button>
          <button
            type="button"
            className="atiptap-notion-link__action"
            onClick={() => setImageUrlOpen(false)}
          >
            取消
          </button>
        </div>
      ) : null}
      <EditorContent editor={editor} className="atiptap-notion-content" />
    </div>
  );
};

export default NotionLikeEditor;
