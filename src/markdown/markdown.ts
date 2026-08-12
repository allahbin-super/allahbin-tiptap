import { Node } from '@tiptap/pm/model';
import { Markdown as TiptapMarkdown } from 'tiptap-markdown';
import { MarkdownClipboardCopy } from './clipboardCopy';
import { MarkdownClipboardPaste } from './clipboardPaste';
import { aHeadingHtmlToMd, aTailHtmlToMd, aWenHaoHtmlToMd } from './utils';

export type MarkdownOptions = {
  html?: boolean;
  tightLists?: boolean;
  tightListClass?: string;
  bulletListMarker?: string;
  linkify?: boolean;
  breaks?: boolean;
  paste?: boolean;
  copy?: boolean;
};

export const Markdown = TiptapMarkdown.extend<MarkdownOptions>({
  name: 'markdown',

  priority: 50,

  addOptions() {
    return {
      ...this.parent?.(),
      paste: true,
      copy: true
    };
  },

  onBeforeCreate(event) {
    this.parent?.(event);
    (this.editor.storage as any).markdown.getMarkdown = (content?: Node) => {
      let mdStr = (this.editor.storage as any).markdown.serializer.serialize(
        content ?? this.editor.state.doc
      );
      mdStr = aHeadingHtmlToMd(mdStr);
      mdStr = aWenHaoHtmlToMd(mdStr);
      mdStr = aTailHtmlToMd(mdStr);
      return mdStr;
    };
  },

  addExtensions() {
    return [
      ...(this.options.copy ? [MarkdownClipboardCopy] : []),
      ...(this.options.paste ? [MarkdownClipboardPaste] : [])
    ];
  },
  onCreate(event) {
    this.parent?.(event);
  }
});
