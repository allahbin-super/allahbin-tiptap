import { mergeAttributes, Node } from '@tiptap/core';

export type MentionNodeAttrs = {
  id: string;
  label: string;
};

/**
 * 行内 @提及节点（atom）。
 * 自定义节点优先 mode="json"；md 模式下无 Markdown 序列化会丢块。
 */
export const MentionNode = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-id') || '',
        renderHTML: (attributes: MentionNodeAttrs) => ({
          'data-id': attributes.id || ''
        })
      },
      label: {
        default: '',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-label') || element.textContent?.replace(/^@/, '') || '',
        renderHTML: (attributes: MentionNodeAttrs) => ({
          'data-label': attributes.label || ''
        })
      }
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-mention]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const label = (node.attrs.label as string) || '';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-mention': '',
        class: 'atiptap-notion-mention',
        contenteditable: 'false'
      }),
      `@${label}`
    ];
  },

  renderText({ node }) {
    const label = (node.attrs.label as string) || '';
    return `@${label}`;
  }
});

export default MentionNode;
