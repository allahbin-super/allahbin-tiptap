import React, { useState } from 'react';
import ANotion from '../src/ANotion';
import { mockImgUploader } from '../src/ATiptapEdit';

const INITIAL_MARKDOWN = `# ANotion

输入 \`/\` 插入标题、列表、引用、代码块、图片和表格。划词后可设置加粗、高亮和对齐。

## 列表示例

- 无序列表
- 支持 Markdown 粘贴

1. 有序列表
2. 拖拽左侧句柄可调整块顺序

- [ ] 任务未完成
- [x] 任务已完成

> 划词会出现加粗、斜体、下划线、高亮、链接和对齐。

\`\`\`js
console.log('hello notion');
\`\`\`

## 表格

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 图片 | 已支持 | 斜杠插入占位上传 |
| 表格 | 已支持 | 行列表手柄、合并拆分 |
`;

const ANotionBasicDemo = () => {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [editable, setEditable] = useState(true);

  return (
    <div style={{ padding: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
      <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 12 }}>
        基础用法：斜杠命令、划词菜单、块拖拽。默认按 Markdown 读写。
      </p>
      <button
        type="button"
        style={{
          marginBottom: 12,
          padding: '4px 12px',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          cursor: 'pointer',
          background: '#fff'
        }}
        onClick={() => setEditable(v => !v)}
      >
        {editable ? '切换为只读' : '切换为编辑'}
      </button>
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          overflow: 'visible',
          minHeight: 420,
          background: '#fff'
        }}
      >
        <ANotion
          value={markdown}
          editable={editable}
          onChange={setMarkdown}
          imageUploader={mockImgUploader}
        />
      </div>
    </div>
  );
};

export default ANotionBasicDemo;
