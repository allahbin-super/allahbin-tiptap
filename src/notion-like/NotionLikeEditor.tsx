import { Extension, type AnyExtension } from '@tiptap/core';
import { FindAndReplace } from '@tiptap/extension-find-and-replace';
import { NodeRange } from '@tiptap/extension-node-range';
import { Placeholder, TrailingNode } from '@tiptap/extensions';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import classNames from 'classnames';
import 'highlight.js/styles/github.css';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { UploaderFunc } from '../image-upload';
import { createMediaUploadExtensions, insertImageFiles, pickLocalImage } from '../image-upload';
import { StarterKit } from '../starter-kit';
import { BlockDragHandle, type BlockIcon, type BlockMenuExtraContext } from './BlockDragHandle';
import { DocumentOutline, type OutlineMode } from './DocumentOutline';
import { FloatingToolbar } from './FloatingToolbar';
import { NotionToolbar } from './NotionToolbar';
import { duplicateNode, moveBlock, setEditorMeta } from './block-actions';
import {
  FileNode,
  FileNodeProvider,
  FileUploadNode,
  insertFileUploadNode,
  type FileNodeInfo,
  type FileRenderers
} from './file';
import {
  ImageUploadNode,
  NotionImage,
  downloadSelectedImage,
  insertImageUploadNode,
  selectNearestImage,
  setImageAlign
} from './image';
import './notion-like.css';
import { NOTION_THEME_CLASS, NotionThemeProvider, mergeNotionThemeVars } from './notion-theme';
import { NotionSlashMenu } from './slash/SlashSuggestionMenu';
import type { SlashSuggestionItem } from './slash/slash-types';
import {
  NotionTableKit,
  TableCellAttrs,
  TableCellMenu,
  TableExtendButtons,
  TableHandle,
  TableHandleExtension,
  TableSelectionOverlay
} from './table';

export type { BlockIcon, BlockMenuExtraContext };
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

export type NotionCssVars = {
  [key: `--${string}`]: string | number;
};

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
  /**
   * CSS 变量（`--atiptap-*`），会同时作用到编辑器根节点和浮层（斜杠菜单、划词栏、块菜单等）。
   * `style` 里的 `--*` 也会并入；同名时 `style` 优先。
   */
  cssVars?: NotionCssVars;
  /** 图片上传，返回 URL；未传时可用 fileUploader 兜底 */
  imageUploader?: UploaderFunc;
  /**
   * 非图片文件上传，返回 URL（必填才能插入视频/音频/附件）
   * 文档只存 URL，不存原始文件
   */
  fileUploader?: UploaderFunc;
  /** 按 kind 自定义文件块渲染；不传则用默认播放器 / 附件卡片 */
  fileRenderers?: FileRenderers;
  /** 文件块点击回调；附件未传时默认 window.open(src) */
  onFileClick?: (info: FileNodeInfo, event: React.MouseEvent) => void;
  onChange?: (value: any, editor: Editor) => void;
  onReady?: (editor: Editor) => void;
  /**
   * 是否显示头部快捷操作区（撤销、标题、列表、格式、对齐、图片等）
   * 可编辑时默认显示，只读模式不显示
   * @default true
   */
  showToolbar?: boolean;
  /**
   * 是否显示编辑器边框
   * @default true
   */
  bordered?: boolean;
  /**
   * 是否显示目录大纲
   * @default true
   */
  showOutline?: boolean;
  /**
   * 目录展示模式
   * - float：悬浮。左侧刻度条贴在内容边距内，悬停展开标题（默认）
   * - fixed：固定。仍在左侧，展开后常显、不自动隐藏
   * @default "float"
   */
  outlineMode?: OutlineMode;
  /** 目录模式变化（图钉切换或受控更新） */
  onOutlineModeChange?: (mode: OutlineMode) => void;
  /**
   * 追加到内置扩展之后的 Tiptap Extension / Node。
   * 勿与内置名冲突（如 file / image / table）。引用变化会重建编辑器，请保持稳定。
   * 自定义块优先 mode="json"；md 模式下需自行实现 Markdown 序列化。
   */
  extraExtensions?: AnyExtension[];
  /** 追加斜杠菜单项（内置项在前）；也可传 (editor) => items */
  slashItems?: SlashSuggestionItem[] | ((editor: Editor) => SlashSuggestionItem[]);
  /** 工具栏额外按钮，插在图片/文件/表格之后、搜索之前 */
  toolbarExtra?: React.ReactNode | ((editor: Editor) => React.ReactNode);
  /** 拖拽句柄块图标；返回非 null 时覆盖内置映射 */
  getBlockIcon?: (node: ProseMirrorNode) => BlockIcon | null;
  /** 拖拽句柄块菜单额外项，插在「转为」与图片/表格专属项之后 */
  blockMenuExtra?: (ctx: BlockMenuExtraContext) => React.ReactNode;
  /** 逃生舱：自定义浮动栏等，挂在 EditorContent 旁 */
  children?: React.ReactNode | ((editor: Editor) => React.ReactNode);
};

export type { OutlineMode };

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

const MEDIA_PLACEHOLDER_NODES = new Set(['image', 'imageUpload', 'file', 'fileUpload']);

