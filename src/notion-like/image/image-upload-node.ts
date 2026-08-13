import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageUploadNodeView } from './ImageUploadNodeView';

export type ImageUploadFn = (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
) => Promise<string>;

export interface ImageUploadNodeOptions {
  type?: string;
  accept?: string;
  limit?: number;
  maxSize?: number;
  upload?: ImageUploadFn;
  onError?: (error: Error) => void;
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      setImageUploadNode: (options?: Partial<ImageUploadNodeOptions>) => ReturnType;
    };
  }
}

export const ImageUploadNode = Node.create<ImageUploadNodeOptions>({
  name: 'imageUpload',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      type: 'image',
      accept: 'image/*',
      limit: 3,
      maxSize: 5 * 1024 * 1024,
      upload: undefined,
      onError: undefined,
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      accept: { default: this.options.accept },
      limit: { default: this.options.limit },
      maxSize: { default: this.options.maxSize }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-upload"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'image-upload' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadNodeView);
  },

  addCommands() {
    return {
      setImageUploadNode:
        options =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options
          })
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        const { nodeAfter } = selection.$from;
        if (nodeAfter?.type.name === 'imageUpload' && editor.isActive('imageUpload')) {
          const nodeEl = editor.view.nodeDOM(selection.$from.pos);
          if (nodeEl instanceof HTMLElement) {
            const firstChild = nodeEl.firstElementChild;
            if (firstChild instanceof HTMLElement) {
              firstChild.click();
              return true;
            }
          }
        }
        return false;
      }
    };
  }
});
