import { Extension } from '@tiptap/core';
import { FileHandler } from '@tiptap/extension-file-handler';
import type { Editor } from '@tiptap/react';
import type { UploaderFunc } from './ATiptapEdit';

export type { UploaderFunc };

const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function resolveImageSrc(
  file: File,
  upload?: UploaderFunc,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE) {
    return '';
  }
  if (upload) {
    return upload(file, onProgress || (() => undefined));
  }
  onProgress?.(100);
  return fileToDataUrl(file);
}

export async function insertImageFiles(
  editor: Editor,
  files: File[],
  upload?: UploaderFunc,
  pos?: number
) {
  const images = files.filter(
    file => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE
  );
  for (const file of images) {
    const src = await resolveImageSrc(file, upload);
    if (!src) {
      continue;
    }
    const chain = editor.chain().focus();
    if (typeof pos === 'number') {
      chain.insertContentAt(pos, {
        type: 'image',
        attrs: { src, alt: file.name, 'data-align': 'center' }
      });
    } else {
      chain.setImage({ src, alt: file.name }).updateAttributes('image', { 'data-align': 'center' });
    }
    chain.run();
    selectInsertedImage(editor);
  }
}

function selectInsertedImage(editor: Editor) {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    if ($from.node(depth).type.name === 'image') {
      const imagePos = depth === 0 ? 0 : $from.before(depth);
      editor.commands.setNodeSelection(imagePos);
      return;
    }
  }
  const before = $from.nodeBefore;
  if (before?.type.name === 'image') {
    editor.commands.setNodeSelection($from.pos - before.nodeSize);
    return;
  }
  const after = $from.nodeAfter;
  if (after?.type.name === 'image') {
    editor.commands.setNodeSelection($from.pos);
  }
}

export function pickLocalImage(onFile: (file: File) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = IMAGE_MIMES.join(',');
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) {
      onFile(file);
    }
  };
  input.click();
}

type ImageUploadStorage = {
  upload?: UploaderFunc;
  requestUrlInsert?: () => void;
};

declare module '@tiptap/core' {
  interface Storage {
    imageUploader: ImageUploadStorage;
  }
}

/** 把上传函数挂到 editor.storage，并处理粘贴 / 拖放图片 */
export function createImageUploadExtensions(upload?: UploaderFunc) {
  return [
    Extension.create({
      name: 'imageUploader',
      addStorage() {
        return {
          upload,
          requestUrlInsert: undefined
        } satisfies ImageUploadStorage;
      }
    }),
    FileHandler.configure({
      allowedMimeTypes: IMAGE_MIMES,
      consumePasteEvent: true,
      onPaste: (currentEditor, files) => {
        const currentUpload = currentEditor.storage.imageUploader?.upload;
        void insertImageFiles(currentEditor as Editor, files, currentUpload);
      },
      onDrop: (currentEditor, files, pos) => {
        const currentUpload = currentEditor.storage.imageUploader?.upload;
        void insertImageFiles(currentEditor as Editor, files, currentUpload, pos);
      }
    })
  ];
}
