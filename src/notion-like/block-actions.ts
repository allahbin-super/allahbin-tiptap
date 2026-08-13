import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';

export function setEditorMeta(editor: Editor, key: string, value: unknown) {
  editor.view.dispatch(editor.state.tr.setMeta(key, value));
}

/** setContent 后句柄可能仍持有旧 pos，nodeAt 越界会抛 RangeError */
export function getNodeAtPos(doc: ProseMirrorNode, pos: number): ProseMirrorNode | null {
  if (!Number.isInteger(pos) || pos < 0 || pos > doc.content.size) {
    return null;
  }
  try {
    return doc.nodeAt(pos);
  } catch {
    return null;
  }
}

export function isTextSelectionActive(editor: Editor | null): boolean {
  if (!editor) {
    return false;
  }
  const { selection } = editor.state;
  return (
    selection instanceof TextSelection && !selection.empty && !selection.$from.parent.type.spec.code
  );
}

/** 选中当前块，便于转换 / 复制 / 删除命中正确节点 */
export function selectBlockNode(editor: Editor, pos: number) {
  const node = getNodeAtPos(editor.state.doc, pos);
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

/** 把当前块的 Markdown 写入剪贴板 */
export function copyNodeMarkdown(editor: Editor | null, nodePos?: number): boolean {
  if (!editor) {
    return false;
  }
  const info = getMovableBlock(editor, nodePos);
  if (!info) {
    return false;
  }
  const markdownStorage = editor.storage as {
    markdown?: {
      serializer?: { serialize: (node: ProseMirrorNode) => string };
      getMarkdown?: () => string;
    };
  };
  const text =
    markdownStorage.markdown?.serializer?.serialize(info.node) ||
    markdownStorage.markdown?.getMarkdown?.() ||
    '';
  void navigator.clipboard.writeText(text);
  return Boolean(text);
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

const SKIP_MOVE_TYPES = ['tableRow', 'tableHeader', 'tableCell', 'listItem', 'taskItem'];

function getMovableBlock(
  editor: Editor,
  nodePos?: number
): { pos: number; node: ProseMirrorNode } | null {
  const { selection, doc } = editor.state;
  if (typeof nodePos === 'number' && nodePos >= 0) {
    const node = getNodeAtPos(doc, nodePos);
    if (node) {
      return { pos: nodePos, node };
    }
    // 赋值 html/md/json 后文档变短，旧 pos 已失效
    if (nodePos > doc.content.size) {
      return null;
    }
  }

  const $from = selection.$from;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (!node.isBlock || SKIP_MOVE_TYPES.includes(node.type.name)) {
      continue;
    }
    return { pos: $from.before(depth), node };
  }
  return null;
}

export function canMoveBlock(editor: Editor | null, direction: -1 | 1, nodePos?: number): boolean {
  if (!editor || !editor.isEditable) {
    return false;
  }
  try {
    const info = getMovableBlock(editor, nodePos);
    if (!info) {
      return false;
    }
    const $pos = editor.state.doc.resolve(info.pos);
    const index = $pos.index();
    return direction < 0 ? index > 0 : index < $pos.parent.childCount - 1;
  } catch {
    return false;
  }
}

/** 将当前块上移 / 下移一个同级节点 */
export function moveBlock(editor: Editor | null, direction: -1 | 1, nodePos?: number): boolean {
  if (!editor || !editor.isEditable) {
    return false;
  }

  const info = getMovableBlock(editor, nodePos);
  if (!info) {
    return false;
  }

  try {
    const { pos, node } = info;
    const tr = editor.state.tr;
    const $pos = tr.doc.resolve(pos);
    const parent = $pos.parent;
    const index = $pos.index();

    if (direction < 0 && index > 0) {
      const prevSize = parent.child(index - 1).nodeSize;
      const movedNode = node.type.create(node.attrs, node.content, node.marks);
      tr.delete(pos, pos + node.nodeSize);
      const insertPos = pos - prevSize;
      tr.insert(insertPos, movedNode);
      tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos)));
    } else if (direction > 0 && index < parent.childCount - 1) {
      const nextSize = parent.child(index + 1).nodeSize;
      const movedNode = node.type.create(node.attrs, node.content, node.marks);
      tr.delete(pos, pos + node.nodeSize);
      const insertPos = pos + nextSize;
      tr.insert(insertPos, movedNode);
      tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos)));
    } else {
      return false;
    }

    editor.view.dispatch(tr.scrollIntoView());
    return true;
  } catch {
    return false;
  }
}

/** 在空段落内插入 `/`，触发斜杠菜单 */
export function insertSlashAtNode(
  editor: Editor | null,
  node: ProseMirrorNode | null,
  nodePos: number
): boolean {
  if (!editor || !editor.isEditable || !node || nodePos < 0) {
    return false;
  }

  const isEmpty = node.type.name === 'paragraph' && node.content.size === 0;
  const insertPos = isEmpty ? nodePos + 1 : nodePos + node.nodeSize;
  editor.view.dispatch(editor.state.tr.scrollIntoView().insertText('/', insertPos));
  editor.commands.focus(insertPos + 1);
  return true;
}
