import React from 'react';
import {
  NotionLikeEditor,
  type NotionContentMode,
  type NotionLikeEditorProps
} from './notion-like';

export type { NotionContentMode };
export type IANotionProps = NotionLikeEditorProps;

/** Notion 风格块编辑器。默认带边框和头部快捷操作区，可用 showToolbar / bordered 关闭 */
const ANotion: React.FC<IANotionProps> = props => {
  return <NotionLikeEditor {...props} />;
};

export default ANotion;
