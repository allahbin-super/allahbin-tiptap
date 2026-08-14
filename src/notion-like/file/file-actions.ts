import type { Editor } from '@tiptap/react';
import { isImageMime, resolveMime } from './file-kind';

export type FileUploadAcceptPreset = 'file' | 'video' | 'audio' | 'any';

const ACCEPT_MAP: Record<FileUploadAcceptPreset, string> = {
  file: '*/*',
  video: 'video/*',
  audio: 'audio/*',
  any: '*/*'
};

export function getAcceptForPreset(preset: FileUploadAcceptPreset): string {
  return ACCEPT_MAP[preset];
}

/** 插入文件上传占位块 */
export function insertFileUploadNode(
  editor: Editor | null,
  preset: FileUploadAcceptPreset = 'file'
): boolean {
  if (!editor || editor.isDestroyed) {
    return false;
  }
  if (!editor.schema.nodes.fileUpload) {
    return false;
  }
  return editor
    .chain()
    .focus()
    .insertContent({
      type: 'fileUpload',
      attrs: {
        accept: getAcceptForPreset(preset),
        limit: 1,
        maxSize: 0
      }
    })
    .run();
}

export function buildFileNodeContent(file: File, src: string) {
  const mime = resolveMime(file.type, file.name);
  return {
    type: 'file' as const,
    attrs: {
      src,
      name: file.name,
      mime,
      size: file.size
    }
  };
}

export function buildImageNodeContent(file: File, src: string) {
  return {
    type: 'image' as const,
    attrs: {
      src,
      alt: file.name,
      title: file.name,
      'data-align': 'center'
    }
  };
}

/** 按 MIME 生成 image 或 file 节点内容 */
export function buildMediaNodeFromUpload(file: File, src: string) {
  if (isImageMime(file.type, file.name)) {
    return buildImageNodeContent(file, src);
  }
  return buildFileNodeContent(file, src);
}
