---
title: ANotion
---

# ANotion

Notion 风格块编辑器，和 `ATiptap` 公文编辑器分开使用。输入 `/` 插入内容，划词弹出格式栏，左侧句柄可拖拽重排。默认按 Markdown 读写。

```tsx | pure
import { ANotion } from '@allahbin/tiptap';

<ANotion value={markdown} onChange={setMarkdown} />
```

<code src="../../example/notion.tsx"></code>
