import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { Pin, PinOff } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findScrollContainer, onScrollParents, scrollElementIntoContainer } from './scroll-parents';

export type OutlineMode = 'float' | 'fixed';

export type OutlineHeading = {
  pos: number;
  level: number;
  text: string;
};

const PLACEHOLDER_TICKS = 3;

const collectHeadings = (editor: Editor): OutlineHeading[] => {
  const headings: OutlineHeading[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'heading') {
      return;
    }
    headings.push({
      pos,
      level: Number(node.attrs.level) || 1,
      text: node.textContent.trim()
    });
  });
  return headings;
};

const getActivePos = (headings: OutlineHeading[], from: number) => {
  let activePos = -1;
  for (const item of headings) {
    if (item.pos <= from) {
      activePos = item.pos;
    } else {
      break;
    }
  }
  return activePos;
};

const jumpToHeading = (editor: Editor, pos: number) => {
  editor
    .chain()
    .focus()
    .setTextSelection(pos + 1)
    .run();
  const dom = editor.view.nodeDOM(pos);
  if (dom instanceof HTMLElement) {
    scrollElementIntoContainer(dom);
  }
};

export type DocumentOutlineProps = {
  editor: Editor;
  /** @default "float" */
  mode?: OutlineMode;
  onModeChange?: (mode: OutlineMode) => void;
};

/** 目录：左侧刻度条。悬浮时悬停展开，固定时常显不自动隐藏。视觉走 antd。 */
export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  editor,
  mode = 'float',
  onModeChange
}) => {
  const isFloat = mode === 'float';
  const outlineRef = useRef<HTMLElement>(null);
  const lastClickTimeRef = useRef<number | null>(null);
  const [manualActivePos, setManualActivePos] = useState<number | null>(null);
  const [scrollActivePos, setScrollActivePos] = useState<number | null>(null);

  const state = useEditorState({
    editor,
    selector: ctx => {
      if (!ctx.editor) {
        return { headings: [] as OutlineHeading[], selectionPos: -1 };
      }
      const headings = collectHeadings(ctx.editor);
      return {
        headings,
        selectionPos: getActivePos(headings, ctx.editor.state.selection.from)
      };
    }
  });

  const minLevel = useMemo(() => {
    if (!state.headings.length) {
      return 1;
    }
    return Math.min(...state.headings.map(item => item.level));
  }, [state.headings]);

  const activePos = useMemo(() => {
    if (manualActivePos !== null) {
      return manualActivePos;
    }
    if (scrollActivePos !== null) {
      return scrollActivePos;
    }
    return state.selectionPos;
  }, [manualActivePos, scrollActivePos, state.selectionPos]);

  const handleItemClick = useCallback(
    (pos: number) => {
      setManualActivePos(pos);
      lastClickTimeRef.current = Date.now();
      jumpToHeading(editor, pos);
    },
    [editor]
  );

  const toggleMode = useCallback(() => {
    onModeChange?.(isFloat ? 'fixed' : 'float');
  }, [isFloat, onModeChange]);

  useEffect(() => {
    const outlineEl = outlineRef.current;
    if (!outlineEl) {
      return;
    }

    const scrollContainer = findScrollContainer(outlineEl);

    const computeScrollActivePos = () => {
      const triggerOffset = 28;
      const triggerLine =
        scrollContainer instanceof Window
          ? triggerOffset
          : scrollContainer.getBoundingClientRect().top + triggerOffset;
      let nextPos: number | null = null;

      for (const item of state.headings) {
        const dom = editor.view.nodeDOM(item.pos);
        if (!(dom instanceof HTMLElement)) {
          continue;
        }
        if (dom.getBoundingClientRect().top <= triggerLine) {
          nextPos = item.pos;
        } else {
          break;
        }
      }

      setScrollActivePos(nextPos);
    };

    const handleScroll = () => {
      const lastClickTime = lastClickTimeRef.current;
      if (lastClickTime && Date.now() - lastClickTime < 500) {
        return;
      }
      if (manualActivePos !== null) {
        setManualActivePos(null);
      }
      computeScrollActivePos();
    };

    computeScrollActivePos();
    return onScrollParents(outlineEl, handleScroll);
  }, [editor, manualActivePos, state.headings]);

  const renderItems = () => {
    if (!state.headings.length) {
      return <div className="atiptap-notion-outline__empty">暂无标题目录</div>;
    }

    return (
      <ul className="atiptap-notion-outline__list">
        {state.headings.map(item => {
          const depth = item.level - minLevel + 1;
          return (
            <li key={item.pos}>
              <button
                type="button"
                className="atiptap-notion-outline__item"
                data-active={item.pos === activePos ? 'true' : 'false'}
                data-depth={depth}
                style={{ '--atiptap-outline-depth': depth } as React.CSSProperties}
                title={item.text || '无标题'}
                onMouseDown={event => event.preventDefault()}
                onClick={() => handleItemClick(item.pos)}
              >
                <span className="atiptap-notion-outline__item-text">{item.text || '无标题'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderTicks = () => {
    const tickItems = state.headings.length
      ? state.headings.map(item => ({
          key: item.pos,
          depth: item.level - minLevel + 1,
          active: item.pos === activePos
        }))
      : Array.from({ length: PLACEHOLDER_TICKS }, (_, index) => ({
          key: index,
          depth: 1,
          active: false
        }));

    return (
      <div className="atiptap-notion-outline__rail">
        {tickItems.map(item => (
          <div
            key={item.key}
            className="atiptap-notion-outline__tick"
            data-active={item.active ? 'true' : 'false'}
            data-depth={item.depth}
            style={{ '--atiptap-outline-depth': item.depth } as React.CSSProperties}
          />
        ))}
      </div>
    );
  };

  const pinButton = onModeChange ? (
    <button
      type="button"
      className="atiptap-notion-outline__pin"
      aria-label={isFloat ? '固定目录' : '取消固定目录'}
      title={isFloat ? '固定（不自动隐藏）' : '取消固定'}
      onPointerDown={event => {
        event.preventDefault();
        event.stopPropagation();
        toggleMode();
      }}
      onKeyDown={event => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        toggleMode();
      }}
    >
      {isFloat ? <Pin size={14} /> : <PinOff size={14} />}
    </button>
  ) : null;

  return (
    <nav
      ref={outlineRef}
      className={`atiptap-notion-outline atiptap-notion-outline--side atiptap-notion-outline--${isFloat ? 'float' : 'fixed'}`}
      aria-label="文档目录"
    >
      <div className="atiptap-notion-outline__sticky">
        {renderTicks()}
        <div className="atiptap-notion-outline__nav">
          <div className="atiptap-notion-outline__popover">
            <span className="atiptap-notion-outline__title">目录</span>
            {pinButton}
            {renderItems()}
          </div>
        </div>
      </div>
    </nav>
  );
};
