import { Typography } from 'antd';
import React, { useState } from 'react';
import ATiptapEdit from '../src/ATiptapEdit';

const SimpleChatEditor = () => {
  const [value, setValue] = useState('');

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', color: 'rgba(0, 0, 0, 0.88)' }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        轻量输入场景：关闭标题、表格、图片等块级能力，适合聊天框或评论框。
      </Typography.Paragraph>
      <div
        style={{
          overflow: 'hidden',
          background: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          boxShadow:
            '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
        }}
      >
        <ATiptapEdit
          simple
          height={120}
          editable
          bordered={false}
          value={value}
          onChange={val => {
            setValue(val);
            console.log('输入内容：', val);
          }}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">当前内容</Typography.Text>
        <pre
          style={{
            marginTop: 8,
            marginBottom: 0,
            padding: 12,
            overflow: 'auto',
            color: 'rgba(0, 0, 0, 0.65)',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.5714285714285714
          }}
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SimpleChatEditor;
