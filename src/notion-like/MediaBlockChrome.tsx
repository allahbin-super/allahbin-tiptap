import { NodeSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Captions,
  Download,
  ImagePlus,
  Trash2
} from 'lucide-react';
import React from 'react';
import {
  deleteSelectedImage,
  downloadSelectedImage,
  isImageSelected,
  replaceSelectedImage,
  setImageAlign,
  showImageCaption,
  type ImageAlign
} from './image';
import { useNotionThemeClassName, useNotionThemeStyle } from './notion-theme';
import { TableCellMenu, TableExtendButtons, TableHandle, TableSelectionOverlay } from './table';

const isDragMenuOpen = () => Boolean(document.querySelector('.atiptap-notion-drag-menu'));

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

/** 选中图片时的对齐 / 图注 / 替换 / 下载 / 删除 */
export const ImageBubbleMenu: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const bubbleClassName = useNotionThemeClassName('atiptap-notion-bubble');
  const bubbleStyle = useNotionThemeStyle();
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
        imageAlign: (imageNode?.attrs['data-align'] as ImageAlign | null) || 'center',
        imageCaption: Boolean(imageNode?.attrs.showCaption)
      };
    }
  });

  if (!editor || !marks) {
    return null;
  }

  return (
    <BubbleMenu
      editor={editor}
      className={bubbleClassName}
      style={bubbleStyle}
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
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="居中"
        active={marks.imageAlign === 'center'}
        onClick={() => setImageAlign(editor, 'center')}
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="右对齐"
        active={marks.imageAlign === 'right'}
        onClick={() => setImageAlign(editor, 'right')}
      >
        <AlignRight size={16} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        title="图注"
        active={marks.imageCaption}
        onClick={() => showImageCaption(editor)}
      >
        <Captions size={16} />
      </ToolbarButton>
      <ToolbarButton title="替换" onClick={() => replaceSelectedImage(editor)}>
        <ImagePlus size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="下载"
        onClick={() => {
          void downloadSelectedImage(editor);
        }}
      >
        <Download size={16} />
      </ToolbarButton>
      <ToolbarButton title="删除" onClick={() => deleteSelectedImage(editor)}>
        <Trash2 size={16} />
      </ToolbarButton>
    </BubbleMenu>
  );
};

/** 表格手柄 / 加行列 / 单元格菜单 + 图片选中浮动栏，公文编辑器和 ANotion 共用 */
export const MediaBlockChrome: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor?.isEditable) {
    return null;
  }

  return (
    <>
      <TableHandle editor={editor} />
      <TableExtendButtons editor={editor} />
      <TableSelectionOverlay editor={editor} cellMenu={TableCellMenu} />
      <ImageBubbleMenu editor={editor} />
    </>
  );
};
