import { EditorContent as TEditorContent } from '@tiptap/react';
import classNames from 'classnames';
import React from 'react';
import type { TideEditor } from '../TideEditor';

export type EditorContentProps = {
  editor: TideEditor | null;
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
  const cls = classNames('tide-content', contentClassName);

  if (editor && editor.isEmpty && editor.isReadOnly) {
    return (
      <div className={cls} style={contentStyle}>
        {editor.readOnlyEmptyView || null}
      </div>
    );
  }

  return (
    <TEditorContent className={cls} style={contentStyle} editor={editor}>
      {children}
    </TEditorContent>
  );
};

EditorContent.displayName = 'EditorContent';
