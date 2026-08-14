---
title: 自定义节点
order: 7
---

# 自定义节点扩展

ANotion 支持把业务自己的 Tiptap Node / Extension 注入编辑器，并接到斜杠菜单、工具栏、拖拽句柄和只读渲染。

## 能力一览

| API | 作用 |
| --- | --- |
| `extraExtensions` | 追加到内置扩展之后，注册到 schema（NodeView 随 extension 生效） |
| `slashItems` | 追加 `/` 菜单项（内置在前） |
| `toolbarExtra` | 工具栏额外按钮（图片/文件/表格之后、搜索之前） |
| `getBlockIcon` | 拖拽句柄块图标；返回非 `null` 时覆盖内置映射 |
| `blockMenuExtra` | 块菜单额外项（「转为」与图片/表格专属项之后） |
| `children` | 逃生舱：自建 BubbleMenu 等，挂在 `EditorContent` 旁 |
| `TiptapRender` 的 `nodeRenderers` | 只读 JSON 按 `type` 自定义渲染 |

## 约定

- **不要**与内置节点重名：`file` / `fileUpload` / `image` / `imageUpload` / `table` 等。
- `extraExtensions` 引用变化会**重建**编辑器，请用 `useMemo` 等保持稳定。
- 默认 `mode="md"` 时，自定义块若未实现 Markdown 序列化，回写会丢块。**自定义块优先 `mode="json"`**。

## 最小用法

```tsx | pure
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ANotion, type SlashSuggestionItem } from '@allahbin/tiptap';
import { Info } from 'lucide-react';

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  // parseHTML / renderHTML / addNodeView / addCommands ...
});

const slashItems: SlashSuggestionItem[] = [
  {
    title: '提示块',
    keywords: ['callout', '提示'],
    badge: Info,
    group: '自定义',
    onSelect: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'callout',
        content: [{ type: 'paragraph' }]
      }).run();
    }
  }
];

<ANotion
  mode="json"
  value={json}
  onChange={setJson}
  extraExtensions={[Callout]}
  slashItems={slashItems}
  toolbarExtra={editor => (
    <button type="button" className="atiptap-notion-toolbar__btn" onClick={() => { /* insert */ }}>
      <Info size={16} />
    </button>
  )}
  getBlockIcon={node => (node.type.name === 'callout' ? Info : null)}
/>
```

## 只读渲染

```tsx | pure
import { TiptapRender } from '@allahbin/tiptap';

const render = new TiptapRender(json, {
  nodeRenderers: {
    callout: (item, { renderContent }) => (
      <aside key={item.key}>{renderContent(item.content)}</aside>
    )
  }
});
```

完整可运行示例见下方（含 NodeView、斜杠、工具栏、句柄菜单与只读预览）。

<code src="../../example/notion-extend.tsx"></code>
