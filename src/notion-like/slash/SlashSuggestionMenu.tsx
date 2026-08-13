import { flip, FloatingPortal, offset, shift, size } from '@floating-ui/react';
import { PluginKey } from '@tiptap/pm/state';
import type { Range } from '@tiptap/react';
import {
  Suggestion,
  SuggestionPluginKey,
  type SuggestionKeyDownProps,
  type SuggestionProps
} from '@tiptap/suggestion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSlashMenuItems } from './slash-items';
import type {
  SlashMenuRenderProps,
  SlashSuggestionItem,
  SlashSuggestionMenuProps
} from './slash-types';
import { filterSuggestionItems } from './slash-utils';
import { useSlashFloating } from './use-slash-floating';
import { useSlashNavigation } from './use-slash-navigation';

/** 输入 `/` 后弹出的块插入菜单 */
export const SlashSuggestionMenu: React.FC<SlashSuggestionMenuProps> = ({
  editor,
  floatingOptions,
  selector = 'atiptap-notion-slash-menu',
  children,
  maxHeight = 360,
  pluginKey = SuggestionPluginKey,
  ...suggestionProps
}) => {
  const [show, setShow] = useState(false);
  const [decorationNode, setDecorationNode] = useState<HTMLElement | null>(null);
  const [internalCommand, setInternalCommand] = useState<
    ((item: SlashSuggestionItem) => void) | null
  >(null);
  const [internalItems, setInternalItems] = useState<SlashSuggestionItem[]>([]);
  const [internalQuery, setInternalQuery] = useState('');
  const [internalRange, setInternalRange] = useState<Range | null>(null);

  const { ref, style, getFloatingProps, isMounted } = useSlashFloating(show, decorationNode, 40, {
    placement: 'bottom-start',
    middleware: [
      offset(8),
      flip({ mainAxis: true, crossAxis: false }),
      shift(),
      size({
        apply({ availableHeight, elements }) {
          if (elements.floating) {
            elements.floating.style.setProperty(
              '--atiptap-notion-slash-max-height',
              `${Math.min(maxHeight, availableHeight)}px`
            );
          }
        }
      })
    ],
    onOpenChange(open) {
      if (!open) {
        setShow(false);
      }
    },
    ...floatingOptions
  });

  const suggestionPropsRef = useRef(suggestionProps);

  useEffect(() => {
    suggestionPropsRef.current = suggestionProps;
  }, [suggestionProps]);

  const closePopup = useCallback(() => {
    setShow(false);
  }, []);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const existingPlugin = editor.state.plugins.find(plugin => plugin.spec.key === pluginKey);
    if (existingPlugin) {
      editor.unregisterPlugin(pluginKey);
    }

    const suggestion = Suggestion({
      pluginKey: pluginKey instanceof PluginKey ? pluginKey : new PluginKey(pluginKey),
      editor,
      allow() {
        return editor.isEditable;
      },
      command({ editor: currentEditor, range, props }) {
        if (!range) {
          return;
        }
        props.onSelect({ editor: currentEditor, range, context: props.context });
      },
      render: () => ({
        onStart: (props: SuggestionProps<SlashSuggestionItem>) => {
          setDecorationNode((props.decorationNode as HTMLElement) ?? null);
          setInternalCommand(() => props.command);
          setInternalItems(props.items);
          setInternalQuery(props.query);
          setInternalRange(props.range);
          setShow(true);
        },
        onUpdate: (props: SuggestionProps<SlashSuggestionItem>) => {
          setDecorationNode((props.decorationNode as HTMLElement) ?? null);
          setInternalCommand(() => props.command);
          setInternalItems(props.items);
          setInternalQuery(props.query);
          setInternalRange(props.range);
        },
        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === 'Escape') {
            closePopup();
            return true;
          }
          return false;
        },
        onExit: () => {
          setDecorationNode(null);
          setInternalCommand(null);
          setInternalItems([]);
          setInternalQuery('');
          setInternalRange(null);
          setShow(false);
        }
      }),
      ...suggestionPropsRef.current
    });

    editor.registerPlugin(suggestion);

    return () => {
      if (!editor.isDestroyed) {
        editor.unregisterPlugin(pluginKey);
      }
    };
  }, [editor, pluginKey, closePopup]);

  const onSelect = useCallback(
    (item: SlashSuggestionItem) => {
      closePopup();
      internalCommand?.(item);
    },
    [closePopup, internalCommand]
  );

  const { selectedIndex } = useSlashNavigation({
    editor,
    query: internalQuery,
    items: internalItems,
    onSelect,
    onClose: closePopup
  });

  if (!isMounted || !show || !editor) {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={style}
        {...getFloatingProps()}
        data-selector={selector}
        className="atiptap-notion-slash-menu"
        role="listbox"
        aria-label="斜杠命令"
        onPointerDown={event => event.preventDefault()}
      >
        {children({
          items: internalItems,
          range: internalRange,
          selectedIndex,
          onSelect
        })}
      </div>
    </FloatingPortal>
  );
};

