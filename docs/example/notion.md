---
title: ANotion
order: 3
---

# ANotion

Notion 风格块编辑器，和 `ATiptap` 公文编辑器分开使用。默认带边框和头部快捷操作区（对齐 [Tiptap Simple Editor](https://tiptap.dev/docs/ui-components/templates/simple-editor) 的能力，视觉走 antd）。输入 `/` 插入内容，划词弹出格式栏，左侧句柄可拖拽重排。默认按 Markdown 读写。

```tsx | pure
import { ANotion, mockImgUploader } from '@allahbin/tiptap';

<ANotion value={markdown} onChange={setMarkdown} imageUploader={mockImgUploader} />

{/* 纯块编辑：关掉头部操作区和边框 */}
<ANotion showToolbar={false} bordered={false} value={markdown} onChange={setMarkdown} />
```

## 能力

- **头部操作区**：可编辑时默认显示，只读模式自动隐藏；也可用 `showToolbar={false}` 关掉。含撤销/重做、标题、列表、引用、代码块、加粗/斜体/下划线/高亮/链接、对齐、图片、表格
- **边框**：`bordered` 控制外框，默认开启
- **划词栏**：加粗 / 斜体 / 下划线 / 删除线 / 行内代码 / 高亮 / 链接 Popover / 左中右对齐
- **图片**：斜杠「图片」插入上传占位；粘贴或拖放（5MB 限制）；选中图片出现浮动栏（对齐、图注、替换、下载、删除）
- **表格**：斜杠插入 3×3；悬停出行 / 列手柄（插入、移动、排序、配色、对齐）；选中单元格可合并拆分与四角扩选；底部 / 右侧可加行加列；可拖拽列宽
- **块操作**：转为标题/列表/引用/代码块/表格/分割线；复制 Markdown；`Mod+D` 创建副本；窄屏上移 / 下移；表格块可适应宽度 / 清空
- **代码块**：lowlight 语法高亮；复制内容为 Markdown

更多示例见侧边栏：[数据模式](./notion-mode)、[表单联动](./notion-form)。

## 基础用法

<code src="../../example/notion.tsx"></code>
