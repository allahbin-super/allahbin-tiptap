import React from 'react';
import { NotionLikeEditor, type NotionLikeEditorProps } from './notion-like';

export type { NotionContentMode, NotionCssVars, OutlineMode } from './notion-like';
export type IANotionProps = NotionLikeEditorProps;

/** Notion 风格块编辑器。默认可编辑时带边框、头部操作区和目录（悬浮/固定） */
const ANotion: React.FC<IANotionProps> = props => {
  return <NotionLikeEditor {...props} />;
};

export default ANotion;
