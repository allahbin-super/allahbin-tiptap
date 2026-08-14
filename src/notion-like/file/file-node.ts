import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { getFileKind, resolveMime } from './file-kind';
import { FileNodeView } from './FileNodeView';

export type FileNodeAttrs = {
  src: string;
  name: string;
  mime: string;
  size: number | null;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    file: {
      setFile: (attrs: Partial<FileNodeAttrs> & { src: string }) => ReturnType;
    };
  }
}

function buildFileAttrs(attrs: Record<string, unknown>): FileNodeAttrs {
  const src = String(attrs.src || '');
  const name = String(attrs.name || '');
  const mime = resolveMime(attrs.mime as string, name);
  const rawSize = attrs.size;
  const size =
    typeof rawSize === 'number'
      ? rawSize
      : rawSize == null || rawSize === ''
        ? null
        : Number(rawSize);
  return {
    src,
    name,
    mime,
    size: Number.isFinite(size as number) ? (size as number) : null
  };
}

/** ANotion 通用文件块：视频 / 音频 / 附件，按 MIME 切换展示 */
export const FileNode = Node.create({
  name: 'file',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null
      },
      name: {
        default: '',
        parseHTML: element =>
          element.getAttribute('data-file-name') ||
          element.getAttribute('title') ||
          element.getAttribute('download') ||
          ''
      },
      mime: {
        default: '',
        parseHTML: element => element.getAttribute('data-file-mime') || ''
      },
      size: {
        default: null,
        parseHTML: element => {
          const value = element.getAttribute('data-file-size');
          if (!value) {
            return null;
          }
          const num = Number(value);
          return Number.isFinite(num) ? num : null;
        },
        renderHTML: attributes =>
          attributes.size != null ? { 'data-file-size': String(attributes.size) } : {}
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
        getAttrs: node => {
          const el = node as HTMLElement;
          return {
            src: el.getAttribute('src'),
            name: el.getAttribute('data-file-name') || '',
            mime: el.getAttribute('data-file-mime') || 'video/*',
            size: el.getAttribute('data-file-size')
          };
        }
      },
      {
        tag: 'audio[src]',
        getAttrs: node => {
          const el = node as HTMLElement;
          return {
            src: el.getAttribute('src'),
            name: el.getAttribute('data-file-name') || '',
            mime: el.getAttribute('data-file-mime') || 'audio/*',
            size: el.getAttribute('data-file-size')
          };
        }
      },
      {
        tag: 'a[data-type="file"][href]',
        getAttrs: node => {
          const el = node as HTMLElement;
          return {
            src: el.getAttribute('href'),
            name: el.getAttribute('data-file-name') || el.textContent || '',
            mime: el.getAttribute('data-file-mime') || '',
            size: el.getAttribute('data-file-size')
          };
        }
      }
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = buildFileAttrs({ ...node.attrs, ...HTMLAttributes });
    const kind = getFileKind(attrs.mime, attrs.name);
    const common = {
      'data-file-name': attrs.name || undefined,
      'data-file-mime': attrs.mime || undefined,
      'data-file-size': attrs.size != null ? String(attrs.size) : undefined
    };

    if (kind === 'video') {
      return [
        'video',
        mergeAttributes(common, {
          src: attrs.src,
          controls: 'true',
          preload: 'metadata'
        })
      ];
    }
    if (kind === 'audio') {
      return [
        'audio',
        mergeAttributes(common, {
          src: attrs.src,
          controls: 'true',
          preload: 'metadata'
        })
      ];
    }
    return [
      'a',
      mergeAttributes(common, {
        'data-type': 'file',
        href: attrs.src,
        target: '_blank',
        rel: 'noopener noreferrer',
        download: attrs.name || undefined
      }),
      attrs.name || attrs.src || '文件'
    ];
  },

  addCommands() {
    return {
      setFile:
        attrs =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: buildFileAttrs(attrs)
          })
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileNodeView);
  }
});
