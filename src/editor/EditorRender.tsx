import React from 'react';
import type { UploaderFunc } from '../image-upload';
import type { FileNodeInfo, FileRenderers } from '../notion-like';
import { FileNodeProvider, MediaBlockChrome } from '../notion-like';
import type { ATiptapEditor } from './ATiptapEditor';
import { EditorContent, EditorLayout, EditorMenu } from './components';

export type EditorRenderProps = {
  editor: ATiptapEditor | null;
  className?: string;
  style?: React.CSSProperties;
  menuClassName?: string;
  menuStyle?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  onFullscreenChange?: (v: boolean) => void;
  /** 公文模式才在段落下拉中展示落款 / 文号 */
  showGovBlocks?: boolean;
  fileUploader?: UploaderFunc;
  fileRenderers?: FileRenderers;
  onFileClick?: (info: FileNodeInfo, event: React.MouseEvent) => void;
};

export const EditorRender: React.FC<EditorRenderProps> = ({
  editor,
  className,
  style,
  menuClassName,
  menuStyle,
  contentClassName,
  contentStyle,
  onFullscreenChange,
  showGovBlocks = false,
  fileUploader,
  fileRenderers,
  onFileClick
}) => {
  if (!editor) {
    return null;
  }

  return (
    <FileNodeProvider
      fileUploader={fileUploader}
      fileRenderers={fileRenderers}
      onFileClick={onFileClick}
    >
      <EditorLayout editor={editor} style={style} className={className}>
        <EditorMenu
          editor={editor}
          menuStyle={menuStyle}
          menuClassName={menuClassName}
          showGovBlocks={showGovBlocks}
          onFullscreenChange={v => onFullscreenChange?.(v)}
        />
        <MediaBlockChrome editor={editor} />
        <EditorContent
          editor={editor}
          contentStyle={contentStyle}
          contentClassName={contentClassName}
        />
      </EditorLayout>
    </FileNodeProvider>
  );
};

EditorRender.displayName = 'EditorRender';
