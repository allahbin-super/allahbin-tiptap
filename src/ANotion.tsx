import React from 'react';
import {
  NotionLikeEditor,
  type NotionContentMode,
  type NotionLikeEditorProps
} from './notion-like';

export type { NotionContentMode };
export type IANotionProps = NotionLikeEditorProps;

/** Notion 风格块编辑器。默认可编辑时带边框和头部操作区，只读模式不显示操作区 */
const ANotion: React.FC<IANotionProps> = props => {
  return <NotionLikeEditor {...props} />;
};

export default ANotion;
