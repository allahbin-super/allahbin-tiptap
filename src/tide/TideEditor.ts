import type { Content, EditorOptions, JSONContent } from '@tiptap/core';
import { Editor } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import type { Plugin, Transaction } from '@tiptap/pm/state';
import React from 'react';
import { mdTailToHtml, mdTitleToHtml, mdWenhaoToHtml } from '../markdown';

export interface EditorEvents {
  beforeCreate: { editor: TideEditor };
  create: { editor: TideEditor };
  update: { editor: TideEditor; transaction: Transaction };
  selectionUpdate: { editor: TideEditor; transaction: Transaction };
  transaction: { editor: TideEditor; transaction: Transaction };
  focus: { editor: TideEditor; event: FocusEvent; transaction: Transaction };
  blur: { editor: TideEditor; event: FocusEvent; transaction: Transaction };
  destroy: void;
}

export interface TideEditorOptions
  extends Omit<
    EditorOptions,
    | 'onBeforeCreate'
    | 'onCreate'
    | 'onUpdate'
    | 'onSelectionUpdate'
    | 'onTransaction'
    | 'onFocus'
    | 'onBlur'
    | 'onDestroy'
  > {
  readOnlyEmptyView?: React.ReactNode;
  readOnlyShowMenu?: boolean;
  menuEnableUndoRedo?: boolean;
  menuEnableFullscreen?: boolean;
  fullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean, editor: TideEditor) => void;
  onReady?: (editor: TideEditor) => void;
  onChange?: (doc: JSONContent, editor: TideEditor) => void;

  // original editor options
  onBeforeCreate: (props: EditorEvents['beforeCreate']) => void;
  onCreate: (props: EditorEvents['create']) => void;
  onUpdate: (props: EditorEvents['update']) => void;
  onSelectionUpdate: (props: EditorEvents['selectionUpdate']) => void;
  onTransaction: (props: EditorEvents['transaction']) => void;
  onFocus: (props: EditorEvents['focus']) => void;
  onBlur: (props: EditorEvents['blur']) => void;
  onDestroy: (props: EditorEvents['destroy']) => void;
}

export class TideEditor extends Editor {
  public readOnlyEmptyView?: React.ReactNode;

  public readOnlyShowMenu?: boolean;

  public menuEnableUndoRedo?: boolean;

  public menuEnableFullscreen?: boolean;

  public fullscreen: boolean;

  private readonly onFullscreenChange?: TideEditorOptions['onFullscreenChange'];

  constructor(options: Partial<TideEditorOptions>) {
    const {
      readOnlyEmptyView,
      readOnlyShowMenu = false,
      menuEnableUndoRedo = true,
      menuEnableFullscreen = true,
      fullscreen = false,
      onFullscreenChange,
      onReady,
      onChange,
      editorProps: customEditorProps,
      ...originalEditorOptions
    } = options;

    super({
      extensions: [Document, Paragraph, Text],
      ...originalEditorOptions,
      editorProps: {
        attributes: {
          spellCheck: 'false'
        },
        ...(customEditorProps || {})
      },
      // @ts-ignore
      onCreate: (props: EditorEvents['create']) => {
        const { state, view } = props.editor;
        // 调整 suggestion 插件的优先级 (解决 # 与 heading input rule 冲突的问题)
        if (state.plugins.length > 0) {
          const restOfPlugins: Plugin[] = [];
          const suggestionPlugins: Plugin[] = [];
          state.plugins.forEach(plugin => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: The `Plugin` type does not include `key`
            if ((plugin.key as string).includes('Suggestion')) {
              suggestionPlugins.push(plugin);
            } else {
              restOfPlugins.push(plugin);
            }
          });
          view.updateState(
            state.reconfigure({
              plugins: [...suggestionPlugins, ...restOfPlugins]
            })
          );
        }
        originalEditorOptions.onCreate?.(props);
        onReady?.(props.editor);
      },
      // @ts-ignore
      onUpdate: (props: EditorEvents['update']) => {
        originalEditorOptions.onUpdate?.(props);
        onChange?.(props.editor.getJSON(), props.editor);
      }
    });

    this.readOnlyEmptyView = readOnlyEmptyView;
    this.readOnlyShowMenu = readOnlyShowMenu;
    this.menuEnableUndoRedo = menuEnableUndoRedo;
    this.menuEnableFullscreen = menuEnableFullscreen;
    this.fullscreen = fullscreen;
    this.onFullscreenChange = onFullscreenChange;
  }

  public setFullscreen(fullscreen: boolean) {
    this.fullscreen = fullscreen;
    this.onFullscreenChange?.(fullscreen, this);
    (this as any).emit('update', { editor: this, transaction: this.state.tr });

    if (fullscreen) {
      this.commands.focus(this.options.autofocus);
    }
  }

  public setContent(content: Content, emitUpdate?: boolean): boolean {
    // 如果是字符串，就转换下
    if (typeof content === 'string') {
      content = mdWenhaoToHtml(content);
      content = mdTailToHtml(content);
      content = mdTitleToHtml(content);
    }
    return this.commands.setContent(content, { emitUpdate });
  }

  public getMarkdown(): string {
    return (this.storage as any).markdown?.getMarkdown?.() || '';
  }

  public get isReadOnly(): boolean {
    return !this.isEditable;
  }
}
