import React, { useState } from 'react';
import ANotion from '../src/ANotion';
import { mockImgUploader } from '../src/ATiptapEdit';

const INITIAL_MARKDOWN = `# Notion + Markdown

输入 \`/\` 可以插入标题、列表、引用、代码块、图片和表格。划词后可设置下划线、高亮和对齐。

## 列表示例

- 无序列表
- 支持 Markdown 粘贴

1. 有序列表
2. 拖拽左侧句柄可调整块顺序

- [ ] 任务未完成
- [x] 任务已完成

> 划词后会出现加粗、斜体、下划线、高亮、链接和对齐。

\`\`\`js
console.log('hello notion');
\`\`\`

## 表格

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 图片 | 已支持 | 斜杠插入占位上传，选中后有对齐 / 图注 / 替换 / 下载 |
| 表格 | 已支持 | 悬停出行列表手柄，可合并拆分、加行加列、拖拽列宽 |

粘贴图片，或输入 \`/图片\` 插入。选中图片会出现浮动操作栏。表格悬停后左侧/上方会出现行列表手柄。
`;

const ANotionDemo = () => {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);

  return (
    <div style={{ padding: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
      <h2 style={{ margin: '0 0 8px', fontWeight: 600 }}>ANotion</h2>
      <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 16 }}>
        Notion 风格块编辑器，和 ATiptap 公文编辑器分开使用。支持斜杠命令、划词菜单、块拖拽，默认以
        Markdown 回传。选中图片有浮动栏；表格悬停出行列表手柄。窄屏下用上下箭头移动块。
      </p>
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          overflow: 'visible',
          minHeight: 420,
          background: '#fff'
        }}
      >
        <ANotion value={markdown} onChange={setMarkdown} imageUploader={mockImgUploader} />
      </div>
      <h3 style={{ marginTop: 24, fontWeight: 600 }}>当前 Markdown</h3>
      <pre
        style={{
          background: '#fafafa',
          border: '1px solid #f0f0f0',
          padding: 16,
          borderRadius: 6,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          color: 'rgba(0, 0, 0, 0.88)',
          fontSize: 13
        }}
      >
        {markdown}
      </pre>
    </div>
  );
};

export default ANotionDemo;
