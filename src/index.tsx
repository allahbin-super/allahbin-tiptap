export { mockFileUploader, mockImgUploader } from './ATiptapEdit';
export type { IATiptapProps } from './ATiptapEdit';

export { default as ANotion } from './ANotion';
export type { IANotionProps } from './ANotion';
export type {
  BlockIcon,
  BlockMenuExtraContext,
  FileKind,
  FileNodeInfo,
  FileNodeRenderProps,
  FileRenderers,
  FileUploadAcceptPreset,
  NotionContentMode,
  OutlineMode,
  SlashSuggestionItem
} from './notion-like';
export { getSlashMenuItems } from './notion-like';

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

