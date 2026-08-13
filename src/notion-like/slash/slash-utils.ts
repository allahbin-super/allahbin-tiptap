import type { Node } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/react';
import type { SlashSuggestionItem } from './slash-types';

/** 当前 schema 是否包含指定节点 */
export function isNodeInSchema(nodeName: string, editor: Editor | null): boolean {
  if (!editor?.schema) {
    return false;
  }
  return editor.schema.spec.nodes.get(nodeName) !== undefined;
}

/** 根据光标前文本，算出斜杠命令的起始位置 */
export function calculateStartPosition(
  cursorPosition: number,
  previousNode: Node | null,
  triggerChar?: string
): number {
  if (!previousNode?.text || !triggerChar) {
    return cursorPosition;
  }

  const triggerCharIndex = previousNode.text.lastIndexOf(triggerChar);
  if (triggerCharIndex === -1) {
    return cursorPosition;
  }

  return cursorPosition - previousNode.text.substring(triggerCharIndex).length;
}

/** 按标题、说明、关键词过滤斜杠菜单项 */
export function filterSuggestionItems(items: SlashSuggestionItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items
    .filter(item => {
      if (item.title.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      if (item.subtext?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      return Boolean(
        item.keywords?.some(keyword => keyword.toLowerCase().includes(normalizedQuery))
      );
    })
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      if (aTitle === normalizedQuery && bTitle !== normalizedQuery) return -1;
      if (bTitle === normalizedQuery && aTitle !== normalizedQuery) return 1;
      if (aTitle.startsWith(normalizedQuery) && !bTitle.startsWith(normalizedQuery)) return -1;
      if (bTitle.startsWith(normalizedQuery) && !aTitle.startsWith(normalizedQuery)) return 1;
      return 0;
    });
}
