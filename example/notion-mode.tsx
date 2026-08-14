import type { Editor } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import ANotion, { type NotionContentMode } from '../src/ANotion';
import { mockFileUploader, mockImgUploader } from '../src/ATiptapEdit';

const buttonStyle: React.CSSProperties = {
  margin: '0 8px 8px 0',
  padding: '4px 12px',
  border: '1px solid #d9d9d9',
  borderRadius: 6,
  cursor: 'pointer',
  background: '#fff',
  color: 'rgba(0, 0, 0, 0.88)'
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d9d9d9',
  borderRadius: 6,
  padding: 8,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  fontSize: 13,
  color: 'rgba(0, 0, 0, 0.88)'
};

const SAMPLE_MD = `# Markdown 赋值

这是一段 **Markdown** 内容。

- 列表 A
- 列表 B
`;

const SAMPLE_HTML =
  '<h1>HTML 赋值</h1><p>这是一段 <strong>HTML</strong> 内容，可与 Markdown / JSON 互转。</p><ul><li>列表项 A</li><li>列表项 B</li></ul>';

const SAMPLE_JSON = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1, textAlign: 'left' },
      content: [{ type: 'text', text: 'JSON 赋值' }]
    },
    {
      type: 'paragraph',
      attrs: { textAlign: 'left' },
      content: [
        { type: 'text', text: '通过 ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'JSON' },
        { type: 'text', text: ' 写入文档，并可用下方输入框做格式互转预览。' }
      ]
    }
  ]
};

const getMarkdown = (editor: Editor) => {
  const markdownStorage = editor.storage as {
    markdown?: { getMarkdown?: () => string };
  };
  return markdownStorage.markdown?.getMarkdown?.() || '';
};

/** 对齐完整编辑器：html / md / json 赋值与互转预览 */
const ANotionModeDemo = () => {
  const editorRef = useRef<Editor | null>(null);
  const [mode, setMode] = useState<NotionContentMode>('md');
  const [value, setValue] = useState<any>(SAMPLE_MD);
  const [htmlValue, setHtmlValue] = useState('');
  const [mdValue, setMdValue] = useState(SAMPLE_MD);
  const [jsonValue, setJsonValue] = useState('');

  const syncPreviewBoxes = (editor = editorRef.current) => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    setHtmlValue(editor.getHTML());
    setMdValue(getMarkdown(editor));
    setJsonValue(JSON.stringify(editor.getJSON(), null, 2));
  };

  const onChange = (next: any, editor: Editor) => {
    setValue(next);
    syncPreviewBoxes(editor);
  };

  return (
    <div style={{ padding: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ marginRight: 8 }}>mode</span>
        <select
          value={mode}
          onChange={e => {
            const nextMode = e.target.value as NotionContentMode;
            setMode(nextMode);
            const editor = editorRef.current;
            if (!editor || editor.isDestroyed) {
              return;
            }
            const nextValue =
              nextMode === 'json'
                ? editor.getJSON()
                : nextMode === 'html'
                  ? editor.getHTML()
                  : getMarkdown(editor);
            setValue(nextValue);
            syncPreviewBoxes(editor);
          }}
          style={{ ...buttonStyle, padding: '4px 8px' }}
        >
          <option value="md">md</option>
          <option value="html">html</option>
          <option value="json">json</option>
        </select>
        <span style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 13 }}>当前 mode = {mode}</span>
      </div>

        <ANotion
          mode={mode}
          value={value}
          onChange={onChange}
          imageUploader={mockImgUploader}
          fileUploader={mockFileUploader}
          onReady={editor => {
            editorRef.current = editor;
            syncPreviewBoxes(editor);
          }}
        />

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setMode('html');
            setValue(SAMPLE_HTML);
            setHtmlValue(SAMPLE_HTML);
          }}
        >
          赋值 html
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setMode('md');
            setValue(SAMPLE_MD);
            setMdValue(SAMPLE_MD);
          }}
        >
          赋值 md
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setMode('json');
            setValue(SAMPLE_JSON);
            setJsonValue(JSON.stringify(SAMPLE_JSON, null, 2));
          }}
        >
          赋值 json
        </button>
        <button type="button" style={buttonStyle} onClick={() => syncPreviewBoxes()}>
          解析数据到输入框
        </button>
      </div>

      <h3 style={{ marginTop: 24, fontWeight: 600 }}>jsonValue</h3>
      <textarea
        value={jsonValue}
        onChange={e => {
          const text = e.target.value;
          setJsonValue(text);
          if (!text.includes('{')) {
            return;
          }
          try {
            setMode('json');
            setValue(JSON.parse(text));
          } catch {
            // 输入过程中允许暂时非法 JSON
          }
        }}
        style={textareaStyle}
        rows={6}
      />

      <h3 style={{ marginTop: 16, fontWeight: 600 }}>htmlValue</h3>
      <textarea
        value={htmlValue}
        onChange={e => {
          setHtmlValue(e.target.value);
          setMode('html');
          setValue(e.target.value);
        }}
        style={textareaStyle}
        rows={4}
      />

      <h3 style={{ marginTop: 16, fontWeight: 600 }}>mdValue</h3>
      <textarea
        value={mdValue}
        onChange={e => {
          setMdValue(e.target.value);
          setMode('md');
          setValue(e.target.value);
        }}
        style={textareaStyle}
        rows={6}
      />
    </div>
  );
};

export default ANotionModeDemo;
