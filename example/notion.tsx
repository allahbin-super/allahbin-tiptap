import React, { useState } from 'react';
import ANotion from '../src/ANotion';

const INITIAL_MARKDOWN = `# Notion + Markdown

输入 \`/\` 可以插入标题、列表、引用、代码块和表格。

## 列表示例

- 无序列表
- 支持 Markdown 粘贴

1. 有序列表
2. 拖拽左侧句柄可调整块顺序

- [ ] 任务未完成
- [x] 任务已完成

> 划词后会出现加粗、斜体、链接等浮动菜单。

\`\`\`js
console.log('hello notion');
\`\`\`
`;

const ANotionDemo = () => {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);

  return (
    <div style={{ padding: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
      <h2 style={{ margin: '0 0 8px', fontWeight: 600 }}>ANotion</h2>
      <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 16 }}>
        Notion 风格块编辑器，和 ATiptap 公文编辑器分开使用。支持斜杠命令、划词菜单、块拖拽，默认以
        Markdown 回传。
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
        <ANotion value={markdown} onChange={setMarkdown} />
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