const SlashMenuItem: React.FC<{
  item: SlashSuggestionItem;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ item, isSelected, onSelect }) => {
  const itemRef = useRef<HTMLButtonElement>(null);
  const BadgeIcon = item.badge;

  useEffect(() => {
    if (isSelected) {
      itemRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <button
      ref={itemRef}
      type="button"
      className="atiptap-notion-slash-item"
      data-active={isSelected ? 'true' : 'false'}
      onClick={onSelect}
    >
      <span className="atiptap-notion-slash-item__icon">
        {BadgeIcon ? <BadgeIcon size={16} /> : null}
      </span>
      <span className="atiptap-notion-slash-item__body">
        <span className="atiptap-notion-slash-item__title">{item.title}</span>
        {item.subtext ? (
          <span className="atiptap-notion-slash-item__subtext">{item.subtext}</span>
        ) : null}
      </span>
    </button>
  );
};

/** 分组渲染斜杠命令列表 */
export const SlashMenuList: React.FC<SlashMenuRenderProps> = ({
  items,
  selectedIndex,
  onSelect
}) => {
  const renderedItems = useMemo(() => {
    const rendered: React.ReactElement[] = [];
    const groups: Record<string, { items: SlashSuggestionItem[]; indices: number[] }> = {};

    items.forEach((item, index) => {
      const groupLabel = item.group || '';
      if (!groups[groupLabel]) {
        groups[groupLabel] = { items: [], indices: [] };
      }
      groups[groupLabel].items.push(item);
      groups[groupLabel].indices.push(index);
    });

    Object.entries(groups).forEach(([groupLabel, groupData]) => {
      if (groupLabel) {
        rendered.push(
          <div key={`group-label-${groupLabel}`} className="atiptap-notion-slash-group">
            {groupLabel}
          </div>
        );
      }

      groupData.items.forEach((item, itemIndex) => {
        const originalIndex = groupData.indices[itemIndex];
        rendered.push(
          <SlashMenuItem
            key={item.title}
            item={item}
            isSelected={originalIndex === selectedIndex}
            onSelect={() => onSelect(item)}
          />
        );
      });
    });

    return rendered;
  }, [items, selectedIndex, onSelect]);

  if (!renderedItems.length) {
    return <div className="atiptap-notion-slash-empty">没有匹配的命令</div>;
  }

  return <div className="atiptap-notion-slash-list">{renderedItems}</div>;
};

export const NotionSlashMenu: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <SlashSuggestionMenu
      editor={editor}
      char="/"
      pluginKey="atiptapNotionSlash"
      decorationClass="atiptap-notion-slash-decoration"
      items={({ query, editor: currentEditor }) =>
        filterSuggestionItems(getSlashMenuItems(currentEditor), query)
      }
    >
      {props => <SlashMenuList {...props} />}
    </SlashSuggestionMenu>
  );
};
