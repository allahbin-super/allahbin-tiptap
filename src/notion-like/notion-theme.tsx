import classNames from 'classnames';
import React, { createContext, useContext, useMemo } from 'react';

/** 编辑器根节点与浮层共用，便于一条选择器覆盖主题 */
export const NOTION_THEME_CLASS = 'atiptap-theme';

const NotionThemeContext = createContext<React.CSSProperties | undefined>(undefined);

export function pickCssCustomProperties(
  style?: React.CSSProperties
): React.CSSProperties | undefined {
  if (!style) {
    return undefined;
  }
  const vars: Record<string, string | number> = {};
  let has = false;
  Object.entries(style).forEach(([key, value]) => {
    if (key.startsWith('--') && value !== undefined && value !== null && value !== false) {
      vars[key] = value as string | number;
      has = true;
    }
  });
  return has ? (vars as React.CSSProperties) : undefined;
}

/** 合并 cssVars 与 style 上的 `--*`，style 中的变量优先 */
export function mergeNotionThemeVars(
  cssVars?: React.CSSProperties,
  style?: React.CSSProperties
): React.CSSProperties | undefined {
  const fromStyle = pickCssCustomProperties(style);
  if (!cssVars && !fromStyle) {
    return undefined;
  }
  return { ...cssVars, ...fromStyle };
}

export const NotionThemeProvider: React.FC<{
  value?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <NotionThemeContext.Provider value={value}>{children}</NotionThemeContext.Provider>
);

export function useNotionThemeStyle(style?: React.CSSProperties): React.CSSProperties | undefined {
  const cssVars = useContext(NotionThemeContext);
  if (!cssVars) {
    return style;
  }
  return { ...cssVars, ...style };
}

export function useNotionThemeClassName(className?: string) {
  return classNames(NOTION_THEME_CLASS, className);
}

/** 挂到 portal 根节点：带 `atiptap-theme`，并写入当前编辑器的 CSS 变量 */
export function useNotionThemeRootProps(className?: string, style?: React.CSSProperties) {
  const themeClassName = useNotionThemeClassName(className);
  const themeStyle = useNotionThemeStyle(style);
  return useMemo(
    () => ({ className: themeClassName, style: themeStyle }),
    [themeClassName, themeStyle]
  );
}
