import type { Editor } from '@tiptap/react';
import React from 'react';
import { NotionLikeEditor, type NotionLikeEditorProps } from './notion-like';

export type IANotionProps = NotionLikeEditorProps;

/** Notion 风格块编辑器，和公文编辑器 ATiptap 分开使用 */
const ANotion: React.FC<IANotionProps> = ({ onChange, ...props }) => {
  const onValueChange = (markdown: string, editor: Editor) => {
    onChange?.(markdown, editor);
  };

  return <NotionLikeEditor {...props} onChange={onValueChange} />;
};

export default ANotion;
