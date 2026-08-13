import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ATailBar } from '../../extensions/ATailBar';
import { ATitleBar } from '../../extensions/ATitleBar';
import { AWenHaoBar } from '../../extensions/AWenHaoBar';
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
}> = ({ editor, disabledMenu = false, menuClassName, menuStyle, onFullscreenChange }) => {
  const { fullscreen, editable } = useEditorContext();
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
      AWenHao,
      ATail,
      ATitle,
      bulletList,
      orderedList,
      taskList,
      image,
      table,
      codeBlock,
      blockquote,
      horizontalRule
    } = editor.state.schema.nodes;
    const { bold, italic, strike, link, code, underline, highlight } = editor.state.schema.marks;
    const canAlign = editor.can().setTextAlign?.('left');
    return [
      [
        editor.menuEnableUndoRedo && (
          <TextButton key="undo" onClick={() => editor.chain().focus().undo().run()}>
            撤销
          </TextButton>
        ),
        editor.menuEnableUndoRedo && (
          <TextButton key="redo" onClick={() => editor.chain().focus().redo().run()}>
            重做
          </TextButton>
        )
      ],
      [
        bold && (
          <TextButton
            key="bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            加粗
          </TextButton>
        ),
        italic && (
          <TextButton
            key="italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            斜体
          </TextButton>
        ),
        strike && (
          <TextButton
            key="strike"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
          >
            删除线
          </TextButton>
        ),
        underline && (
          <TextButton
            key="underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
          >
            下划线
          </TextButton>
        ),
        highlight && (
          <span key="highlight" className="atiptap-notion-highlight atiptap-menu-highlight">
            <TextButton
              onClick={() => setHighlightOpen(open => !open)}
              isActive={editor.isActive('highlight') || highlightOpen}
            >
              高亮
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
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
          >
            行内代码
          </TextButton>
        ),
        canAlign && (
          <TextButton
            key="alignLeft"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
          >
            左对齐
          </TextButton>
        ),
        canAlign && (
          <TextButton
            key="alignCenter"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
          >
            居中
          </TextButton>
        ),
        canAlign && (
          <TextButton
            key="alignRight"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
          >
            右对齐
          </TextButton>
        )
      ],
      [
        ATitle && <ATitleBar key="ATitle" editor={editor} />,
        ATail && (
          <ATailBar
            key="ATail"
            onClick={() => editor.chain().focus().toggleATail().run()}
            isActive={editor.isActive('ATail')}
            disabled={!editor.can().toggleATail?.() || false}
          />
        ),
        AWenHao && (
          <AWenHaoBar
            key="AWenHao"
            onClick={() => editor.chain().focus().toggleWenHao().run()}
            isActive={editor.isActive('AWenHao')}
            disabled={!editor.can().toggleWenHao?.() || false}
          />
        )
      ],
      [
        bulletList && (
          <TextButton
            key="bulletList"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          >
            无序列表
          </TextButton>
        ),
        orderedList && (
          <TextButton
            key="orderedList"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
          >
            有序列表
          </TextButton>
        ),
        taskList && (
          <TextButton
            key="taskList"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
          >
            任务列表
          </TextButton>
        )
      ],
      [
        link && <LinkPopover key="link" editor={editor} compact={false} />,
        image && (
          <TextButton
            key="image"
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
            图片
          </TextButton>
        ),
        table && (
          <TextButton
            key="table"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            表格
          </TextButton>
        ),
        codeBlock && (
          <TextButton
            key="codeBlock"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            代码块
          </TextButton>
        )
      ],
      [
        blockquote && (
          <TextButton
            key="blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            引用
          </TextButton>
        ),
        horizontalRule && (
          <TextButton
            key="horizontalRule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            分割线
          </TextButton>
        )
      ],
      [
        editor.menuEnableFullscreen && (
          <TextButton
            key="fullscreen"
            onClick={() => {
              const newFullscreen = !fullscreen;
              editor.setFullscreen(newFullscreen);
              onFullscreenChange(newFullscreen);
            }}
          >
            {fullscreen ? '退出全屏' : '全屏'}
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
    editor?.menuEnableUndoRedo,
    editor?.menuEnableFullscreen
  ]);

  const handleButtonClick = (event: {
    stopPropagation: () => void;
    preventDefault: () => void;
  }) => {
    // 阻止事件冒泡，这将防止触发默认的表单提交事件
    event.stopPropagation();
    event.preventDefault();
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
