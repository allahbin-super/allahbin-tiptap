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
  const [showToolbar, setShowToolbar] = useState(true);
  const [bordered, setBordered] = useState(true);

  const buttonStyle: React.CSSProperties = {
    marginRight: 8,
    marginBottom: 12,
    padding: '4px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#fff'
  };

  return (
    <div style={{ padding: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
      <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 12 }}>
        带边框的块编辑器，头部可快捷排版。也可关掉工具栏，只保留斜杠、划词和块拖拽。
      </p>
      <button type="button" style={buttonStyle} onClick={() => setEditable(v => !v)}>
        {editable ? '切换为只读' : '切换为编辑'}
      </button>
      <button type="button" style={buttonStyle} onClick={() => setShowToolbar(v => !v)}>
        {showToolbar ? '隐藏头部操作区' : '显示头部操作区'}
      </button>
      <button type="button" style={buttonStyle} onClick={() => setBordered(v => !v)}>
        {bordered ? '无边框' : '有边框'}
      </button>
      <ANotion
        value={markdown}
        editable={editable}
        showToolbar={showToolbar}
        bordered={bordered}
        onChange={setMarkdown}
        imageUploader={mockImgUploader}
      />
    </div>
  );
};

export default ANotionBasicDemo;
