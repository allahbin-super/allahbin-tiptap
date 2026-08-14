import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { CaseSensitive, ChevronDown, ChevronUp, Regex, Search, WholeWord, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ToolbarIconButton: React.FC<{
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ title, active, disabled, onClick, children }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    className="atiptap-notion-toolbar__btn"
    data-active={active ? 'true' : 'false'}
    onMouseDown={event => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </button>
);

export const SearchReplacePanel: React.FC<{
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ editor, open, onOpenChange }) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const state = useEditorState({
    editor,
    selector: ctx => {
      const storage = ctx.editor.storage.findAndReplace;
      if (!storage) {
        return null;
      }
      return {
        caseSensitive: storage.caseSensitive,
        useRegex: storage.useRegex,
        wholeWord: storage.wholeWord,
        resultCount: storage.results.length,
        currentIndex: storage.currentIndex,
        editable: ctx.editor.isEditable
      };
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    if (searchTerm) {
      editor.commands.setSearchTerm(searchTerm);
    }
    editor.commands.setReplaceTerm(replaceTerm);
    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.key.toLowerCase() !== 'f') {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.('.atiptap-notion')) {
        return;
      }
      event.preventDefault();
      onOpenChange(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    const wrap = buttonRef.current?.closest('.atiptap-notion-toolbar-wrap');
    setPortalRoot(wrap instanceof HTMLElement ? wrap : null);
  }, []);

  if (!state) {
    return null;
  }

  const resultLabel =
    state.resultCount === 0 ? '0 / 0' : `${(state.currentIndex ?? 0) + 1} / ${state.resultCount}`;
  const canNavigate = state.resultCount > 0;
  const canReplace = state.editable && canNavigate;

  const close = () => {
    editor.commands.clearSearch();
    onOpenChange(false);
  };

  const applySearch = (value: string) => {
    setSearchTerm(value);
    if (!value) {
      editor.commands.clearSearch();
      return;
    }
    editor.commands.setSearchTerm(value);
  };

  const panel = open ? (
    <div
      className="atiptap-notion-search"
      role="dialog"
      aria-label="查找和替换"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
        }
      }}
    >
      <div className="atiptap-notion-search__row">
        <input
          ref={searchRef}
          type="text"
          className="atiptap-notion-search__input"
          placeholder="查找"
          aria-label="查找"
          value={searchTerm}
          onChange={event => applySearch(event.target.value)}
          onKeyDown={event => {
            if (event.key !== 'Enter') {
              return;
            }
            event.preventDefault();
            if (event.shiftKey) {
              editor.commands.goToPreviousResult();
            } else {
              editor.commands.goToNextResult();
            }
          }}
        />
        <span className="atiptap-notion-search__count" aria-live="polite">
          {resultLabel}
        </span>
        <ToolbarIconButton
          title="上一个"
          disabled={!canNavigate}
          onClick={() => editor.commands.goToPreviousResult()}
        >
          <ChevronUp size={16} />
        </ToolbarIconButton>
        <ToolbarIconButton
          title="下一个"
          disabled={!canNavigate}
          onClick={() => editor.commands.goToNextResult()}
        >
          <ChevronDown size={16} />
        </ToolbarIconButton>
        <ToolbarIconButton title="关闭" onClick={close}>
          <X size={16} />
        </ToolbarIconButton>
      </div>
      <div className="atiptap-notion-search__row">
        <input
          type="text"
          className="atiptap-notion-search__input"
          placeholder="替换"
          aria-label="替换"
          value={replaceTerm}
          onChange={event => {
            setReplaceTerm(event.target.value);
            editor.commands.setReplaceTerm(event.target.value);
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              editor.commands.replace();
            }
          }}
        />
      </div>
      <div className="atiptap-notion-search__row">
        <ToolbarIconButton
          title="区分大小写"
          active={state.caseSensitive}
          onClick={() => editor.commands.setCaseSensitive(!state.caseSensitive)}
        >
          <CaseSensitive size={16} />
        </ToolbarIconButton>
        <ToolbarIconButton
          title="全词匹配"
          active={state.wholeWord}
          disabled={state.useRegex}
          onClick={() => editor.commands.setWholeWord(!state.wholeWord)}
        >
          <WholeWord size={16} />
        </ToolbarIconButton>
        <ToolbarIconButton
          title="正则表达式"
          active={state.useRegex}
          onClick={() => editor.commands.setUseRegex(!state.useRegex)}
        >
          <Regex size={16} />
        </ToolbarIconButton>
        <span className="atiptap-notion-search__spacer" />
        <button
          type="button"
          className="atiptap-notion-search__action"
          disabled={!canReplace}
          onMouseDown={event => event.preventDefault()}
          onClick={() => editor.commands.replace()}
        >
          替换
        </button>
        <button
          type="button"
          className="atiptap-notion-search__action"
          disabled={!canReplace}
          onMouseDown={event => event.preventDefault()}
          onClick={() => editor.commands.replaceAll()}
        >
          全部替换
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <span ref={buttonRef} style={{ display: 'inline-flex' }}>
        <ToolbarIconButton
          title="搜索 (Ctrl+F)"
          active={open}
          onClick={() => {
            if (open) {
              close();
              return;
            }
            onOpenChange(true);
          }}
        >
          <Search size={16} />
        </ToolbarIconButton>
      </span>
      {panel && portalRoot ? createPortal(panel, portalRoot) : panel}
    </>
  );
};
