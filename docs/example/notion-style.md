---
title: 样式定制
order: 8
---

# 样式定制

ANotion 用全局 class（不是 CSS Modules）和 `--atiptap-*` 变量。业务可以覆盖 CSS，不必改包内源码。视觉对齐 Ant Design 5 默认主题，不要改回 Notion 暖灰。

## 覆盖方式（由易到难）

### 1. 改 CSS 变量（推荐）

默认 token 写在 `:where(:root)` 上，**特异度为 0**。业务写在 `:root` 或 `.atiptap-theme` 上即可盖住，不必拼选择器优先级。

```css
:root {
  --atiptap-color-primary: #13c2c2;
  --atiptap-border-radius: 4px;
}
```

同一页两套主题时，用 `cssVars`（会同步到挂到 `document.body` 的浮层）：

```tsx | pure
<ANotion
  cssVars={{
    '--atiptap-color-primary': '#13c2c2',
    '--atiptap-color-primary-hover': '#36cfc9',
    '--atiptap-color-primary-bg': '#e6fffb'
  }}
/>
```

也可以把 `--*` 写在 `style` 上，效果相同；与 `cssVars` 同名时 **`style` 优先**。

### 2. 覆盖组件 class

class 前缀固定为 `atiptap-notion-`，根节点额外带 `atiptap-theme`。浮层（斜杠菜单、划词栏、块菜单、表格手柄）同样带 `atiptap-theme`。

```css
.atiptap-notion-toolbar__btn {
  height: 28px;
}

.atiptap-notion-slash-item[data-active='true'] {
  background: var(--atiptap-color-primary-bg);
}
```

请让业务样式在包样式**之后**加载。dropcursor 等少数规则用了 `!important`，覆盖时也要加。

### 3. 自建浮层

`children` 里自己挂到 `body` 的菜单，需要带上主题 class 和当前变量，否则吃不到 `cssVars`：

```tsx | pure
import { useNotionThemeRootProps } from '@allahbin/tiptap';

const theme = useNotionThemeRootProps('my-menu');
<div {...theme}>...</div>
```

## Token

| 变量 | 默认 | 用途 |
| --- | --- | --- |
| `--atiptap-color-primary` | `#1677ff` | 主色、链接、激活、拖放线 |
| `--atiptap-color-primary-hover` | `#4096ff` | 主色悬停 |
| `--atiptap-color-primary-bg` | `#e6f4ff` | 浅主色底 |
| `--atiptap-color-primary-border` | `#91caff` | 主色描边 |
| `--atiptap-color-primary-selection` | `color-mix(... 8%)` | 表格选中格 |
| `--atiptap-color-error` | `#ff4d4f` | 危险操作、上传错误 |
| `--atiptap-color-error-bg` | `#fff2f0` | 危险底 |
| `--atiptap-color-text` | `rgba(0,0,0,.88)` | 正文 |
| `--atiptap-color-text-secondary` | `rgba(0,0,0,.65)` | 次要文字 |
| `--atiptap-color-text-tertiary` | `rgba(0,0,0,.45)` | 占位、目录标题 |
| `--atiptap-color-text-quaternary` | `rgba(0,0,0,.25)` | 禁用 |
| `--atiptap-color-text-light` | `#fff` | 主色底上的字/图标 |
| `--atiptap-color-border` | `#d9d9d9` | 边框 |
| `--atiptap-color-border-secondary` | `#f0f0f0` | 浅边框 |
| `--atiptap-color-split` | `rgba(5,5,5,.06)` | 分割线 |
| `--atiptap-color-bg` | `#fff` | 容器、菜单底 |
| `--atiptap-color-bg-layout` | `#f5f5f5` | 布局底 |
| `--atiptap-color-bg-spotlight` | `#fafafa` | 浅底 |
| `--atiptap-color-bg-inverse` | `#000` | 视频块底 |
| `--atiptap-color-fill` | `rgba(0,0,0,.04)` | 填充、hover |
| `--atiptap-color-search-bg` | `#fff1b8` | 查找高亮 |
| `--atiptap-color-search-current` | `#ffc53d` | 当前查找项 |
| `--atiptap-border-radius` | `6px` | 控件圆角 |
| `--atiptap-border-radius-sm` | `4px` | 选项圆角 |
| `--atiptap-border-radius-lg` | `8px` | 菜单圆角 |
| `--atiptap-control-height` | `32px` | 控件高度 |
| `--atiptap-control-height-sm` | `24px` | 小控件 |
| `--atiptap-font-size` | `14px` | 菜单/工具栏字号 |
| `--atiptap-font-size-sm` | `12px` | 辅助字号 |
| `--atiptap-box-shadow` | antd Dropdown 阴影 | 浮层阴影 |
| `--atiptap-motion` | `all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)` | 过渡 |

编辑区正文默认 `16px`，写在 `.atiptap-notion` 上，不是 token。要改正文大小请覆盖 `.atiptap-notion`。

## 常用 class

| class | 区域 |
| --- | --- |
| `.atiptap-notion` / `.atiptap-theme` | 根 / 浮层主题挂载点 |
| `.atiptap-notion-toolbar` / `__btn` | 头部操作区 |
| `.atiptap-notion-search` | 查找替换 |
| `.atiptap-notion-outline` | 目录 |
| `.atiptap-notion-prosemirror` | 正文 |
| `.atiptap-notion-slash-menu` / `-item` | 斜杠菜单 |
| `.atiptap-notion-bubble` / `__btn` | 划词栏 |
| `.atiptap-notion-drag` / `-menu` | 块句柄 / 块菜单 |
| `.atiptap-notion-table-handle` | 行列手柄 |
| `.atiptap-notion-file` / `-upload` | 文件块 / 上传占位 |

根节点还会按 props 加修饰 class：`--bordered`、`--toolbar`、`--outline`、`--outline-float`、`--outline-fixed`。

## 盖不住的部分

- **划词高亮色板**（黄/绿/蓝/红/紫）写入文档 JSON，不是皮肤 token。
- **代码块配色**来自 `highlight.js` 的 `github.css`。
- **浮层坐标**由 Floating UI 写成 inline `top/left`，不要用 CSS 改位置。
- 没有 `prefixCls` / ConfigProvider；class 名不可换。

节点、斜杠项、工具栏按钮的功能扩展见 [自定义节点](./notion-extend)。
