export { mockFileUploader, mockImgUploader } from './ATiptapEdit';
export type { IATiptapContentMode, IATiptapProps } from './ATiptapEdit';

export { default as ANotion } from './ANotion';
export type { IANotionProps } from './ANotion';
export { NOTION_THEME_CLASS, getSlashMenuItems, useNotionThemeRootProps } from './notion-like';
export type {
  BlockIcon,
  BlockMenuExtraContext,
  FileKind,
  FileNodeInfo,
  FileNodeRenderProps,
  FileRenderers,
  FileUploadAcceptPreset,
  MentionItemsContext,
  MentionItemsResolver,
  MentionSuggestionItem,
  NotionContentMode,
  NotionCssVars,
  OutlineMode,
  SlashSuggestionItem
} from './notion-like';

export { ATiptapEditor } from './editor';
export type { ATiptapEditorOptions, IContent, IContent2, IMark, ITiptapJson } from './editor';

export { generateDirectoryTree, jsonToDom, paragraphTypes } from './utils/TiptapUtils';

export {
  default as TiptapRender,
  getUrlParams,
  type ILinkRender,
  type IRenderConfig
} from './utils/TiptapRender';
export { default as TiptapRenderFactory } from './utils/TiptapRenderFactory';

import ATiptap from './ATiptap';

export default ATiptap;
