import type { Editor, Range } from '@tiptap/react';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  SlashMenuList,
  SlashSuggestionMenu
} from '../slash/SlashSuggestionMenu';
import type { SlashSuggestionItem } from '../slash/slash-types';
import { filterSuggestionItems } from '../slash/slash-utils';
import type { MentionItemsResolver, MentionSuggestionItem } from './mention-types';

export type NotionMentionMenuProps = {
  editor: Editor | null;
  mentionItems?: MentionItemsResolver;
};

const toSlashItems = (items: MentionSuggestionItem[]): SlashSuggestionItem[] =>
  items.map(item => ({
    title: item.label,
    subtext: item.subtext,
    keywords: [item.label, item.id, item.subtext || ''].filter(Boolean),
    context: item,
    onSelect: ({ editor: currentEditor, range, context }) => {
      const mention = (context as MentionSuggestionItem | undefined) || item;
      insertMention(currentEditor, range, mention);
    }
  }));

const insertMention = (editor: Editor, range: Range, item: MentionSuggestionItem) => {
  editor
    .chain()
    .focus()
    .insertContentAt(range, [
      {
        type: 'mention',
        attrs: {
          id: item.id,
          label: item.label
        }
      },
      {
        type: 'text',
        text: ' '
      }
    ])
    .run();
};

/** 输入 `@` 后弹出的提及菜单（复用 SlashSuggestionMenu 浮层与键盘导航） */
export const NotionMentionMenu: React.FC<NotionMentionMenuProps> = ({
  editor,
  mentionItems
}) => {
  const mentionItemsRef = useRef(mentionItems);

  useEffect(() => {
    mentionItemsRef.current = mentionItems;
  }, [mentionItems]);

  const resolveItems = useCallback(
    async ({ query }: { query: string; editor: Editor }) => {
      const source = mentionItemsRef.current;
      if (!source) {
        return [];
      }
      const list =
        typeof source === 'function' ? await Promise.resolve(source({ query })) : source;
      return filterSuggestionItems(toSlashItems(Array.isArray(list) ? list : []), query);
    },
    []
  );

  if (!editor || !mentionItems) {
    return null;
  }

  return (
    <SlashSuggestionMenu
      editor={editor}
      char="@"
      pluginKey="atiptapNotionMention"
      decorationClass="atiptap-notion-mention-decoration"
      items={resolveItems}
      allowSpaces={false}
    >
      {props => <SlashMenuList {...props} />}
    </SlashSuggestionMenu>
  );
};

export default NotionMentionMenu;
