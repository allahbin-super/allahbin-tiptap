import React from 'react';
import {
  NotionLikeEditor,
  type NotionContentMode,
  type NotionLikeEditorProps
} from './notion-like';

export type { NotionContentMode };
export type IANotionProps = NotionLikeEditorProps;

/** Notion 风格块编辑器，和公文编辑器 ATiptap 分开使用 */
const ANotion: React.FC<IANotionProps> = props => {
  return <NotionLikeEditor {...props} />;
};

export default ANotion;
