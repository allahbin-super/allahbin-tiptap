---
title: 表单联动
order: 5
---

# 表单联动

ANotion 遵循 `value` / `onChange` 受控协议，可直接放入 antd `Form.Item`。

```tsx | pure
<Form.Item name="content" trigger="onChange" getValueFromEvent={v => v}>
  <ANotion mode="md" imageUploader={mockImgUploader} />
</Form.Item>
```

<code src="../../example/notion-form.tsx"></code>
