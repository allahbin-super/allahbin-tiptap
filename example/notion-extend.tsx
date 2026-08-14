import { mergeAttributes, Node } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Info } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import ANotion from '../src/ANotion';
import TiptapRender from '../src/utils/TiptapRender';
import type { SlashSuggestionItem } from '../src/notion-like';

/** 业务侧自定义「提示块」——演示 extraExtensions / slash / toolbar / 句柄扩展 */
function CalloutView({ node, selected }: NodeViewProps) {
  return (
    <NodeViewWrapper
      className="atiptap-callout-demo"
      data-selected={selected ? 'true' : 'false'}
      data-variant={node.attrs.variant || 'info'}
    >
      <div className="atiptap-callout-demo__badge" contentEditable={false}>
        <Info size={14} />
        提示
      </div>
      <NodeViewContent className="atiptap-callout-demo__body" />
    </NodeViewWrapper>
  );
}

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-variant') || 'info',
        renderHTML: attributes => ({ 'data-variant': attributes.variant || 'info' })
      }
    };
  },

  parseHTML() {
    return [{ tag: 'aside[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        class: 'atiptap-callout-demo'
      }),
      0
    ];
  },

  addCommands() {
    return {
      insertCallout:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: 'callout',
            attrs: { variant: 'info' },
            content: [{ type: 'paragraph' }]
          })
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  }
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: () => ReturnType;
    };
  }
}

function insertCallout(editor: Editor) {
  editor.chain().focus().insertCallout().run();
}

const INITIAL_JSON = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: '自定义节点扩展' }]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '通过 extraExtensions 注入 callout，并用 slashItems / toolbarExtra / getBlockIcon 接到 UI。自定义块请优先使用 mode="json"。'
        }
      ]
    },
    {
      type: 'callout',
      attrs: { variant: 'info' },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '这是业务自定义的提示块。可用斜杠「提示块」或工具栏按钮插入。' }]
        }
      ]
    }
  ]
};

const demoStyles = `
.atiptap-callout-demo {
  margin: 8px 0;
  padding: 12px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #e6f4ff;
  border-left: 3px solid #1677ff;
}
.atiptap-callout-demo[data-variant='warning'] {
  background: #fff7e6;
  border-left-color: #fa8c16;
}
.atiptap-callout-demo[data-variant='warning'] .atiptap-callout-demo__badge {
  color: #fa8c16;
}
.atiptap-callout-demo[data-selected='true'] {
  outline: 2px solid #1677ff;
  outline-offset: 1px;
}
.atiptap-callout-demo__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  color: #1677ff;
  font-size: 12px;
  font-weight: 500;
}
.atiptap-callout-demo__body > *:first-child { margin-top: 0; }
.atiptap-callout-demo__body > *:last-child { margin-bottom: 0; }
.atiptap-callout-readonly {
  margin: 8px 0;
  padding: 12px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #e6f4ff;
  border-left: 3px solid #1677ff;
}
.atiptap-callout-readonly[data-variant='warning'] {
  background: #fff7e6;
  border-left-color: #fa8c16;
}
`;

const NotionExtendDemo = () => {
  const [json, setJson] = useState<any>(INITIAL_JSON);
  const extraExtensions = useMemo(() => [Callout], []);
  const slashItems = useMemo<SlashSuggestionItem[]>(
    () => [
      {
        title: '提示块',
        subtext: '自定义 callout 节点',
        keywords: ['callout', '提示', 'info'],
        badge: Info,
        group: '自定义',
        onSelect: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertCallout().run();
        }
      }
    ],
    []
  );

  const readonly = useMemo(() => {
    const render = new TiptapRender(json as any, {
      renderMode: 'normal',
      nodeRenderers: {
        callout: (item, { renderContent }) => (
          <aside
            key={item.key}
            className="atiptap-callout-readonly"
            data-variant={(item.attrs as { variant?: string } | undefined)?.variant || 'info'}
          >
            <div style={{ color: '#1677ff', fontSize: 12, marginBottom: 6 }}>提示（只读）</div>
            {renderContent(item.content as any)}
          </aside>
        )
      }
    });
    return render.render();
  }, [json]);

  return (
    <div style={{ padding: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
      <style>{demoStyles}</style>
      <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 12 }}>
        输入 <code>/</code> 选「提示块」，或点工具栏「提示」。左侧句柄会显示 Info 图标；块菜单有「切换为警告色」。
        下方是 <code>TiptapRender</code> + <code>nodeRenderers</code> 只读预览。
      </p>
      <ANotion
        mode="json"
        value={json}
        onChange={setJson}
        showOutline={false}
        extraExtensions={extraExtensions}
        slashItems={slashItems}
        toolbarExtra={editor => (
          <button
            type="button"
            title="提示块"
            className="atiptap-notion-toolbar__btn"
            onMouseDown={event => event.preventDefault()}
            onClick={() => insertCallout(editor)}
          >
            <Info size={16} />
          </button>
        )}
        getBlockIcon={node => (node.type.name === 'callout' ? Info : null)}
        blockMenuExtra={({ editor, node, close }) => {
          if (node.type.name !== 'callout') {
            return null;
          }
          return (
            <button
              type="button"
              className="atiptap-notion-drag-menu__item"
              onClick={() => {
                const next = node.attrs.variant === 'warning' ? 'info' : 'warning';
                editor
                  .chain()
                  .focus()
                  .updateAttributes('callout', {
                    variant: next
                  })
                  .run();
                close();
              }}
            >
              <Info size={15} />
              {node.attrs.variant === 'warning' ? '切回信息色' : '切换为警告色'}
            </button>
          );
        }}
        style={{ height: 420 }}
      />
      <h3 style={{ marginTop: 24, marginBottom: 8, fontSize: 14 }}>只读渲染（nodeRenderers）</h3>
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          padding: 12,
          minHeight: 80
        }}
      >
        {readonly}
      </div>
    </div>
  );
};

export default NotionExtendDemo;
