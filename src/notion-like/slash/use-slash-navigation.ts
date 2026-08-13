import type { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

/** 斜杠菜单键盘导航：方向键、Tab、Enter、Escape */
export function useSlashNavigation<T>({
  editor,
  query,
  items,
  onSelect,
  onClose
}: {
  editor?: Editor | null;
  query?: string;
  items: T[];
  onSelect?: (item: T) => void;
  onClose?: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyboardNavigation = (event: KeyboardEvent) => {
      if (!items.length) {
        return false;
      }

      const moveNext = () =>
        setSelectedIndex(currentIndex => {
          if (currentIndex === -1) return 0;
          return (currentIndex + 1) % items.length;
        });

      const movePrev = () =>
        setSelectedIndex(currentIndex => {
          if (currentIndex === -1) return items.length - 1;
          return (currentIndex - 1 + items.length) % items.length;
        });

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          movePrev();
          return true;
        case 'ArrowDown':
          event.preventDefault();
          moveNext();
          return true;
        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            movePrev();
          } else {
            moveNext();
          }
          return true;
        case 'Home':
          event.preventDefault();
          setSelectedIndex(0);
          return true;
        case 'End':
          event.preventDefault();
          setSelectedIndex(items.length - 1);
          return true;
        case 'Enter':
          if (event.isComposing) return false;
          event.preventDefault();
          if (selectedIndex !== -1 && items[selectedIndex]) {
            onSelect?.(items[selectedIndex]);
          }
          return true;
        case 'Escape':
          event.preventDefault();
          onClose?.();
          return true;
        default:
          return false;
      }
    };

    const targetElement = editor?.view.dom;
    if (!targetElement) {
      return undefined;
    }

    targetElement.addEventListener('keydown', handleKeyboardNavigation, true);
    return () => {
      targetElement.removeEventListener('keydown', handleKeyboardNavigation, true);
    };
  }, [editor, items, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return {
    selectedIndex: items.length ? selectedIndex : undefined
  };
}
