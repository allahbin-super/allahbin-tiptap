import Tippy from '@tippyjs/react';
import classNames from 'classnames';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { command, option } from '../menubar';
import type { ATiptapEditor } from '../editor';
import TextButton from './TextButton';

const headingLevels: any[] = ['ATitle1', 'ATitle2', 'ATitle3', 1, 2, 3];

// 定义标题的中文
const headingLevelsMap: Record<string, string> = {
  ATitle1: '大标题',
  ATitle2: '小标题(章)',
  ATitle3: '子标题(节)'
};

type ATitleBarProps = {
  editor: ATiptapEditor;
};

export const ATitleBar: React.FC<ATitleBarProps> = ({ editor }) => {
  const [headVisible, setHeadVisible] = useState(false);

  const statusMap = React.useMemo(() => {
    const map: any = {
      paragraphIsActive: editor.isActive('paragraph'),
      paragraphIsDisabled: !editor.can().setParagraph()
    };
    headingLevels.forEach(level => {
      if (typeof level === 'number') {
        map[`heading${level}IsActive`] = editor.isActive('heading', { level });
        map[`heading${level}Disabled`] =
          !editor.state.schema.nodes.heading || !editor.can().toggleHeading?.({ level } as any);
      } else {
        const levelNum = level.split('').pop();
        map[`${level}IsActive`] = editor.isActive('ATitle', {
          level: Number(levelNum)
        });
        map[`${level}Disabled`] =
          !editor.state.schema.nodes.heading ||
          !editor.can().toggleATitle?.({ level: Number(levelNum) as any });
      }
    });
    return map;
  }, [editor, editor.state.doc, editor.state.selection]);

  const getHeadingText = () => {
    if (statusMap.paragraphIsActive) {
      return '正文';
    }
    const activeLevel = headingLevels.find(level => {
      if (typeof level === 'number') {
        return statusMap[`heading${level}IsActive`];
      }
      return statusMap[`${level}IsActive`];
    });
    if (typeof activeLevel === 'number') {
      return `标题 ${activeLevel}`;
    }
    return headingLevelsMap[activeLevel] || '正文';
  };

  return (
    <div>
      <Tippy
        placement="bottom-start"
        interactive
        onClickOutside={() => setHeadVisible(false)}
        visible={headVisible}
        content={
          <div className="atiptap-dropdown-menu">
            <div className="atiptap-dropdown-menu__content">
              <div
                onClick={() => {
                  if (
                    statusMap.paragraphIsDisabled ||
                    !editor.can().chain().focus().setParagraph().run()
                  ) {
                    return false;
                  }
                  editor.chain().focus().setParagraph().run();
                  setHeadVisible(false);
                }}
                className={classNames('atiptap-dropdown-menu__item', {
                  'atiptap-dropdown-menu__item--active': statusMap.paragraphIsActive,
                  'atiptap-dropdown-menu__item--disabled': statusMap.paragraphIsDisabled
                })}
              >
                <div className={classNames('atiptap-menu-head-row')}>
                  <span>正文</span>
                  <span className="atiptap-menu-head-row__span">{`${command} + ${option} + 0`}</span>
                </div>
              </div>
              {headingLevels.map(level => (
                <li
                  key={level}
                  onClick={() => {
                    if (typeof level === 'number') {
                      if (
                        statusMap[`heading${level}Disabled`] ||
                        !editor
                          .can()
                          .chain()
                          .focus()
                          .toggleHeading({ level } as any)
                          .run()
                      ) {
                        return false;
                      }
                    } else {
                      // 取出最后一个字符串
                      const levelNum = level.split('').pop();
                      if (
                        statusMap[`${level}Disabled`] ||
                        !editor
                          .can()
                          .chain()
                          .focus()
                          .toggleATitle({ level: Number(levelNum) as any })
                          .run()
                      ) {
                        return false;
                      }
                    }
                    if (typeof level === 'number') {
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({ level } as any)
                        .run();
                    } else {
                      // 取出最后一个字符串
                      const levelNum = level.split('').pop();
                      editor
                        .chain()
                        .focus()
                        .toggleATitle({ level: Number(levelNum) as any })
                        .run();
                    }
                    setHeadVisible(false);
                  }}
                  className={classNames('atiptap-dropdown-menu__item', {
                    'atiptap-dropdown-menu__item--active': statusMap[`${level}IsActive`],
                    'atiptap-dropdown-menu__item--disabled': statusMap[`${level}Disabled`]
                  })}
                >
                  <div className={classNames('atiptap-menu-head-row')}>
                    <span className={`atiptap-menu-head-row__title--level${level}`}>
                      {headingLevelsMap[level] || `${level}级标题`}
                    </span>
                    {typeof level === 'number' && (
                      <span className="atiptap-menu-head-row__span">
                        {`${command} + ${option} + ${level}`}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </div>
          </div>
        }
      >
        <TextButton
          className="atiptap-dropdown-trigger"
          onClick={() => setHeadVisible(!headVisible)}
          isActive={statusMap.paragraphIsActive}
        >
          <span className="atiptap-dropdown-trigger__head-text">{getHeadingText()}</span>
          <ChevronDown className="atiptap-dropdown-trigger__head-icon" size={16} />
        </TextButton>
      </Tippy>
    </div>
  );
};
