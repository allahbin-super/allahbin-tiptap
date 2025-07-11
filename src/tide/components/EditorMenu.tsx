import {
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  Emoji,
  Fullscreen,
  HorizontalRule,
  Image,
  Italic,
  MenuBar,
  MenuBarDivider,
  OrderedList,
  Redo,
  Strike,
  Table,
  TaskList,
  Undo
} from '@gitee/tide-extension-menubar';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { ALinkBar } from '../../a-link';
import { ATailBar } from '../../extensions/ATailBar';
import { ATitleBar } from '../../extensions/ATitleBar';
import { AWenHaoBar } from '../../extensions/AWenHaoBar';
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
      ALink,
      ATitle,
      bulletList,
      orderedList,
      taskList,
      image,
      table,
      codeBlock,
      blockquote,
      horizontalRule,
      emoji
    } = editor.state.schema.nodes;
    const { bold, italic, strike, link, code } = editor.state.schema.marks;
    return [
      [
        editor.menuEnableUndoRedo && <Undo key="undo" />,
        editor.menuEnableUndoRedo && <Redo key="redo" />
      ],
      [
        ATitle && <ATitleBar key="ATitle" />,
        ATail && <ATailBar key="ATail" />,
        AWenHao && <AWenHaoBar key="AWenhao" />,
        bold && <Bold key="bold" />,
        italic && <Italic key="italic" />,
        strike && <Strike key="strike" />,
        code && <Code key="code" />
      ],
      [
        bulletList && <BulletList key="bulletList" />,
        orderedList && <OrderedList key="orderedList" />,
        taskList && <TaskList key="taskList" />
      ],
      [
        link && <ALinkBar key="link" />,
        image && <Image key="image" />,
        table && <Table key="table" />,
        codeBlock && <CodeBlock key="codeBlock" />
      ],
      [
        blockquote && <Blockquote key="blockquote" />,
        horizontalRule && <HorizontalRule key="horizontalRule" />,
        emoji && <Emoji key="emoji" />
      ],
      [
        editor.menuEnableFullscreen && (
          <Fullscreen
            key="fullscreen"
            fullscreen={fullscreen}
            onFullscreenChange={newFullscreen => {
              editor.setFullscreen(newFullscreen);
              onFullscreenChange(newFullscreen);
            }}
          />
        )
      ]
    ]
      .map(group => group.filter(Boolean))
      .filter(group => group.length > 0)
      .map((group, index, items) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={index}>
          {group}
          {index < items.length - 1 && <MenuBarDivider />}
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
