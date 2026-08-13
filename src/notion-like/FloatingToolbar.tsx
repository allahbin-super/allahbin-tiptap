import { NodeSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Captions,
  Code,
  Download,
  Highlighter,
  ImagePlus,
  Italic,
  Strikethrough,
  Trash2,
  Underline
} from 'lucide-react';
import React, { useState } from 'react';
import { LinkPopover } from '../ui/LinkPopover';
import {
  deleteSelectedImage,
  downloadSelectedImage,
  isImageSelected,
  replaceSelectedImage,
  setImageAlign,
  showImageCaption,
  type ImageAlign
} from './image';

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
  onClick: () => void;
  children: React.ReactNode;
}> = ({ title, active, onClick, children }) => (
  <button
    type="button"
    title={title}
    className="atiptap-notion-bubble__btn"
    data-active={active ? 'true' : 'false'}
    onMouseDown={event => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <span className="atiptap-notion-bubble__divider" />;

const isDragMenuOpen = () => Boolean(document.querySelector('.atiptap-notion-drag-menu'));

/** 划词后出现的浮动格式栏；选中图片时切换为图片操作栏 */
export const FloatingToolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const [highlightOpen, setHighlightOpen] = useState(false);
  const marks = useEditorState({
    editor,
    selector: ctx => {
      if (!ctx.editor) {
        return null;
      }
      const { selection } = ctx.editor.state;
      const imageNode =
        selection instanceof NodeSelection && selection.node.type.name === 'image'
          ? selection.node
          : null;
      return {
        bold: ctx.editor.isActive('bold'),
        italic: ctx.editor.isActive('italic'),
        underline: ctx.editor.isActive('underline'),
        strike: ctx.editor.isActive('strike'),
        code: ctx.editor.isActive('code'),
        highlight: ctx.editor.isActive('highlight'),
        alignLeft: ctx.editor.isActive({ textAlign: 'left' }),
        alignCenter: ctx.editor.isActive({ textAlign: 'center' }),
        alignRight: ctx.editor.isActive({ textAlign: 'right' }),
        imageAlign: (imageNode?.attrs['data-align'] as ImageAlign | null) || 'center',
        imageCaption: Boolean(imageNode?.attrs.showCaption)
      };
    }
  });

  if (!editor || !marks) {
    return null;
  }

  return (
    <>
      <BubbleMenu
        editor={editor}
        className="atiptap-notion-bubble"
        options={{ placement: 'top', offset: 8 }}
        shouldShow={({
          editor: currentEditor,
          state
        }: {
          editor: Editor;
          state: Editor['state'];
        }) => {
          const { selection } = state;
          if (selection instanceof NodeSelection) {
            return false;
          }
          if (isDragMenuOpen()) {
            return false;
          }
          return (
            currentEditor.isEditable && !selection.empty && !currentEditor.isActive('codeBlock')
          );
        }}
      >
        <ToolbarButton
          title="加粗"
          active={marks.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="斜体"
          active={marks.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="下划线"
          active={marks.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="删除线"
          active={marks.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="行内代码"
          active={marks.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={15} />
        </ToolbarButton>
        <div className="atiptap-notion-highlight">
          <ToolbarButton
            title="高亮"
            active={marks.highlight || highlightOpen}
            onClick={() => setHighlightOpen(open => !open)}
          >
            <Highlighter size={15} />
          </ToolbarButton>
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
        </div>
        <LinkPopover editor={editor} />
        <ToolbarDivider />
        <ToolbarButton
          title="左对齐"
          active={marks.alignLeft}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="居中"
          active={marks.alignCenter}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="右对齐"
          active={marks.alignRight}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight size={15} />
        </ToolbarButton>
      </BubbleMenu>
      <BubbleMenu
        editor={editor}
        className="atiptap-notion-bubble"
        options={{ placement: 'top', offset: 8 }}
        shouldShow={({
          editor: currentEditor,
          state
        }: {
          editor: Editor;
          state: Editor['state'];
        }) => {
          if (!(state.selection instanceof NodeSelection)) {
            return false;
          }
          if (isDragMenuOpen()) {
            return false;
          }
          return currentEditor.isEditable && isImageSelected(currentEditor);
        }}
      >
        <ToolbarButton
          title="左对齐"
          active={marks.imageAlign === 'left'}
          onClick={() => setImageAlign(editor, 'left')}
        >
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="居中"
          active={marks.imageAlign === 'center'}
          onClick={() => setImageAlign(editor, 'center')}
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="右对齐"
          active={marks.imageAlign === 'right'}
          onClick={() => setImageAlign(editor, 'right')}
        >
          <AlignRight size={15} />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          title="图注"
          active={marks.imageCaption}
          onClick={() => showImageCaption(editor)}
        >
          <Captions size={15} />
        </ToolbarButton>
        <ToolbarButton title="替换" onClick={() => replaceSelectedImage(editor)}>
          <ImagePlus size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="下载"
          onClick={() => {
            void downloadSelectedImage(editor);
          }}
        >
          <Download size={15} />
        </ToolbarButton>
        <ToolbarButton title="删除" onClick={() => deleteSelectedImage(editor)}>
          <Trash2 size={15} />
        </ToolbarButton>
      </BubbleMenu>
    </>
  );
};
