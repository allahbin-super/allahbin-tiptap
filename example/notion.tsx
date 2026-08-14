import React, { useState } from 'react';
import ANotion, { type OutlineMode } from '../src/ANotion';
import { mockFileUploader, mockImgUploader } from '../src/ATiptapEdit';
import type { FileNodeRenderProps } from '../src/notion-like';

const INITIAL_MARKDOWN = `# ANotion

输入 \`/\` 插入标题、列表、引用、代码块、图片、视频、音频、文件和表格。划词后可设置加粗、高亮和对齐。

## 目录

默认是悬浮模式：左侧只有刻度条，鼠标悬停展开标题，点图钉可固定（常显、不自动隐藏）。

### 悬浮

刻度条贴在内容左边距里，不挤占正文宽度。当前标题会高亮。

### 固定

目录仍在左侧展开，常显不自动隐藏，点击标题跳转。

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
| 文件 | 已支持 | 视频/音频默认播放器，其它附件卡片 |
| 表格 | 已支持 | 行列表手柄、合并拆分 |

## 滚动测试

下面几段用来把编辑器撑高，方便看目录固定后随滚动高亮。

### 第一节

正文可以继续输入。滚动时目录会跟踪当前标题。

### 第二节

固定模式下目录仍在左侧，应贴在编辑器可视区域顶部。

### 第三节

悬浮模式下左侧刻度条也应跟着滚动停留在视野里。

### 第四节

再往下滚一段，点目录标题应能跳转回来。
`;

const ANotionBasicDemo = () => {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [editable, setEditable] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showOutline, setShowOutline] = useState(true);
  const [outlineMode, setOutlineMode] = useState<OutlineMode>('float');
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
        目录默认悬浮（左侧刻度条，悬停展开）。点图钉或下方按钮可固定为常显。斜杠可插入视频 / 音频 /
        文件（需 fileUploader，文档只存 URL）。
      </p>
      <button type="button" style={buttonStyle} onClick={() => setEditable(v => !v)}>
        {editable ? '切换为只读' : '切换为编辑'}
      </button>
      <button type="button" style={buttonStyle} onClick={() => setShowToolbar(v => !v)}>
        {showToolbar ? '隐藏头部操作区' : '显示头部操作区'}
      </button>
      <button type="button" style={buttonStyle} onClick={() => setShowOutline(v => !v)}>
        {showOutline ? '隐藏目录' : '显示目录'}
      </button>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => setOutlineMode(v => (v === 'float' ? 'fixed' : 'float'))}
      >
        {outlineMode === 'float' ? '目录：悬浮' : '目录：固定'}
      </button>
      <button type="button" style={buttonStyle} onClick={() => setBordered(v => !v)}>
        {bordered ? '无边框' : '有边框'}
      </button>
      <ANotion
        value={markdown}
        editable={editable}
        showToolbar={showToolbar}
        showOutline={showOutline}
        outlineMode={outlineMode}
        onOutlineModeChange={setOutlineMode}
        bordered={bordered}
        onChange={setMarkdown}
        imageUploader={mockImgUploader}
        fileUploader={mockFileUploader}
        onFileClick={(info, event) => {
          event.preventDefault();
          console.log('file click', info);
          if (info.src) {
            window.open(info.src, '_blank', 'noopener,noreferrer');
          }
        }}
        fileRenderers={{
          file: (props: FileNodeRenderProps) => {
            if (props.mime === 'application/pdf') {
              return (
                <div className="atiptap-notion-file" style={{ padding: 12 }}>
                  <div style={{ marginBottom: 8, color: 'rgba(0,0,0,0.45)' }}>PDF 自定义预览示例</div>
                  <button
                    type="button"
                    className="atiptap-notion-file atiptap-notion-file--card"
                    style={{ border: '1px solid #1677ff' }}
                    onClick={event => {
                      event.preventDefault();
                      window.open(props.src, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <span className="atiptap-notion-file__meta">
                      <span className="atiptap-notion-file__name">{props.name}</span>
                      <span className="atiptap-notion-file__sub">点击打开 PDF</span>
                    </span>
                  </button>
                </div>
              );
            }
            return props.defaultRender();
          }
        }}
        style={{ height: 560 }}
      />
    </div>
  );
};

export default ANotionBasicDemo;
