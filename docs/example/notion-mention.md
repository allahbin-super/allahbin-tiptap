---
title: @提及
order: 8
---

# @提及（Mention）

ANotion 内置行内 `@` 提及节点。传入 `mentionItems` 后会注册 `mention` 节点，并在输入 `@` 时弹出候选人菜单。

## 约定

- **优先 `mode="json"`**：mention 是自定义 inline atom，`md` 模式下无 Markdown 序列化会丢块。
- `mentionItems` 可为数组，或 `( { query } ) => items | Promise<items>`。
- 选中后写入 `{ type: 'mention', attrs: { id, label } }`，并在光标后补一个空格。
- 只读侧用 `TiptapRender` 默认渲染 `@label` 芯片。

## 最小用法

```tsx | pure
import { ANotion, type MentionSuggestionItem } from '@allahbin/tiptap';

const users: MentionSuggestionItem[] = [
  { id: 'u1', label: '张三', subtext: '研发' },
  { id: 'u2', label: '李四', subtext: '产品' }
];

<ANotion
  mode="json"
  value={json}
  onChange={setJson}
  mentionItems={({ query }) =>
    users.filter(u => u.label.includes(query) || u.id.includes(query))
  }
/>
```

完整可运行示例见下方。

<code src="../../example/notion-mention.tsx"></code>
