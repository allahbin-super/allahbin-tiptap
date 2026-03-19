import { markInputRule } from '@tiptap/core';
import { Link as TLink, LinkOptions as TLinkOptions } from '@tiptap/extension-link';

export const inputRegex = /(?:^|\s)\[(.+?)]\((.+?)\)\s$/;

export type LinkOptions = TLinkOptions;

export const ALink = TLink.extend<LinkOptions>({
  inclusive: false,

  name: 'link',

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: element => `${element.getAttribute('href') ?? ''}`
      },
      target: {
        default: this.options.HTMLAttributes.target
      },
      'data-id': {
        default: null,
        parseHTML: element => `${element.getAttribute('data-id') ?? ''}`
      }
    };
  },

  parseHTML() {
    return [{ tag: 'a[href]:not([href *= "javascript:" i]):not([data-type])' }];
  },

  addCommands() {
    return {
      ...this.parent?.(),

      toggleLink:
        attributes =>
        ({ chain, editor }) => {
          if (editor.isActive(this.name)) {
            return chain().unsetLink().run();
          }
          return chain()
            .setLink(attributes || { href: '' })
            .run();
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-k': () => this.editor.chain().toggleLink({ href: '' }).run()
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => {
          const [, , href] = match;
          match.pop();
          return { href };
        }
      })
    ];
  }
});
