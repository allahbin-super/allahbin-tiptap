import { Button, Input, Select, Space, Typography } from 'antd';
import React, { useState } from 'react';
import AEditorRender, { mockFileUploader, mockImgUploader, type IATiptapProps } from '../src';

const SAMPLE_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"><rect width="100%" height="100%" fill="#1677ff"/><text x="50%" y="54%" fill="white" font-size="16" font-family="sans-serif" text-anchor="middle">图片块</text></svg>'
)}`;

const SAMPLE_HTML = `<p>示例正文。表格、图片与块编辑器使用同一套节点。</p><blockquote><p>引用保持 GitHub 风格：灰色左边框。</p></blockquote><pre><code>const hello = 'world';</code></pre><table><tbody><tr><th><p>项目</p></th><th><p>说明</p></th></tr><tr><td><p>表格</p></td><td><p>单元格边框、表头底与行列手柄</p></td></tr></tbody></table><img src="${SAMPLE_IMG}" alt="示例图" />`;
const SAMPLE_MD = '! 你好';
const SAMPLE_JSON =
  '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":"left","indent":0},"content":[{"type":"text","text":"阿萨达阿萨大大咋打打算111"},{"type":"text","marks":[{"type":"link","attrs":{"href":"阿萨大大","target":"_blank","data-id":123131321}}],"text":"阿萨大大"}]}]}';

export default () => {
  const [value, setValue] = useState<any>(SAMPLE_HTML);
  const [mode, setMode] = useState<IATiptapProps['mode']>('html');
  const [mdValue, setMdValue] = useState<string>();
  const [jsonValue, setJsonValue] = useState<any>();
  const [htmlValue, setHtmlValue] = useState<string>(SAMPLE_HTML);
  const [editable, setEditable] = useState<boolean>(true);
  const [bordered, setBordered] = useState<boolean>(true);
  const [renderMode, setRenderMode] = useState<IATiptapProps['renderMode']>('gov');
  const editor = React.useRef<any>();

  const onChange = (v: any, currentEditor: any) => {
    console.log('onChange', v, currentEditor);
    setValue(v);
    parseContentToInputBox();
  };

  const onHtmlChange = (v: string) => {
    setHtmlValue(v);
    setValue(v);
  };

  const onMdChange = (v: string) => {
    setMdValue(v);
    setValue(v);
  };

  const onJsonChange = (v: string) => {
    if (!v.includes('{')) {
      setJsonValue('');
      return;
    }
    try {
      setJsonValue(v);
      const json = JSON.parse(v);
      setValue(json);
    } catch (e) {
      console.log('无效json');
    }
  };

  const parseContentToInputBox = () => {
    setHtmlValue(editor.current.getHTML());
    setMdValue(editor.current.getMarkdown());
    setJsonValue(JSON.stringify(editor.current.getJSON()));
  };

  return (
    <div style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        公文 / 普通文章编辑器。可切换编辑状态、皮肤和边框，下方可查看或回写 HTML / Markdown / JSON。
      </Typography.Paragraph>
      <Space wrap size={8} style={{ marginBottom: 12 }}>
        <Button type={editable ? 'primary' : 'default'} onClick={() => setEditable(v => !v)}>
          {editable ? '编辑中' : '只读'}
        </Button>
        <Select
          value={renderMode}
          style={{ width: 128 }}
          onChange={v => setRenderMode(v)}
          options={[
            { value: 'gov', label: '公文皮肤' },
            { value: 'normal', label: '普通皮肤' },
            { value: 'custom', label: '自定义' }
          ]}
        />
        <Button onClick={() => setBordered(v => !v)}>{bordered ? '有边框' : '无边框'}</Button>
        <Button
          onClick={() => {
            setMode('html');
            onHtmlChange(SAMPLE_HTML);
          }}
        >
          填入 HTML
        </Button>
        <Button
          onClick={() => {
            setMode('md');
            onMdChange(SAMPLE_MD);
          }}
        >
          填入 Markdown
        </Button>
        <Button
          onClick={() => {
            setMode('json');
            onJsonChange(SAMPLE_JSON);
          }}
        >
          填入 JSON
        </Button>
        <Button id="parseContentToInputBox" onClick={parseContentToInputBox}>
          同步到下方
        </Button>
      </Space>
      <AEditorRender
        onReady={e => {
          // @ts-ignore
          window.editor = e;
          editor.current = e;
        }}
        renderMode={renderMode}
        mode={mode}
        value={value}
        onChange={onChange}
        editable={editable}
        bordered={bordered}
        imageUploader={mockImgUploader}
        fileUploader={mockFileUploader}
      />
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Typography.Text strong>HTML</Typography.Text>
          <Input.TextArea
            id="htmlValue"
            value={htmlValue}
            onChange={e => onHtmlChange(e.target.value)}
            rows={4}
            placeholder="HTML"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Typography.Text strong>Markdown</Typography.Text>
          <Input.TextArea
            id="mdValue"
            value={mdValue}
            onChange={e => onMdChange(e.target.value)}
            rows={4}
            placeholder="Markdown"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Typography.Text strong>JSON</Typography.Text>
          <Input.TextArea
            id="jsonValue"
            value={jsonValue}
            onChange={e => onJsonChange(e.target.value)}
            rows={4}
            placeholder="JSON"
            style={{ marginTop: 8, fontFamily: 'Consolas, Monaco, monospace' }}
          />
        </div>
      </div>
    </div>
  );
};
