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
  /** 公文模式才在段落下拉中展示落款 / 文号 */
  showGovBlocks?: boolean;
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
  showGovBlocks = false
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
        showGovBlocks={showGovBlocks}
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
