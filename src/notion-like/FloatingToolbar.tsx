import { NodeSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Code, Italic, Link as LinkIcon, Strikethrough } from 'lucide-react';
import React, { useCallback } from 'react';

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
    onClick={onClick}
  >
    {children}
  </button>
);

/** 划词后出现的浮动格式栏 */
export const FloatingToolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const marks = useEditorState({
    editor,
    selector: ctx =>
      ctx.editor
        ? {
            bold: ctx.editor.isActive('bold'),
            italic: ctx.editor.isActive('italic'),
            strike: ctx.editor.isActive('strike'),
            code: ctx.editor.isActive('code'),
            link: ctx.editor.isActive('link')
          }
        : null
  });

  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('请输入链接地址', previousUrl || 'https://');
    if (href === null) {
      return;
    }
    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  }, [editor]);

  if (!editor || !marks) {
    return null;
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top', offset: 8 }}
      shouldShow={({ editor: currentEditor, state }) => {
        const { empty, selection } = state;
        if (selection instanceof NodeSelection) {
          return false;
        }
        if (document.querySelector('.atiptap-notion-drag-menu')) {
          return false;
        }
        return currentEditor.isEditable && !empty && !currentEditor.isActive('codeBlock');
      }}
    >
      <div className="atiptap-notion-bubble">
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
        <ToolbarButton title="链接" active={marks.link} onClick={setLink}>
          <LinkIcon size={15} />
        </ToolbarButton>
      </div>
    </BubbleMenu>
  );
};
