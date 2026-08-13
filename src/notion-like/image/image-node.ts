import type { ImageOptions } from '@tiptap/extension-image';
import { Image as TiptapImage } from '@tiptap/extension-image';
import type { Node } from '@tiptap/pm/model';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './ImageNodeView';

const imageSelectionKey = new PluginKey('notionImageSelection');

function canEditImageCaption(node: Node): boolean {
  return Boolean(node.attrs.showCaption) || node.content.size > 0;
}

/** 图注未展开时，禁止把光标放进图片节点内部，避免顶部空白条和闪烁 caret */
function createImageSelectionPlugin() {
  return new Plugin({
    key: imageSelectionKey,
    appendTransaction(transactions, _oldState, newState) {
      if (!transactions.some(tr => tr.docChanged || tr.selectionSet)) {
        return null;
      }
      const { selection, doc } = newState;
      if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
        return null;
      }
      const { $from } = selection;
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth);
        if (node.type.name !== 'image') {
          continue;
        }
        if (canEditImageCaption(node)) {
          return null;
        }
        return newState.tr.setSelection(NodeSelection.create(doc, $from.before(depth)));
      }
      return null;
    }
  });
}

interface ImageAttributes {
  src: string | null;
  alt?: string | null;
  title?: string | null;
  width?: string | null;
  height?: string | null;
  'data-align'?: string | null;
}

const parseImageAttributes = (img: Element): Partial<ImageAttributes> => ({
  src: img.getAttribute('src'),
  alt: img.getAttribute('alt'),
  title: img.getAttribute('title'),
  width: img.getAttribute('width'),
  height: img.getAttribute('height')
});

function buildImageHTMLAttributes(attrs: ImageAttributes): Record<string, string> {
  const result: Record<string, string> = { src: attrs.src || '' };
  if (attrs.alt) result.alt = attrs.alt;
  if (attrs.title) result.title = attrs.title;
  if (attrs.width) result.width = attrs.width;
  if (attrs.height) result.height = attrs.height;
  return result;
}

/** ANotion 图片块：对齐、宽度、图注 */
export const NotionImage = TiptapImage.extend<ImageOptions>({
  content: 'inline*',
  atom: false,
  isolating: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      'data-align': {
        default: 'center'
      },
      showCaption: {
        default: false,
        parseHTML: element =>
          element.tagName === 'FIGURE' || element.getAttribute('data-show-caption') === 'true',
        renderHTML: attributes => (attributes.showCaption ? { 'data-show-caption': 'true' } : {})
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: node => {
          const img = node.querySelector('img');
          if (!img) {
            return false;
          }
          return {
            ...parseImageAttributes(img),
            'data-align': node.getAttribute('data-align') || 'center',
            showCaption: true
          };
        },
        contentElement: 'figcaption'
      },
      {
        tag: 'img[src]',
        getAttrs: node => {
          if (node.closest('figure')) {
            return false;
          }
          return {
            ...parseImageAttributes(node),
            'data-align': node.getAttribute('data-align') || 'center',
            showCaption: false
          };
        }
      }
    ];
  },

  renderHTML({ node }) {
    const { src, alt, title, width, height, showCaption } = node.attrs;
    const align = node.attrs['data-align'];
    const imgAttrs = buildImageHTMLAttributes({ src, alt, title, width, height });
    const hasContent = node.content.size > 0;

    if (showCaption || hasContent) {
      const figureAttrs: Record<string, string> = { 'data-url': src || '' };
      if (showCaption) figureAttrs['data-show-caption'] = 'true';
      if (align) figureAttrs['data-align'] = align;
      return ['figure', figureAttrs, ['img', imgAttrs], ['figcaption', {}, 0]];
    }

    if (align) imgAttrs['data-align'] = align;
    return ['img', imgAttrs];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-a': ({ editor }) => {
        const { state, view } = editor;
        const { $from } = state.selection;
        let imagePos: number | null = null;
        let imageNode: Node | null = null;

        for (let depth = $from.depth; depth >= 0; depth -= 1) {
          const nodeAtDepth = $from.node(depth);
          if (nodeAtDepth.type === this.type) {
            imageNode = nodeAtDepth;
            imagePos = depth === 0 ? 0 : $from.before(depth);
            break;
          }
        }

        if (!imageNode || imagePos === null) {
          return false;
        }
        if (imageNode.content.size === 0 || imageNode.textContent.length === 0) {
          return false;
        }

        const start = imagePos + 1;
        const end = imagePos + imageNode.nodeSize - 1;
        view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, start, end)));
        return true;
      }
    };
  },

  addProseMirrorPlugins() {
    return [...(this.parent?.() || []), createImageSelectionPlugin()];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  }
});
