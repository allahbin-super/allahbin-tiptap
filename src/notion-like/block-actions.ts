import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/react';

export function setEditorMeta(editor: Editor, key: string, value: unknown) {
  editor.view.dispatch(editor.state.tr.setMeta(key, value));
}

export function isTextSelectionActive(editor: Editor | null): boolean {
  if (!editor) {
    return false;
  }
  const { selection } = editor.state;
  return selection instanceof TextSelection && !selection.empty && !selection.$from.parent.type.spec.code;
}

/** 选中当前块，便于转换 / 复制 / 删除命中正确节点 */
export function selectBlockNode(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) {
    return;
  }

  if (node.type.name === 'heading') {
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(pos + 1)))
    );
    return;
  }

  try {
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)));
  } catch {
    editor.commands.focus(pos + 1);
  }
}

export function duplicateNode(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) {
    return false;
  }

  const { selection, doc } = editor.state;
  if (selection instanceof NodeSelection && selection.node) {
    return editor.chain().focus().insertContentAt(selection.to, selection.node.toJSON()).run();
  }

  const $anchor = selection.$anchor;
  for (let depth = 1; depth <= $anchor.depth; depth += 1) {
    const node = $anchor.node(depth);
    if (node.type.name === 'doc') {
      continue;
    }
    const insertPos = Math.min($anchor.start(depth) + node.nodeSize, doc.content.size);
    return editor.chain().focus().insertContentAt(insertPos, node.toJSON()).run();
  }

  return false;
}

export function deleteNode(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) {
    return false;
  }

  const { selection } = editor.state;
  if (selection instanceof NodeSelection && selection.node) {
    return editor
      .chain()
      .focus()
      .deleteRange({ from: selection.from, to: selection.from + selection.node.nodeSize })
      .run();
  }

  const $pos = selection.$from;
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (!node?.isBlock || ['tableRow', 'tableHeader', 'tableCell'].includes(node.type.name)) {
      continue;
    }
    const pos = $pos.before(depth);
    return editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .run();
  }

  return false;
}

/** 在空段落内插入 `/`，触发斜杠菜单 */
export function insertSlashAtNode(editor: Editor | null, node: ProseMirrorNode | null, nodePos: number): boolean {
  if (!editor || !editor.isEditable || !node || nodePos < 0) {
    return false;
  }

  const isEmpty = node.type.name === 'paragraph' && node.content.size === 0;
  const insertPos = isEmpty ? nodePos + 1 : nodePos + node.nodeSize;
  editor.view.dispatch(editor.state.tr.scrollIntoView().insertText('/', insertPos));
  editor.commands.focus(insertPos + 1);
  return true;
}
