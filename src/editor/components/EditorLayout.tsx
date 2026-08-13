import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import { EditorContextProvider, useEditorContext } from '../context/EditorContext';

import type { ATiptapEditor } from '../ATiptapEditor';

const Layout: React.FC<
  PropsWithChildren<{
    className?: string;
    style?: React.CSSProperties;
  }>
> = ({ style, className, children }) => {
  const { fullscreen } = useEditorContext();
  const cls = classNames('atiptap-editor', { 'atiptap-editor--fullscreen': fullscreen }, className);

  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
};

export const EditorLayout: React.FC<
  PropsWithChildren<{
    editor: ATiptapEditor | null;
    className?: string;
    style?: React.CSSProperties;
  }>
> = ({ editor, className, style, children }) => {
  return (
    <EditorContextProvider editor={editor}>
      <Layout style={style} className={className}>
        {children}
      </Layout>
    </EditorContextProvider>
  );
};