const BlockShortcuts = Extension.create({
  name: 'atiptapBlockShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-d': () => duplicateNode(this.editor),
      'Mod-Shift-ArrowUp': () => moveBlock(this.editor, -1),
      'Mod-Shift-ArrowDown': () => moveBlock(this.editor, 1),
      'Mod-Shift-i': () => insertImageUploadNode(this.editor),
      'Mod-Shift-f': () => insertFileUploadNode(this.editor, 'file'),
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
  cssVars,
  imageUploader,
  fileUploader,
  fileRenderers,
  onFileClick,
  onChange,
  onReady,
  showToolbar = true,
  bordered = true,
  showOutline = true,
  outlineMode = 'float',
  onOutlineModeChange,
  extraExtensions,
  slashItems,
  toolbarExtra,
  getBlockIcon,
  blockMenuExtra,
  children
}) => {
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const modeRef = useRef(mode);
  const lastValueRef = useRef(value);
  const [imageUrlOpen, setImageUrlOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [currentOutlineMode, setCurrentOutlineMode] = useState<OutlineMode>(outlineMode);
  onChangeRef.current = onChange;
  onReadyRef.current = onReady;
  modeRef.current = mode;

  const resolvedImageUploader = imageUploader || fileUploader;
  const resolvedExtraExtensions = useMemo(() => extraExtensions ?? [], [extraExtensions]);

  useEffect(() => {
    setCurrentOutlineMode(outlineMode);
  }, [outlineMode]);

  const handleOutlineModeChange = (nextMode: OutlineMode) => {
    setCurrentOutlineMode(nextMode);
    onOutlineModeChange?.(nextMode);
  };

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable,
      content: normalizeContent(value, mode),
      extensions: [
        StarterKit.configure({
          image: false,
          table: false,
          dropcursor: {
            color: 'var(--atiptap-color-primary)',
            width: 2
          }
        }),
        NotionImage.configure({
          allowBase64: true
        }),
        ImageUploadNode,
        FileNode,
        FileUploadNode,
        NotionTableKit,
        TableHandleExtension,
        TableCellAttrs,
        NodeRange,
        BlockShortcuts,
        TrailingNode.configure({
          node: 'paragraph',
          notAfter: ['paragraph']
        }),
        FindAndReplace.configure({
          injectCSS: false,
          searchDebounceMs: 150
        }),
        ...createMediaUploadExtensions({
          imageUploader: resolvedImageUploader,
          fileUploader
        }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (MEDIA_PLACEHOLDER_NODES.has(node.type.name)) {
              return '';
            }
            return placeholder;
          },
          emptyNodeClass: ({ node }) => {
            if (MEDIA_PLACEHOLDER_NODES.has(node.type.name)) {
              return '';
            }
            return 'is-empty with-slash';
          },
          showOnlyCurrent: true
        }),
        ...resolvedExtraExtensions
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
    },
    [resolvedExtraExtensions]
  );
  useLayoutEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    editor.storage.imageUploader.upload = imageUploader || fileUploader;
    editor.storage.imageUploader.requestUrlInsert = () => setImageUrlOpen(true);
    editor.storage.fileUploader.upload = fileUploader;
  }, [editor, imageUploader, fileUploader]);

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
    setEditorMeta(editor, 'hideDragHandle', true);
  }, [editor, value, mode]);

  const themeVars = useMemo(
    () => mergeNotionThemeVars(cssVars as React.CSSProperties | undefined, style),
    [cssVars, style]
  );
  const rootStyle = useMemo(
    () => (cssVars ? { ...(cssVars as React.CSSProperties), ...style } : style),
    [cssVars, style]
  );
  const rootClassName = classNames(
    'atiptap-notion',
    NOTION_THEME_CLASS,
    {
      'atiptap-notion--bordered': bordered,
      'atiptap-notion--toolbar': showToolbar && editable,
      'atiptap-notion--outline': showOutline,
      'atiptap-notion--outline-float': showOutline && currentOutlineMode === 'float',
      'atiptap-notion--outline-fixed': showOutline && currentOutlineMode === 'fixed'
    },
    className
  );

  if (!editor) {
    return (
      <div className={classNames(rootClassName, 'atiptap-notion-loading')} style={rootStyle}>
        编辑器加载中...
      </div>
    );
  }

  return (
    <NotionThemeProvider value={themeVars}>
      <FileNodeProvider
        fileUploader={fileUploader}
        fileRenderers={fileRenderers}
        onFileClick={onFileClick}
      >
        <div className={rootClassName} style={rootStyle}>
          {showToolbar && editable ? <NotionToolbar editor={editor} extra={toolbarExtra} /> : null}
          <div className="atiptap-notion-body">
            {showOutline ? (
              <DocumentOutline
                editor={editor}
                mode={currentOutlineMode}
                onModeChange={handleOutlineModeChange}
              />
            ) : null}
            <div className="atiptap-notion-main">
              {editable ? (
                <>
                  <BlockDragHandle
                    editor={editor}
                    getBlockIcon={getBlockIcon}
                    blockMenuExtra={blockMenuExtra}
                  />
                  <FloatingToolbar editor={editor} />
                  <TableHandle editor={editor} />
                  <TableExtendButtons editor={editor} />
                  <TableSelectionOverlay editor={editor} cellMenu={TableCellMenu} />
                  <NotionSlashMenu editor={editor} slashItems={slashItems} />
                </>
              ) : null}
              {typeof children === 'function' ? children(editor) : children}
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
                        void insertImageFiles(editor, [file], resolvedImageUploader);
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
          </div>
        </div>
      </FileNodeProvider>
    </NotionThemeProvider>
  );
};

export default NotionLikeEditor;
