import type { UseFloatingOptions } from '@floating-ui/react';
import type { PluginKey } from '@tiptap/pm/state';
import type { Editor, Range } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import type React from 'react';

export interface SlashSuggestionItem<T = unknown> {
  /** 菜单主标题 */
  title: string;
  /** 补充说明 */
  subtext?: string;
  /** 左侧图标 */
  badge?: React.ComponentType<{ className?: string; size?: number }>;
  /** 分组名，用于键盘上下键按视觉顺序导航 */
  group?: string;
  /** 过滤用关键词，可混中英文 */
  keywords?: string[];
  context?: T;
  onSelect: (props: { editor: Editor; range: Range; context?: T }) => void;
}

export type SlashMenuRenderProps<T = unknown> = {
  items: SlashSuggestionItem<T>[];
  range?: Range | null;
  selectedIndex?: number;
  onSelect: (item: SlashSuggestionItem<T>) => void;
};

export interface SlashSuggestionMenuProps<T = unknown> extends Omit<
  SuggestionOptions<SlashSuggestionItem<T>>,
  'pluginKey' | 'editor'
> {
  editor?: Editor | null;
  floatingOptions?: Partial<UseFloatingOptions>;
  selector?: string;
  pluginKey?: string | PluginKey;
  maxHeight?: number;
  children: (props: SlashMenuRenderProps<T>) => React.ReactNode;
}
