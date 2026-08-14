---
title: 自适应高度
order: 8
---

# 自适应高度

默认 `height={500}`，内容超出后在编辑器内部滚动。嵌在抽屉、详情面板、表单里时，传 `height="auto"` 让编辑器随内容撑开，由外层容器滚动。

```tsx | pure
<ATiptap height="auto" renderMode="custom" bordered={false} />
<ANotion height="auto" />
```

<code src="../../example/auto-height.tsx"></code>
