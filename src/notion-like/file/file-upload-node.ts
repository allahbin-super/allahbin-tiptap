import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FileUploadNodeView } from './FileUploadNodeView';

export type FileUploadFn = (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
) => Promise<string>;

export interface FileUploadNodeOptions {
  accept?: string;
  limit?: number;
  /** 0 表示不在前端限制大小，交给 fileUploader */
  maxSize?: number;
  upload?: FileUploadFn;
  onError?: (error: Error) => void;
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileUpload: {
      setFileUploadNode: (options?: Partial<FileUploadNodeOptions>) => ReturnType;
    };
  }
}

/** 非图片文件上传占位：完成后按 MIME 插入 file（或 image）节点 */
export const FileUploadNode = Node.create<FileUploadNodeOptions>({
  name: 'fileUpload',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      accept: '*/*',
      limit: 1,
      maxSize: 0,
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
    return [{ tag: 'div[data-type="file-upload"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'file-upload' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileUploadNodeView);
  },

  addCommands() {
    return {
      setFileUploadNode:
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
        if (nodeAfter?.type.name === 'fileUpload' && editor.isActive('fileUpload')) {
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
