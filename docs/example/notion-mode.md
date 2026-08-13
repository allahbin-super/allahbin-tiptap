---
title: 数据模式
order: 4
---

# 数据模式（html / md / json）

与完整编辑器一致：支持 `mode="html" | "md" | "json"` 赋值，以及三格式互转预览。

```tsx | pure
<ANotion mode="md" value={md} onChange={setMd} />
<ANotion mode="html" value={html} onChange={setHtml} />
<ANotion mode="json" value={json} onChange={setJson} />
```

<code src="../../example/notion-mode.tsx"></code>
