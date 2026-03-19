import classNames from 'classnames';
import React, { useMemo } from 'react';
import { ATailBar } from '../../extensions/ATailBar';
import { ATitleBar } from '../../extensions/ATitleBar';
import { AWenHaoBar } from '../../extensions/AWenHaoBar';
import TextButton from '../../extensions/TextButton';
import { MenuBar } from '../../menubar';
import type { TideEditor } from '../TideEditor';
import { useEditorContext } from '../context/EditorContext';

export const EditorMenu: React.FC<{
  editor: TideEditor | null;
  disabledMenu?: boolean;
  menuClassName?: string;
  onFullscreenChange: (v: boolean) => void;
  menuStyle?: React.CSSProperties;
}> = ({ editor, disabledMenu = false, menuClassName, menuStyle, onFullscreenChange }) => {
  const { fullscreen, editable } = useEditorContext();
  const menuItems = useMemo(() => {
    if (!editor) {
      return null;
    }
    const {
      AWenHao,
      ATail,
      ATitle,
      bulletList,
      orderedList,
      taskList,
      image,
      table,
      codeBlock,
      blockquote,
      horizontalRule
    } = editor.state.schema.nodes;
    const { bold, italic, strike, link, code } = editor.state.schema.marks;
    return [
      [
        editor.menuEnableUndoRedo && (
          <TextButton key="undo" onClick={() => editor.chain().focus().undo().run()}>
            撤销
          </TextButton>
        ),
        editor.menuEnableUndoRedo && (
          <TextButton key="redo" onClick={() => editor.chain().focus().redo().run()}>
            重做
          </TextButton>
        )
      ],
      [
        bold && (
          <TextButton
            key="bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            加粗
          </TextButton>
        ),
        italic && (
          <TextButton
            key="italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            斜体
          </TextButton>
        ),
        strike && (
          <TextButton
            key="strike"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
          >
            删除线
          </TextButton>
        ),
        code && (
          <TextButton
            key="code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
          >
            行内代码
          </TextButton>
        )
      ],
      [
        ATitle && <ATitleBar key="ATitle" editor={editor} />,
        ATail && (
          <ATailBar
            key="ATail"
            onClick={() => editor.chain().focus().toggleATail().run()}
            isActive={editor.isActive('ATail')}
            disabled={!editor.can().toggleATail?.() || false}
          />
        ),
        AWenHao && (
          <AWenHaoBar
            key="AWenHao"
            onClick={() => editor.chain().focus().toggleWenHao().run()}
            isActive={editor.isActive('AWenHao')}
            disabled={!editor.can().toggleWenHao?.() || false}
          />
        )
      ],
      [
        bulletList && (
          <TextButton
            key="bulletList"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          >
            无序列表
          </TextButton>
        ),
        orderedList && (
          <TextButton
            key="orderedList"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
          >
            有序列表
          </TextButton>
        ),
        taskList && (
          <TextButton
            key="taskList"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
          >
            任务列表
          </TextButton>
        )
      ],
      [
        link && (
          <TextButton
            key="link"
            onClick={() => {
              const href = window.prompt('请输入链接地址');
              if (!href) {
                return;
              }
              editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
            }}
            isActive={editor.isActive('link')}
          >
            链接
          </TextButton>
        ),
        image && (
          <TextButton
            key="image"
            onClick={() => {
              const src = window.prompt('请输入图片地址');
              if (!src) {
                return;
              }
              editor.chain().focus().setImage({ src }).run();
            }}
          >
            图片
          </TextButton>
        ),
        table && (
          <TextButton
            key="table"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            表格
          </TextButton>
        ),
        codeBlock && (
          <TextButton
            key="codeBlock"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            代码块
          </TextButton>
        )
      ],
      [
        blockquote && (
          <TextButton
            key="blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            引用
          </TextButton>
        ),
        horizontalRule && (
          <TextButton
            key="horizontalRule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            分割线
          </TextButton>
        )
      ],
      [
        editor.menuEnableFullscreen && (
          <TextButton
            key="fullscreen"
            onClick={() => {
              const newFullscreen = !fullscreen;
              editor.setFullscreen(newFullscreen);
              onFullscreenChange(newFullscreen);
            }}
          >
            {fullscreen ? '退出全屏' : '全屏'}
          </TextButton>
        )
      ]
    ]
      .map(group => group.filter(Boolean))
      .filter(group => group.length > 0)
      .map((group, index, items) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={index}>
          {group}
          {index < items.length - 1 && <span className="tide-menu-bar-divider" />}
        </React.Fragment>
      ));
  }, [editor, editable, fullscreen, editor?.menuEnableUndoRedo, editor?.menuEnableFullscreen]);

  const handleButtonClick = (event: {
    stopPropagation: () => void;
    preventDefault: () => void;
  }) => {
    // 阻止事件冒泡，这将防止触发默认的表单提交事件
    event.stopPropagation();
    event.preventDefault();
  };

  if (!editable && !editor?.readOnlyShowMenu) {
    return null;
  }

  return (
    <div onClick={handleButtonClick}>
      <MenuBar
        className={classNames(menuClassName, {
          disabled: editor?.readOnlyShowMenu || disabledMenu
        })}
        style={menuStyle}
      >
        {menuItems}
      </MenuBar>
    </div>
  );
};
