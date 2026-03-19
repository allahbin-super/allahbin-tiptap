import { elementFromString, Extension } from '@tiptap/core';
import { DOMParser, Slice } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { isInCode, isMarkdown, mdTailToHtml, mdTitleToHtml, mdWenhaoToHtml } from './utils';

export const MarkdownClipboardPaste = Extension.create({
  name: 'markdownClipboardPaste',

  priority: 50,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownClipboardPaste'),
        props: {
          handlePaste: (view, event) => {
            const editable = this.editor.isEditable;
            const { clipboardData } = event;
            if (!editable || !clipboardData || clipboardData.files.length !== 0) {
              return false;
            }

            const text = clipboardData.getData('text/plain');
            const html = clipboardData.getData('text/html');
            if (html.length > 0) {
              return false;
            }

            if (isInCode(view.state)) {
              event.preventDefault();
              view.dispatch(view.state.tr.insertText(text));
              return true;
            }

            if (isMarkdown(text)) {
              let newText = mdTailToHtml(text);
              newText = mdWenhaoToHtml(newText);
              newText = mdTitleToHtml(newText);
              const html = (this.editor.storage as any).markdown?.parser?.parse?.(newText, {
                inline: false
              });
              console.log('html', html);
              if (!html || typeof html !== 'string') return false;
              const parser = DOMParser.fromSchema(this.editor.schema);
              const htmlElement = elementFromString(html);
              const node = parser.parse(htmlElement, {});
              console.log('node', node);
              const slice = node.content;
              const contentSlice = view.state.selection.content();
              view.dispatch(
                view.state.tr.replaceSelection(
                  new Slice(slice, contentSlice.openStart, contentSlice.openEnd)
                )
              );
              return true;
            }

            return false;
          }
        }
      })
    ];
  }
});
