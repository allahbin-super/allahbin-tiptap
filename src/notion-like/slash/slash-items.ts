import type { Editor, Range } from '@tiptap/react';
import {
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table,
  Type
} from 'lucide-react';
import type { SlashSuggestionItem } from './slash-types';
import { isNodeInSchema } from './slash-utils';

type SlashItemType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'quote'
  | 'codeBlock'
  | 'table'
  | 'divider';

const itemMeta: Record<
  SlashItemType,
  Pick<SlashSuggestionItem, 'title' | 'subtext' | 'keywords' | 'badge' | 'group'>
> = {
  text: {
    title: '正文',
    subtext: '普通段落',
    keywords: ['p', 'paragraph', 'text', '正文'],
    badge: Type,
    group: '基础'
  },
  heading1: {
    title: '标题 1',
    subtext: '一级标题',
    keywords: ['h', 'h1', 'heading1', '标题'],
    badge: Heading1,
    group: '基础'
  },
  heading2: {
    title: '标题 2',
    subtext: '二级标题',
    keywords: ['h2', 'heading2', '标题'],
    badge: Heading2,
    group: '基础'
  },
  heading3: {
    title: '标题 3',
    subtext: '三级标题',
    keywords: ['h3', 'heading3', '标题'],
    badge: Heading3,
    group: '基础'
  },
  bulletList: {
    title: '无序列表',
    subtext: '项目符号列表',
    keywords: ['ul', 'list', 'bullet', '无序'],
    badge: List,
    group: '基础'
  },
  orderedList: {
    title: '有序列表',
    subtext: '数字编号列表',
    keywords: ['ol', 'numbered', '有序'],
    badge: ListOrdered,
    group: '基础'
  },
  taskList: {
    title: '任务列表',
    subtext: '待办勾选列表',
    keywords: ['todo', 'task', 'checklist', '任务'],
    badge: CheckSquare,
    group: '基础'
  },
  quote: {
    title: '引用',
    subtext: '引用块',
    keywords: ['quote', 'blockquote', '引用'],
    badge: Quote,
    group: '基础'
  },
  codeBlock: {
    title: '代码块',
    subtext: '多行代码',
    keywords: ['code', 'pre', '代码'],
    badge: Code2,
    group: '插入'
  },
  table: {
    title: '表格',
    subtext: '插入 3x3 表格',
    keywords: ['table', '表格'],
    badge: Table,
    group: '插入'
  },
  divider: {
    title: '分割线',
    subtext: '水平分隔',
    keywords: ['hr', 'divider', 'separator', '分割'],
    badge: Minus,
    group: '插入'
  }
};

const itemActions: Record<
  SlashItemType,
  {
    check: (editor: Editor) => boolean;
    action: (editor: Editor, range: Range) => void;
  }
> = {
  text: {
    check: editor => isNodeInSchema('paragraph', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    }
  },
  heading1: {
    check: editor => isNodeInSchema('heading', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
    }
  },
  heading2: {
    check: editor => isNodeInSchema('heading', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
    }
  },
  heading3: {
    check: editor => isNodeInSchema('heading', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
    }
  },
  bulletList: {
    check: editor => isNodeInSchema('bulletList', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    }
  },
  orderedList: {
    check: editor => isNodeInSchema('orderedList', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    }
  },
  taskList: {
    check: editor => isNodeInSchema('taskList', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    }
  },
  quote: {
    check: editor => isNodeInSchema('blockquote', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    }
  },
  codeBlock: {
    check: editor => isNodeInSchema('codeBlock', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    }
  },
  table: {
    check: editor => isNodeInSchema('table', editor),
    action: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }
  },
  divider: {
    check: editor => isNodeInSchema('horizontalRule', editor),
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    }
  }
};

/** 按当前 schema 生成斜杠菜单项 */
export function getSlashMenuItems(editor: Editor): SlashSuggestionItem[] {
  const items: SlashSuggestionItem[] = [];

  (Object.keys(itemMeta) as SlashItemType[]).forEach(itemType => {
    const impl = itemActions[itemType];
    const meta = itemMeta[itemType];
    if (!impl.check(editor)) {
      return;
    }

    items.push({
      ...meta,
      context: { itemType },
      onSelect: ({ editor: currentEditor, range }) => impl.action(currentEditor, range)
    });
  });

  return items;
}
