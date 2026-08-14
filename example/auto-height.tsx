import { Typography } from 'antd';
import React, { useState } from 'react';
import ATiptapEdit from '../src/ATiptapEdit';

const SAMPLE =
  '<p>height="auto" 时编辑器随内容增高，不出现内部滚动条。</p><p>外层容器负责滚动即可。</p><p>适合嵌在抽屉、详情面板、表单里。</p>';

const AutoHeightEditor = () => {
  const [value, setValue] = useState(SAMPLE);

  return (
    <div style={{ maxWidth: 720, color: 'rgba(0, 0, 0, 0.88)' }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        传 <Typography.Text code>height=&quot;auto&quot;</Typography.Text>
        ，内容多长编辑器就多高，由外层滚动。
      </Typography.Paragraph>
      <ATiptapEdit
        height="auto"
        editable
        bordered={false}
        renderMode="custom"
        mode="html"
        value={value}
        onChange={val => setValue(val)}
      />
    </div>
  );
};

export default AutoHeightEditor;
