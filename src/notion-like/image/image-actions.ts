import { NodeSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { pickLocalImage, resolveImageSrc } from '../../image-upload';
import { downloadImageUrl } from './image-utils';

export type ImageAlign = 'left' | 'center' | 'right';

export function selectNearestImage(editor: Editor | null): boolean {
  if (!editor) {
    return false;
  }
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    if ($from.node(depth).type.name === 'image') {
      const pos = depth === 0 ? 0 : $from.before(depth);
      return editor.commands.setNodeSelection(pos);
    }
  }
  const before = $from.nodeBefore;
  if (before?.type.name === 'image') {
    return editor.commands.setNodeSelection($from.pos - before.nodeSize);
  }
  const after = $from.nodeAfter;
  if (after?.type.name === 'image') {
    return editor.commands.setNodeSelection($from.pos);
  }
  return false;
}

export function isImageSelected(editor: Editor | null): boolean {
  if (!editor) {
    return false;
  }
  const { selection } = editor.state;
  return selection instanceof NodeSelection && selection.node.type.name === 'image';
}

export function setImageAlign(editor: Editor | null, align: ImageAlign): boolean {
  if (!editor?.isEditable || !isImageSelected(editor)) {
    return false;
  }
  const pos = editor.state.selection.from;
  const ok = editor.chain().focus().updateAttributes('image', { 'data-align': align }).run();
  if (ok) {
    editor.commands.setNodeSelection(pos);
  }
  return ok;
}

export function showImageCaption(editor: Editor | null): boolean {
  if (!editor?.isEditable || !isImageSelected(editor)) {
    return false;
  }
  const pos = editor.state.selection.from;
  const ok = editor.chain().focus().updateAttributes('image', { showCaption: true }).run();
  if (ok) {
    editor
      .chain()
      .focus(pos + 1)
      .selectTextblockEnd()
      .run();
  }
  return ok;
}

export async function downloadSelectedImage(editor: Editor | null): Promise<boolean> {
  if (!editor || !isImageSelected(editor)) {
    return false;
  }
  const node = (editor.state.selection as NodeSelection).node;
  return downloadImageUrl(node.attrs.src, node.attrs.alt || node.attrs.title);
}

export function replaceSelectedImage(editor: Editor | null): boolean {
  if (!editor?.isEditable || !isImageSelected(editor)) {
    return false;
  }
  const pos = editor.state.selection.from;
  pickLocalImage(file => {
    void (async () => {
      const upload = editor.storage.imageUploader?.upload;
      const src = await resolveImageSrc(file, upload);
      if (!src) {
        return;
      }
      editor
        .chain()
        .focus()
        .setNodeSelection(pos)
        .updateAttributes('image', { src, alt: file.name, title: file.name })
        .run();
      editor.commands.setNodeSelection(pos);
    })();
  });
  return true;
}

export function insertImageUploadNode(editor: Editor | null): boolean {
  if (!editor?.isEditable) {
    return false;
  }
  if (isImageSelected(editor)) {
    return replaceSelectedImage(editor);
  }
  if (editor.can().insertContent({ type: 'imageUpload' })) {
    return editor.chain().focus().insertContent({ type: 'imageUpload' }).run();
  }
  editor.storage.imageUploader?.requestUrlInsert?.();
  return true;
}

export function deleteSelectedImage(editor: Editor | null): boolean {
  if (!editor?.isEditable || !isImageSelected(editor)) {
    return false;
  }
  return editor.chain().focus().deleteSelection().run();
}
