import { Extension } from '@tiptap/core';
import { FileHandler } from '@tiptap/extension-file-handler';
import type { Editor } from '@tiptap/react';
import type { UploaderFunc } from './ATiptapEdit';
import { buildFileNodeContent } from './notion-like/file/file-actions';
import { isImageMime } from './notion-like/file/file-kind';

export type { UploaderFunc };

const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** 常见非图片 MIME，用于 FileHandler 白名单；也接受空 type 靠扩展名分流 */
const FILE_MIMES = [
  ...IMAGE_MIMES,
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/json',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/octet-stream'
];

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

/** 插入非图片文件节点；必须有 fileUploader，只存 URL */
export async function insertFileNodes(
  editor: Editor,
  files: File[],
  upload?: UploaderFunc,
  pos?: number
) {
  if (!upload || !editor.schema.nodes.file) {
    return;
  }
  const nonImages = files.filter(file => !isImageMime(file.type, file.name));
  let insertPos = pos;
  for (const file of nonImages) {
    const src = await upload(file, () => undefined);
    if (!src) {
      continue;
    }
    const content = buildFileNodeContent(file, src);
    const chain = editor.chain().focus();
    if (typeof insertPos === 'number') {
      chain.insertContentAt(insertPos, content);
      insertPos += 1;
    } else {
      chain.insertContent(content);
    }
    chain.run();
  }
}

async function insertDroppedOrPastedFiles(
  editor: Editor,
  files: File[],
  imageUpload?: UploaderFunc,
  fileUpload?: UploaderFunc,
  pos?: number
) {
  const images = files.filter(file => isImageMime(file.type, file.name));
  const others = files.filter(file => !isImageMime(file.type, file.name));
  const resolvedImageUpload = imageUpload || fileUpload;
  if (images.length) {
    await insertImageFiles(editor, images, resolvedImageUpload, pos);
  }
  if (others.length) {
    await insertFileNodes(editor, others, fileUpload, pos);
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

type FileUploaderStorage = {
  upload?: UploaderFunc;
};

declare module '@tiptap/core' {
  interface Storage {
    imageUploader: ImageUploadStorage;
    fileUploader: FileUploaderStorage;
  }
}

export type CreateMediaUploadOptions = {
  imageUploader?: UploaderFunc;
  fileUploader?: UploaderFunc;
};

/** 把上传函数挂到 editor.storage，并处理粘贴 / 拖放图片与文件 */
export function createImageUploadExtensions(upload?: UploaderFunc) {
  return createMediaUploadExtensions({ imageUploader: upload });
}

/** 图片 + 文件粘贴/拖放分流 */
export function createMediaUploadExtensions(options: CreateMediaUploadOptions = {}) {
  const { imageUploader, fileUploader } = options;
  return [
    Extension.create({
      name: 'imageUploader',
      addStorage() {
        return {
          upload: imageUploader || fileUploader,
          requestUrlInsert: undefined
        } satisfies ImageUploadStorage;
      }
    }),
    Extension.create({
      name: 'fileUploader',
      addStorage() {
        return {
          upload: fileUploader
        } satisfies FileUploaderStorage;
      }
    }),
    FileHandler.configure({
      allowedMimeTypes: FILE_MIMES,
      consumePasteEvent: true,
      onPaste: (currentEditor, files) => {
        const editor = currentEditor as Editor;
        const currentImageUpload =
          editor.storage.imageUploader?.upload || editor.storage.fileUploader?.upload;
        const currentFileUpload = editor.storage.fileUploader?.upload;
        void insertDroppedOrPastedFiles(editor, files, currentImageUpload, currentFileUpload);
      },
      onDrop: (currentEditor, files, pos) => {
        const editor = currentEditor as Editor;
        const currentImageUpload =
          editor.storage.imageUploader?.upload || editor.storage.fileUploader?.upload;
        const currentFileUpload = editor.storage.fileUploader?.upload;
        void insertDroppedOrPastedFiles(editor, files, currentImageUpload, currentFileUpload, pos);
      }
    })
  ];
}
