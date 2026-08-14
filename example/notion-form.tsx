import { Button, Form, Input, Space, message } from 'antd';
import React, { useState } from 'react';
import ANotion from '../src/ANotion';
import { mockFileUploader, mockImgUploader } from '../src/ATiptapEdit';

type FormValues = {
  title: string;
  summary?: string;
  content: string;
};

const INITIAL_CONTENT = `## 周报正文

本周完成块编辑器能力演示，可在此继续编辑。
`;

/** antd Form 联动：ANotion 遵循 value / onChange */
const ANotionFormDemo = () => {
  const [form] = Form.useForm<FormValues>();
  const [formResult, setFormResult] = useState<FormValues | null>(null);

  return (
    <div style={{ padding: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
      <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 12 }}>
        ANotion 可直接放入 Form.Item。提交时 content 按当前 mode 回传（本示例为 md）。
      </p>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          title: '周报标题',
          summary: '本周完成块编辑器能力演示',
          content: INITIAL_CONTENT
        }}
        onFinish={values => {
          setFormResult(values);
          message.success('表单已提交');
        }}
        style={{
          maxWidth: 720,
          padding: 16,
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          background: '#fafafa'
        }}
      >
        <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="文档标题" />
        </Form.Item>
        <Form.Item label="摘要" name="summary">
          <Input.TextArea rows={2} placeholder="可选摘要" />
        </Form.Item>
        <Form.Item
          label="正文（ANotion）"
          name="content"
          rules={[{ required: true, message: '请填写正文' }]}
          trigger="onChange"
          getValueFromEvent={v => v}
        >
          <ANotion
            mode="md"
            editable
            imageUploader={mockImgUploader}
            fileUploader={mockFileUploader}
            style={{ minHeight: 220, background: '#fff' }}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              提交表单
            </Button>
            <Button
              onClick={() => {
                form.setFieldsValue({
                  content: '## 从表单写入\n\n这是通过 `Form.setFieldsValue` 赋值的 Markdown。'
                });
              }}
            >
              表单写入 Markdown
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                setFormResult(null);
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {formResult ? (
        <>
          <h4 style={{ marginTop: 16, fontWeight: 600 }}>表单提交结果</h4>
          <pre
            style={{
              background: '#fff',
              border: '1px solid #f0f0f0',
              padding: 16,
              borderRadius: 6,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: 13
            }}
          >
            {JSON.stringify(formResult, null, 2)}
          </pre>
        </>
      ) : null}
    </div>
  );
};

export default ANotionFormDemo;
