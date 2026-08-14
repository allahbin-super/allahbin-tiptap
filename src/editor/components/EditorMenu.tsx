import classNames from 'classnames';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Code,
  Code2,
  Highlighter,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ATitleBar } from '../../extensions/ATitleBar';
import TextButton from '../../extensions/TextButton';
import { insertImageFiles, pickLocalImage } from '../../image-upload';
import { MenuBar } from '../../menubar';
import '../../notion-like/notion-like.css';
import { LinkPopover } from '../../ui/LinkPopover';
import type { ATiptapEditor } from '../ATiptapEditor';
import { useEditorContext } from '../context/EditorContext';

const HIGHLIGHT_COLORS = [
  { label: '黄', value: '#fff1b8' },
  { label: '绿', value: '#d9f7be' },
  { label: '蓝', value: '#bae0ff' },
  { label: '红', value: '#ffccc7' },
  { label: '紫', value: '#efdbff' }
];

export const EditorMenu: React.FC<{
  editor: ATiptapEditor | null;
  disabledMenu?: boolean;
  menuClassName?: string;
  onFullscreenChange: (v: boolean) => void;
  menuStyle?: React.CSSProperties;
  showGovBlocks?: boolean;
}> = ({
  editor,
  disabledMenu = false,
  menuClassName,
  menuStyle,
  onFullscreenChange,
  showGovBlocks = false
}) => {
  const { fullscreen, editable, editorStateVersion } = useEditorContext();
  const [resourceInput, setResourceInput] = useState<{
    type: 'image';
    value: string;
  } | null>(null);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const resourceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    resourceInputRef.current?.focus();
  }, [resourceInput]);

  const applyResource = () => {
    if (!editor || !resourceInput?.value.trim()) {
      return;
    }

    editor.chain().focus().setImage({ src: resourceInput.value.trim() }).run();
    setResourceInput(null);
  };

  const menuItems = useMemo(() => {
    if (!editor) {
      return null;
    }
    const {
      ATitle,
      heading,
      bulletList,
      orderedList,
      taskList,
      image,
      table,
      codeBlock,
      blockquote,
      horizontalRule
    } = editor.state.schema.nodes;
    const showParagraphStyles = !!(ATitle || heading || showGovBlocks);
    const { bold, italic, strike, link, code, underline, highlight } = editor.state.schema.marks;
    const canAlign = editor.can().setTextAlign?.('left');
    return [
      [
        editor.menuEnableUndoRedo && (
          <TextButton
            key="undo"
            title="撤销"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={16} />
          </TextButton>
        ),
        editor.menuEnableUndoRedo && (
          <TextButton
            key="redo"
            title="重做"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={16} />
          </TextButton>
        )
      ],
      [
        bold && (
          <TextButton
            key="bold"
            title="加粗"
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            <Bold size={16} />
          </TextButton>
        ),
        italic && (
          <TextButton
            key="italic"
            title="斜体"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            <Italic size={16} />
          </TextButton>
        ),
        strike && (
          <TextButton
            key="strike"
            title="删除线"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
          >
            <Strikethrough size={16} />
          </TextButton>
        ),
        underline && (
          <TextButton
            key="underline"
            title="下划线"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
          >
            <Underline size={16} />
          </TextButton>
        ),
        highlight && (
          <span key="highlight" className="atiptap-notion-highlight atiptap-menu-highlight">
            <TextButton
              title="高亮"
              onClick={() => setHighlightOpen(open => !open)}
              isActive={editor.isActive('highlight') || highlightOpen}
            >
              <Highlighter size={16} />
            </TextButton>
            {highlightOpen ? (
              <div className="atiptap-notion-highlight__panel">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.label}
                    className="atiptap-notion-highlight__swatch"
                    style={{ background: color.value }}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color: color.value }).run();
                      setHighlightOpen(false);
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="atiptap-notion-highlight__clear"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setHighlightOpen(false);
                  }}
                >
                  清除
                </button>
              </div>
            ) : null}
          </span>
        ),
        code && (
          <TextButton
            key="code"
            title="行内代码"
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
          >
            <Code size={16} />
          </TextButton>
        ),
        canAlign && (
          <TextButton
            key="alignLeft"
            title="左对齐"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeft size={16} />
          </TextButton>
        ),
        canAlign && (
          <TextButton
            key="alignCenter"
            title="居中"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenter size={16} />
          </TextButton>
        ),
        canAlign && (
          <TextButton
            key="alignRight"
            title="右对齐"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRight size={16} />
          </TextButton>
        )
      ],
      [
        showParagraphStyles && (
          <ATitleBar key="ATitle" editor={editor} showGovBlocks={showGovBlocks} />
        )
      ],
      [
        bulletList && (
          <TextButton
            key="bulletList"
            title="无序列表"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          >
            <List size={16} />
          </TextButton>
        ),
        orderedList && (
          <TextButton
            key="orderedList"
            title="有序列表"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
          >
            <ListOrdered size={16} />
          </TextButton>
        ),
        taskList && (
          <TextButton
            key="taskList"
            title="任务列表"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
          >
            <CheckSquare size={16} />
          </TextButton>
        )
      ],
      [
        link && <LinkPopover key="link" editor={editor} compact />,
        image && (
          <TextButton
            key="image"
            title="图片"
            onClick={() => {
              const upload = editor.storage.imageUploader?.upload;
              if (upload) {
                pickLocalImage(file => {
                  void insertImageFiles(editor, [file], upload);
                });
                return;
              }
              setResourceInput({ type: 'image', value: '' });
            }}
          >
            <ImageIcon size={16} />
          </TextButton>
        ),
        table && (
          <TextButton
            key="table"
            title="表格"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <Table size={16} />
          </TextButton>
        ),
        codeBlock && (
          <TextButton
            key="codeBlock"
            title="代码块"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 size={16} />
          </TextButton>
        )
      ],
      [
        blockquote && (
          <TextButton
            key="blockquote"
            title="引用"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={16} />
          </TextButton>
        ),
        horizontalRule && (
          <TextButton
            key="horizontalRule"
            title="分割线"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={16} />
          </TextButton>
        )
      ],
      [
        editor.menuEnableFullscreen && (
          <TextButton
            key="fullscreen"
            title={fullscreen ? '退出全屏' : '全屏'}
            onClick={() => {
              const newFullscreen = !fullscreen;
              editor.setFullscreen(newFullscreen);
              onFullscreenChange(newFullscreen);
            }}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </TextButton>
        )
      ]
    ]
      .map(group => group.filter(Boolean))
      .filter(group => group.length > 0)
      .map((group, index, items) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={index}>
          {group}
          {index < items.length - 1 && <span className="atiptap-menu-bar-divider" />}
        </React.Fragment>
      ));
  }, [
    editor,
    editable,
    fullscreen,
    highlightOpen,
    showGovBlocks,
    editorStateVersion,
    editor?.menuEnableUndoRedo,
    editor?.menuEnableFullscreen
  ]);

  const handleButtonClick = (event: React.MouseEvent) => {
    // 阻止冒泡，避免触发外层表单提交；不要 preventDefault，否则会干扰下拉菜单点击
    event.stopPropagation();
  };

  if (!editable && !editor?.readOnlyShowMenu) {
    return null;
  }

  return (
    <div onClick={handleButtonClick}>
      <MenuBar
        className={classNames(menuClassName, {
          disabled: editor?.readOnlyShowMenu || disabledMenu
        })}
        style={menuStyle}
      >
        {menuItems}
      </MenuBar>
      {resourceInput && (
        <div className="atiptap-menu-resource-input" role="dialog" aria-label="资源地址输入">
          <label>
            图片地址
            <input
              ref={resourceInputRef}
              type="url"
              value={resourceInput.value}
              placeholder="https://"
              onChange={event =>
                setResourceInput(current =>
                  current ? { ...current, value: event.target.value } : current
                )
              }
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyResource();
                }
                if (event.key === 'Escape') {
                  setResourceInput(null);
                }
              }}
            />
          </label>
          <button type="button" onClick={applyResource}>
            确定
          </button>
          <button type="button" onClick={() => setResourceInput(null)}>
            取消
          </button>
        </div>
      )}
    </div>
  );
};
