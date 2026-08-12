import type { TideEditorOptions } from './TideEditor';
import { TideEditor } from './TideEditor';

import type { DependencyList } from 'react';
import { useEffect, useState } from 'react';

export * from './components/EditorContent';
export * from './components/EditorLayout';
export * from './components/EditorMenu';

export * from './context/EditorContext';

export * from './EditorRender';
export * from './TideEditor';

export const useEditor: (
  options: Partial<TideEditorOptions>,
  deps?: DependencyList
) => TideEditor | null = (options, deps = []) => {
  const [editor, setEditor] = useState<TideEditor | null>(null);

  useEffect(() => {
    const instance = new TideEditor(options);
    setEditor(instance);

    return () => {
      instance.destroy();
      setEditor(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return editor;
};

/**
 * 数据格式
 */
export interface ITiptapJson {
  type: string | 'doc';
  content: IContent[];
  contentJsx: any;
  key?: string;
}

export interface IContent {
  type: string;
  attrs: {
    level: number;
    indent: number;
    textAlign: any;
    src: any;
    title: any;
    height: any;
    width: any;
    align: any;
  };
  key?: string;
  content: IContent2[];
}

export interface IContent2 {
  key?: string;
  type: string;
  text?: string;
  marks?: IMark[];
  data_id?: string;
  content: IMark[];
}

export interface IMark {
  type: string;
  text: string;
  attrs?: {
    href: string;
    target: string;
    textAlign: string;
    indent?: number;
    rowspan: number;
    colspan: number;
    colwidth: number[];
  };
  content: IMark[];
}
