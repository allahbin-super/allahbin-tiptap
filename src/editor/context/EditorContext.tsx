import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import type { ATiptapEditor } from '../ATiptapEditor';

export type EditorContextType = {
  editor: ATiptapEditor | null;
  fullscreen: boolean;
  setFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
  /** 选区 / 文档变化时递增，驱动工具栏 isActive 刷新 */
  editorStateVersion: number;
};

// @ts-ignore
export const EditorContext = createContext<EditorContextType>(null);

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (context === null) {
    throw new Error('useEditorContext must be used within a EditorContextProvider');
  }
  return context;
};

export const EditorContextProvider: React.FC<
  PropsWithChildren<{ editor: ATiptapEditor | null }>
> = ({ editor, children }) => {
  const [editable, setEditable] = useState(!!editor?.isEditable);
  const [fullscreen, setFullscreen] = useState(!!editor?.fullscreen);
  const [editorStateVersion, setEditorStateVersion] = useState(0);

  const value = React.useMemo(() => {
    return { editable, fullscreen, setEditable, setFullscreen, editor, editorStateVersion };
  }, [editable, fullscreen, editor, editorStateVersion]);

  useEffect(() => {
    if (!editor) return;

    setEditable(!!editor?.isEditable);
    setFullscreen(!!editor?.fullscreen);

    const updateHandle = () => {
      setEditable(editor.isEditable);
      setFullscreen(editor.fullscreen);
      setEditorStateVersion(v => v + 1);
    };
    editor.on('update', updateHandle);
    editor.on('selectionUpdate', updateHandle);
    return () => {
      editor.off('update', updateHandle);
      editor.off('selectionUpdate', updateHandle);
    };
  }, [editor]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
