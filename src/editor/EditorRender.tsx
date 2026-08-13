import React from 'react';
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
};

export const EditorRender: React.FC<EditorRenderProps> = ({
  editor,
  className,
  style,
  menuClassName,
  menuStyle,
  contentClassName,
  contentStyle,
  onFullscreenChange
}) => {
  if (!editor) {
    return null;
  }

  return (
    <EditorLayout editor={editor} style={style} className={className}>
      <EditorMenu
        editor={editor}
        menuStyle={menuStyle}
        menuClassName={menuClassName}
        onFullscreenChange={v => onFullscreenChange?.(v)}
      />
      <EditorContent
        editor={editor}
        contentStyle={contentStyle}
        contentClassName={contentClassName}
      />
    </EditorLayout>
  );
};

EditorRender.displayName = 'EditorRender';
