import React, { useMemo, useState } from 'react';
import ANotion from '../src/ANotion';
import type { MentionSuggestionItem } from '../src/notion-like';
import TiptapRender from '../src/utils/TiptapRender';

const USERS: MentionSuggestionItem[] = [
  { id: '1001', label: '张三', subtext: '研发中心' },
  { id: '1002', label: '李四', subtext: '产品中心' },
  { id: '1003', label: '王五', subtext: '设计中心' },
  { id: '1004', label: '赵六', subtext: '测试组' }
];

const emptyDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '输入 @ 试试提及同事' }]
    }
  ]
};

export default () => {
  const [json, setJson] = useState<any>(emptyDoc);

  const mentionItems = useMemo(
    () =>
      ({ query }: { query: string }) => {
        const q = query.trim().toLowerCase();
        if (!q) {
          return USERS;
        }
        return USERS.filter(
          u =>
            u.label.toLowerCase().includes(q) ||
            u.id.includes(q) ||
            (u.subtext || '').toLowerCase().includes(q)
        );
      },
    []
  );

  const readonly = useMemo(() => new TiptapRender(json, { renderMode: 'custom' }).render(), [json]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <ANotion
        mode="json"
        value={json}
        onChange={setJson}
        showOutline={false}
        mentionItems={mentionItems}
        placeholder="输入 / 或 @ "
      />
      <div>
        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>只读预览</div>
        {readonly}
      </div>
    </div>
  );
};
