import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  ChevronDown,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Type,
  Underline,
  Undo2
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { LinkPopover } from '../ui/LinkPopover';
import { insertImageUploadNode } from './image';

const HIGHLIGHT_COLORS = [
  { label: '黄', value: '#fff1b8' },
  { label: '绿', value: '#d9f7be' },
  { label: '蓝', value: '#bae0ff' },
  { label: '红', value: '#ffccc7' },
  { label: '紫', value: '#efdbff' }
];

const ToolbarButton: React.FC<{
  title: string;
  active?: boolean;
  disabled?: boolean;
  wide?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ title, active, disabled, wide, onClick, children }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    className={`atiptap-notion-toolbar__btn${wide ? ' atiptap-notion-toolbar__btn--wide' : ''}`}
    data-active={active ? 'true' : 'false'}
    onMouseDown={event => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <span className="atiptap-notion-toolbar__divider" />;

type ToolbarMenu = 'heading' | 'list' | 'highlight' | null;

type DropdownItem = {
  key: string;
  title: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
};

const ToolbarDropdown: React.FC<{
  title: string;
  active?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  items: DropdownItem[];
}> = ({ title, active, open, onOpenChange, icon, items }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node)) {
        return;
      }
      onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, onOpenChange]);

  return (
    <div className="atiptap-notion-toolbar-dropdown" ref={panelRef}>
      <ToolbarButton title={title} active={active || open} wide onClick={() => onOpenChange(!open)}>
        {icon}
        <ChevronDown size={12} />
      </ToolbarButton>
      {open ? (
        <div className="atiptap-notion-toolbar-dropdown__panel" role="menu" aria-label={title}>
          {items.map(item => (
            <button
              key={item.key}
              type="button"
              className="atiptap-notion-drag-menu__item"
              data-active={item.active ? 'true' : 'false'}
              onMouseDown={event => event.preventDefault()}
              onClick={() => {
                item.onClick();
                onOpenChange(false);
              }}
            >
              <span className="atiptap-notion-toolbar-dropdown__icon">{item.icon}</span>
              {item.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** 头部快捷操作区，能力对齐 Tiptap Simple Editor，视觉走 antd token */
export const NotionToolbar: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
  const marks = useEditorState({
    editor,
    selector: ctx => {
      if (!ctx.editor) {
        return null;
      }
      const headingLevel = ctx.editor.isActive('heading', { level: 1 })
        ? 1
        : ctx.editor.isActive('heading', { level: 2 })
          ? 2
          : ctx.editor.isActive('heading', { level: 3 })
            ? 3
            : 0;
      return {
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
        headingLevel,
        bulletList: ctx.editor.isActive('bulletList'),
        orderedList: ctx.editor.isActive('orderedList'),
        taskList: ctx.editor.isActive('taskList'),
        blockquote: ctx.editor.isActive('blockquote'),
        codeBlock: ctx.editor.isActive('codeBlock'),
        bold: ctx.editor.isActive('bold'),
        italic: ctx.editor.isActive('italic'),
        underline: ctx.editor.isActive('underline'),
        strike: ctx.editor.isActive('strike'),
        code: ctx.editor.isActive('code'),
        highlight: ctx.editor.isActive('highlight'),
        alignLeft: ctx.editor.isActive({ textAlign: 'left' }),
        alignCenter: ctx.editor.isActive({ textAlign: 'center' }),
        alignRight: ctx.editor.isActive({ textAlign: 'right' }),
        alignJustify: ctx.editor.isActive({ textAlign: 'justify' }),
        canAlign: ctx.editor.can().setTextAlign?.('left')
      };
    }
  });

  if (!editor.isEditable || !marks) {
    return null;
  }

  const HeadingIcon =
    marks.headingLevel === 1 ? Heading1 : marks.headingLevel === 3 ? Heading3 : Heading2;

  return (
    <div className="atiptap-notion-toolbar" role="toolbar" aria-label="编辑器快捷操作">
      <div className="atiptap-notion-toolbar__group">
        <ToolbarButton
          title="撤销"
          disabled={!marks.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="重做"
          disabled={!marks.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={16} />
        </ToolbarButton>
      </div>
      <ToolbarDivider />
      <div className="atiptap-notion-toolbar__group">
        <ToolbarDropdown
          title="标题"
          active={marks.headingLevel > 0}
          open={openMenu === 'heading'}
          onOpenChange={open => setOpenMenu(open ? 'heading' : null)}
          icon={<HeadingIcon size={16} />}
          items={[
            {
              key: 'paragraph',
              title: '正文',
              icon: <Type size={16} />,
              active: marks.headingLevel === 0 && !marks.bulletList && !marks.orderedList,
              onClick: () => editor.chain().focus().setParagraph().run()
            },
            {
              key: 'h1',
              title: '标题 1',
              icon: <Heading1 size={16} />,
              active: marks.headingLevel === 1,
              onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run()
            },
            {
              key: 'h2',
              title: '标题 2',
              icon: <Heading2 size={16} />,
              active: marks.headingLevel === 2,
              onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
            },
            {
              key: 'h3',
              title: '标题 3',
              icon: <Heading3 size={16} />,
              active: marks.headingLevel === 3,
              onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          ]}
        />
        <ToolbarDropdown
          title="列表"
          active={marks.bulletList || marks.orderedList || marks.taskList}
          open={openMenu === 'list'}
          onOpenChange={open => setOpenMenu(open ? 'list' : null)}
          icon={
            marks.orderedList ? (
              <ListOrdered size={16} />
            ) : marks.taskList ? (
              <CheckSquare size={16} />
            ) : (
              <List size={16} />
            )
          }
          items={[
            {
              key: 'bullet',
              title: '无序列表',
              icon: <List size={16} />,
              active: marks.bulletList,
              onClick: () => editor.chain().focus().toggleBulletList().run()
            },
            {
              key: 'ordered',
              title: '有序列表',
              icon: <ListOrdered size={16} />,
              active: marks.orderedList,
              onClick: () => editor.chain().focus().toggleOrderedList().run()
            },
            {
              key: 'task',
              title: '任务列表',
              icon: <CheckSquare size={16} />,
              active: marks.taskList,
              onClick: () => editor.chain().focus().toggleTaskList().run()
            }
          ]}
        />
        <ToolbarButton
          title="引用"
          active={marks.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="代码块"
          active={marks.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 size={16} />
        </ToolbarButton>
      </div>
      <ToolbarDivider />
      <div className="atiptap-notion-toolbar__group">
        <ToolbarButton
          title="加粗"
          active={marks.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="斜体"
          active={marks.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="下划线"
          active={marks.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="删除线"
          active={marks.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="行内代码"
          active={marks.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={16} />
        </ToolbarButton>
        <div className="atiptap-notion-highlight">
          <ToolbarButton
            title="高亮"
            active={marks.highlight || openMenu === 'highlight'}
            onClick={() => setOpenMenu(openMenu === 'highlight' ? null : 'highlight')}
          >
            <Highlighter size={16} />
          </ToolbarButton>
          {openMenu === 'highlight' ? (
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
                    setOpenMenu(null);
                  }}
                />
              ))}
              <button
                type="button"
                className="atiptap-notion-highlight__clear"
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setOpenMenu(null);
                }}
              >
                清除
              </button>
            </div>
          ) : null}
        </div>
        <LinkPopover editor={editor} />
      </div>
      {marks.canAlign ? (
        <>
          <ToolbarDivider />
          <div className="atiptap-notion-toolbar__group">
            <ToolbarButton
              title="左对齐"
              active={marks.alignLeft}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="居中"
              active={marks.alignCenter}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="右对齐"
              active={marks.alignRight}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight size={16} />
            </ToolbarButton>
            <ToolbarButton
              title="两端对齐"
              active={marks.alignJustify}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            >
              <AlignJustify size={16} />
            </ToolbarButton>
          </div>
        </>
      ) : null}
      <ToolbarDivider />
      <div className="atiptap-notion-toolbar__group">
        <ToolbarButton title="图片" onClick={() => insertImageUploadNode(editor)}>
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="表格"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table size={16} />
        </ToolbarButton>
      </div>
    </div>
  );
};
