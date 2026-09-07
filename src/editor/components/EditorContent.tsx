import { EditorContent as TEditorContent } from '@tiptap/react';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { ImagePreviewOverlay, getPreviewableImageSrc } from '../../image-preview';
import type { ATiptapEditor } from '../ATiptapEditor';

export type EditorContentProps = {
  editor: ATiptapEditor | null;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

export const EditorContent: React.FC<EditorContentProps> = ({
  editor,
  contentClassName,
  contentStyle,
  children
}) => {
  const cls = classNames('atiptap-content', contentClassName);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!editor || editor.isEditable) {
        return;
      }
      const src = getPreviewableImageSrc(event.target);
      if (!src) {
        return;
      }
      event.preventDefault();
      setPreviewSrc(src);
    },
    [editor]
  );

  const preview = previewSrc ? (
    <ImagePreviewOverlay src={previewSrc} onClose={() => setPreviewSrc(null)} />
  ) : null;

  if (editor && editor.isEmpty && editor.isReadOnly) {
    return (
      <div className={cls} style={contentStyle}>
        {editor.readOnlyEmptyView || null}
      </div>
    );
  }

  return (
    <>
      <TEditorContent
        className={cls}
        style={contentStyle}
        editor={editor}
        onClickCapture={handleClick}
      >
        {children}
      </TEditorContent>
      {preview}
    </>
  );
};

EditorContent.displayName = 'EditorContent';
