---
title: ANotion
---

# ANotion

Notion 风格块编辑器，和 `ATiptap` 公文编辑器分开使用。输入 `/` 插入内容，划词弹出格式栏，左侧句柄可拖拽重排。默认按 Markdown 读写。

```tsx | pure
import { ANotion, mockImgUploader } from '@allahbin/tiptap';

<ANotion value={markdown} onChange={setMarkdown} imageUploader={mockImgUploader} />
```

## 能力

- **划词栏**：加粗 / 斜体 / 下划线 / 删除线 / 行内代码 / 高亮 / 链接 Popover / 左中右对齐
- **图片**：斜杠「图片」插入上传占位；粘贴或拖放（5MB 限制）；选中图片出现浮动栏（对齐、图注、替换、下载、删除）
- **表格**：斜杠插入 3×3；悬停出行 / 列手柄（插入、移动、排序、配色、对齐）；选中单元格可合并拆分与四角扩选；底部 / 右侧可加行加列；可拖拽列宽
- **块操作**：转为标题/列表/引用/代码块/表格/分割线；复制 Markdown；`Mod+D` 创建副本；窄屏上移 / 下移；表格块可适应宽度 / 清空
- **代码块**：lowlight 语法高亮；复制内容为 Markdown

<code src="../../example/notion.tsx"></code>
