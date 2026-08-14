import React, { useState } from 'react';
import ANotion from '../src/ANotion';
import { mockFileUploader, mockImgUploader } from '../src/ATiptapEdit';
import type { FileNodeInfo, FileNodeRenderProps } from '../src/notion-like';

const INITIAL_MD = `# 附件 / 音视频

输入 \`/\` 选择「视频」「音频」或「文件」，或使用工具栏回形针按钮。

文档只保存上传后的 **URL**，不会写入原始文件或 base64。

## 试试

1. 插入视频：默认 \`<video controls>\`
2. 插入音频：默认 \`<audio controls>\`
3. 插入 PDF / zip 等：附件卡片；PDF 本示例做了自定义渲染
`;

const NotionFileDemo = () => {
  const [value, setValue] = useState(INITIAL_MD);
  const [lastClick, setLastClick] = useState<FileNodeInfo | null>(null);

  return (
    <div style={{ padding: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
      <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 12 }}>
        Demo 使用 <code>mockFileUploader</code> 返回 object URL，业务侧应上传到 OSS/CDN 后回写真实 URL。
      </p>
      {lastClick ? (
        <pre
          style={{
            marginBottom: 12,
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 6,
            fontSize: 12,
            overflow: 'auto'
          }}
        >
          {JSON.stringify(lastClick, null, 2)}
        </pre>
      ) : null}
      <ANotion
        value={value}
        onChange={setValue}
        showOutline={false}
        imageUploader={mockImgUploader}
        fileUploader={mockFileUploader}
        onFileClick={(info, event) => {
          event.preventDefault();
          setLastClick(info);
        }}
        fileRenderers={{
          file: (props: FileNodeRenderProps) => {
            if (props.mime === 'application/pdf') {
              return (
                <div className="atiptap-notion-file" style={{ padding: 12 }}>
                  <div style={{ marginBottom: 8, color: 'rgba(0,0,0,0.45)' }}>
                    PDF 自定义渲染示例
                  </div>
                  <button
                    type="button"
                    className="atiptap-notion-file atiptap-notion-file--card"
                    style={{ border: '1px solid #1677ff', width: '100%' }}
                    onClick={event => {
                      event.preventDefault();
                      setLastClick(props);
                      if (props.src) {
                        window.open(props.src, '_blank', 'noopener,noreferrer');
                      }
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
        style={{ height: 420 }}
      />
    </div>
  );
};

export default NotionFileDemo;
