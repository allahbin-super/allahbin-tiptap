import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  size,
  useFloating,
  useMergeRefs
} from '@floating-ui/react';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Download,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  Maximize2,
  Minus,
  Plus,
  Quote,
  Table,
  Trash2,
  Type
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  canMoveBlock,
  copyNodeMarkdown,
  deleteNode,
  duplicateNode,
  getNodeAtPos,
  insertSlashAtNode,
  isTextSelectionActive,
  moveBlock,
  selectBlockNode,
  setEditorMeta
} from './block-actions';
import { downloadSelectedImage } from './image';
import { clearEntireTable, fitTableToWidth, setTableAlign } from './table';

type BlockIcon = React.ComponentType<{ className?: string; size?: number }>;

const DRAG_HANDLE_GAP = 8;
const MENU_VIEWPORT_PADDING = 12;
const MENU_MAX_HEIGHT = 420;

/** 稳定对象，避免 DragHandle 插件反复卸载重装 */
const DRAG_POSITION_CONFIG = {
  strategy: 'absolute' as const,
  placement: 'left-start' as const,
  middleware: [
    offset(props => {
      const nodeHeight = props.rects.reference.height;
      const handleHeight = props.rects.floating.height;
      return {
        mainAxis: DRAG_HANDLE_GAP,
        crossAxis: nodeHeight > 40 ? 0 : nodeHeight / 2 - handleHeight / 2
      };
    })
  ]
};

const NESTED_DRAG_OPTIONS = {
  defaultRules: false,
  edgeDetection: 'none' as const,
  rules: [
    {
      id: 'inlineContent',
      evaluate: ({ node }: { node: ProseMirrorNode }) => (node.isInline || node.isText ? 1000 : 0)
    },
    {
      id: 'tableStructure',
      evaluate: ({ node, parent }: { node: ProseMirrorNode; parent: ProseMirrorNode | null }) => {
        const types = ['tableRow', 'tableCell', 'tableHeader'];
        if (types.includes(node.type.name)) {
          return 1000;
        }
        if (parent && parent.type.name === 'tableHeader') {
          return 1000;
        }
        return 0;
      }
    },
    {
      id: 'listItemFirstChild',
      evaluate: ({ parent, isFirst }: { parent: ProseMirrorNode | null; isFirst: boolean }) => {
        if (!isFirst) {
          return 0;
        }
        if (parent && ['listItem', 'taskItem'].includes(parent.type.name)) {
          return 1000;
        }
        return 0;
      }
    }
  ]
};

function getBlockTypeIcon(node: ProseMirrorNode | null): BlockIcon | null {
  if (!node) {
    return null;
  }

  switch (node.type.name) {
    case 'heading':
      if (node.attrs.level === 1) return Heading1;
      if (node.attrs.level === 2) return Heading2;
      return Heading3;
    case 'paragraph':
      return Type;
    case 'blockquote':
      return Quote;
    case 'bulletList':
      return List;
    case 'orderedList':
      return ListOrdered;
    case 'taskList':
      return CheckSquare;
    case 'codeBlock':
      return Code2;
    case 'table':
      return Table;
    case 'image':
    case 'imageUpload':
      return ImageIcon;
    case 'horizontalRule':
      return Minus;
    default:
      return Type;
  }
}

type TurnIntoItem = {
  key: string;
  label: string;
  icon: BlockIcon;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

const turnIntoItems: TurnIntoItem[] = [
  {
    key: 'paragraph',
    label: '正文',
    icon: Type,
    isActive: editor =>
      editor.isActive('paragraph') &&
      !editor.isActive('heading') &&
      !editor.isActive('bulletList') &&
      !editor.isActive('orderedList') &&
      !editor.isActive('taskList') &&
      !editor.isActive('blockquote') &&
      !editor.isActive('codeBlock'),
    run: editor => editor.chain().focus().setParagraph().run()
  },
  {
    key: 'heading1',
    label: '标题 1',
    icon: Heading1,
    isActive: editor => editor.isActive('heading', { level: 1 }),
    run: editor => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    key: 'heading2',
    label: '标题 2',
    icon: Heading2,
    isActive: editor => editor.isActive('heading', { level: 2 }),
    run: editor => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    key: 'heading3',
    label: '标题 3',
    icon: Heading3,
    isActive: editor => editor.isActive('heading', { level: 3 }),
    run: editor => editor.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    key: 'bulletList',
    label: '无序列表',
    icon: List,
    isActive: editor => editor.isActive('bulletList'),
    run: editor => editor.chain().focus().toggleBulletList().run()
  },
  {
    key: 'orderedList',
    label: '有序列表',
    icon: ListOrdered,
    isActive: editor => editor.isActive('orderedList'),
    run: editor => editor.chain().focus().toggleOrderedList().run()
  },
  {
    key: 'taskList',
    label: '任务列表',
    icon: CheckSquare,
    isActive: editor => editor.isActive('taskList'),
    run: editor => editor.chain().focus().toggleTaskList().run()
  },
  {
    key: 'blockquote',
    label: '引用',
    icon: Quote,
    isActive: editor => editor.isActive('blockquote'),
    run: editor => editor.chain().focus().toggleBlockquote().run()
  },
  {
    key: 'codeBlock',
    label: '代码块',
    icon: Code2,
    isActive: editor => editor.isActive('codeBlock'),
    run: editor => editor.chain().focus().toggleCodeBlock().run()
  },
  {
    key: 'table',
    label: '表格',
    icon: Table,
    isActive: editor => editor.isActive('table'),
    run: editor =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  },
  {
    key: 'divider',
    label: '分割线',
    icon: Minus,
    isActive: editor => editor.isActive('horizontalRule'),
    run: editor => editor.chain().focus().setHorizontalRule().run()
  }
];

/** 左侧图标打开转换菜单，右侧句柄拖拽块；空段只显示加号 */
export const BlockDragHandle: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const [nodePos, setNodePos] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { refs, floatingStyles } = useFloating({
    open: menuOpen,
    placement: 'right-start',
    strategy: 'fixed',
    middleware: [
      offset({ mainAxis: DRAG_HANDLE_GAP, crossAxis: -8 }),
      flip({ fallbackPlacements: ['left-start', 'right-end', 'left-end'] }),
      shift({ padding: MENU_VIEWPORT_PADDING }),
      size({
        padding: MENU_VIEWPORT_PADDING,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.min(MENU_MAX_HEIGHT, availableHeight)}px`;
        }
      })
    ],
    whileElementsMounted: autoUpdate
  });
  const setTriggerRef = useMergeRefs([triggerRef, refs.setReference]);
  const setMenuRef = useMergeRefs([menuRef, refs.setFloating]);

  const selectionState = useEditorState({
    editor,
    selector: ctx => ({
      hasTextSelection: isTextSelectionActive(ctx.editor),
      docSize: ctx.editor?.state.doc.content.size ?? 0
    })
  });

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }
    setEditorMeta(editor, 'lockDragHandle', menuOpen || isMobile);
  }, [editor, menuOpen, isMobile]);

  useEffect(() => {
    if (nodePos < 0) {
      return;
    }
    const docSize = selectionState?.docSize ?? 0;
    if (nodePos > docSize) {
      setNodePos(-1);
      setMenuOpen(false);
    }
  }, [nodePos, selectionState?.docSize]);

  useEffect(() => {
    if (!editor || !getNodeAtPos(editor.state.doc, nodePos)) {
      return;
    }
    let nodeDom: Node | null = null;
    try {
      nodeDom = editor.view.nodeDOM(nodePos) as Node | null;
    } catch {
      return;
    }
    if (!(nodeDom instanceof HTMLElement)) {
      return;
    }
    nodeDom.classList.add('atiptap-notion-block-active');
    return () => {
      nodeDom.classList.remove('atiptap-notion-block-active');
    };
  }, [editor, nodePos]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    if (editor) {
      setEditorMeta(editor, 'hideDragHandle', true);
    }
  }, [editor]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      closeMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  const handleNodeChange = useCallback(
    ({ node: nextNode, pos }: { node: ProseMirrorNode | null; editor: Editor; pos: number }) => {
      setNodePos(typeof pos === 'number' ? pos : -1);
      if (!nextNode || pos < 0) {
        setMenuOpen(false);
      }
    },
    []
  );

  const handleDragStart = useCallback(() => {
    setDragging(true);
    setMenuOpen(false);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    editor?.view.focus();
  }, [editor]);

  const openMenu = () => {
    setMenuOpen(open => !open);
  };

  const selectCurrentBlock = () => {
    if (!editor || nodePos < 0) {
      return;
    }
    selectBlockNode(editor, nodePos);
  };

  const onHandleMouseDown = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-drag-grip]')) {
      event.preventDefault();
    }
  };

  const runTurnInto = (item: TurnIntoItem) => {
    if (!editor || nodePos < 0) {
      return;
    }
    selectBlockNode(editor, nodePos);
    item.run(editor);
    closeMenu();
  };

  if (!editor) {
    return null;
  }

  const docSize = selectionState?.docSize ?? 0;
  const currentNode = nodePos >= 0 && nodePos <= docSize ? getNodeAtPos(editor.state.doc, nodePos) : null;
  const currentPos = currentNode ? nodePos : -1;
  const TypeIcon = getBlockTypeIcon(currentNode);
  const isEmptyParagraph = currentNode?.type.name === 'paragraph' && currentNode.content.size === 0;
  const hidden = dragging || Boolean(selectionState?.hasTextSelection);
  const canMoveUp = canMoveBlock(editor, -1, currentPos);
  const canMoveDown = canMoveBlock(editor, 1, currentPos);

  const blockMenu = menuOpen ? (
    <FloatingPortal>
      <div
        ref={setMenuRef}
        className="atiptap-notion-drag-menu"
        role="menu"
        style={floatingStyles}
      >
      <div className="atiptap-notion-drag-menu__label">转为</div>
      {turnIntoItems.map(item => {
        const ItemIcon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            className="atiptap-notion-drag-menu__item"
            data-active={item.isActive(editor) ? 'true' : 'false'}
            onClick={() => runTurnInto(item)}
          >
            <ItemIcon size={15} />
            {item.label}
          </button>
        );
      })}
      <div className="atiptap-notion-drag-menu__divider" />
      {currentNode?.type.name === 'image' ? (
        <button
          type="button"
          className="atiptap-notion-drag-menu__item"
          onClick={() => {
            if (nodePos >= 0) {
              selectBlockNode(editor, nodePos);
            }
            void downloadSelectedImage(editor);
            closeMenu();
          }}
        >
          <Download size={15} />
          下载图片
        </button>
      ) : null}
      {currentNode?.type.name === 'table' ? (
        <>
          <button
            type="button"
            className="atiptap-notion-drag-menu__item"
            onClick={() => {
              if (nodePos >= 0) {
                selectBlockNode(editor, nodePos);
              }
              setTableAlign(editor, 'left');
              closeMenu();
            }}
          >
            <AlignLeft size={15} />
            表格居左
          </button>
          <button
            type="button"
            className="atiptap-notion-drag-menu__item"
            onClick={() => {
              if (nodePos >= 0) {
                selectBlockNode(editor, nodePos);
              }
              setTableAlign(editor, 'center');
              closeMenu();
            }}
          >
            <AlignCenter size={15} />
            表格居中
          </button>
          <button
            type="button"
            className="atiptap-notion-drag-menu__item"
            onClick={() => {
              if (nodePos >= 0) {
                selectBlockNode(editor, nodePos);
              }
              setTableAlign(editor, 'right');
              closeMenu();
            }}
          >
            <AlignRight size={15} />
            表格居右
          </button>
          <button
            type="button"
            className="atiptap-notion-drag-menu__item"
            onClick={() => {
              if (nodePos >= 0) {
                selectBlockNode(editor, nodePos);
              }
              fitTableToWidth(editor);
              closeMenu();
            }}
          >
            <Maximize2 size={15} />
            适应宽度
          </button>
          <button
            type="button"
            className="atiptap-notion-drag-menu__item"
            onClick={() => {
              if (nodePos >= 0) {
                selectBlockNode(editor, nodePos);
              }
              clearEntireTable(editor, nodePos);
              closeMenu();
            }}
          >
            清空表格
          </button>
        </>
      ) : null}
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() => {
          copyNodeMarkdown(editor, nodePos);
          closeMenu();
        }}
      >
        <Copy size={15} />
        复制 Markdown
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item"
        onClick={() => {
          if (nodePos >= 0) {
            selectBlockNode(editor, nodePos);
          }
          duplicateNode(editor);
          closeMenu();
        }}
      >
        <Copy size={15} />
        创建副本
      </button>
      <button
        type="button"
        className="atiptap-notion-drag-menu__item atiptap-notion-drag-menu__item--danger"
        onClick={() => {
          if (nodePos >= 0) {
            selectBlockNode(editor, nodePos);
          }
          deleteNode(editor);
          closeMenu();
        }}
      >
        <Trash2 size={15} />
        删除
      </button>
      </div>
    </FloatingPortal>
  ) : null;

  return (
    <DragHandle
      editor={editor}
      className="atiptap-notion-drag"
      nested={NESTED_DRAG_OPTIONS}
      computePositionConfig={DRAG_POSITION_CONFIG}
      onNodeChange={handleNodeChange}
      onElementDragStart={handleDragStart}
      onElementDragEnd={handleDragEnd}
    >
      <div
        className="atiptap-notion-drag-group"
        style={
          {
            '--drag-handle-main-axis-offset': `${DRAG_HANDLE_GAP}px`,
            ...(hidden ? { opacity: 0, pointerEvents: 'none' } : {})
          } as React.CSSProperties
        }
        onMouseDown={onHandleMouseDown}
      >
        {isMobile ? (
          <div className="atiptap-notion-move">
            <button
              type="button"
              className="atiptap-notion-drag-trigger atiptap-notion-drag-trigger--add"
              title="上移"
              disabled={!canMoveUp}
              onMouseDown={event => event.preventDefault()}
              onClick={() => moveBlock(editor, -1, currentPos)}
            >
              <ChevronUp size={15} />
            </button>
            <button
              type="button"
              className="atiptap-notion-drag-trigger atiptap-notion-drag-trigger--add"
              title="下移"
              disabled={!canMoveDown}
              onMouseDown={event => event.preventDefault()}
              onClick={() => moveBlock(editor, 1, currentPos)}
            >
              <ChevronDown size={15} />
            </button>
            {isEmptyParagraph ? (
              <button
                type="button"
                className="atiptap-notion-drag-trigger atiptap-notion-drag-trigger--add"
                title="插入块"
                onMouseDown={event => event.preventDefault()}
                onClick={() => insertSlashAtNode(editor, currentNode, currentPos)}
              >
                <Plus size={15} />
              </button>
            ) : (
              <button
                ref={setTriggerRef}
                type="button"
                className="atiptap-notion-drag-trigger atiptap-notion-drag-trigger--add"
                title="转换为"
                data-open={menuOpen ? 'true' : 'false'}
                draggable={false}
                onMouseDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectCurrentBlock();
                }}
                onClick={openMenu}
              >
                {TypeIcon ? <TypeIcon size={15} /> : <GripVertical size={15} />}
              </button>
            )}
          </div>
        ) : isEmptyParagraph ? (
          <button
            type="button"
            className="atiptap-notion-drag-trigger atiptap-notion-drag-trigger--add"
            title="插入块"
            onMouseDown={event => event.preventDefault()}
            onClick={() => insertSlashAtNode(editor, currentNode, currentPos)}
          >
            <Plus size={15} />
          </button>
        ) : (
          <div className="atiptap-notion-drag-split" data-open={menuOpen ? 'true' : 'false'}>
            <button
              ref={setTriggerRef}
              type="button"
              className="atiptap-notion-drag-split__type"
              title="转换为"
              data-open={menuOpen ? 'true' : 'false'}
              draggable={false}
              onMouseDown={event => {
                event.preventDefault();
                event.stopPropagation();
                selectCurrentBlock();
              }}
              onClick={openMenu}
            >
              {TypeIcon ? <TypeIcon size={15} className="atiptap-notion-drag-type-icon" /> : <Type size={15} />}
            </button>
            <span
              data-drag-grip
              className="atiptap-notion-drag-split__grip"
              title="拖拽"
              onMouseDown={selectCurrentBlock}
            >
              <GripVertical size={14} className="atiptap-notion-drag-grip" />
            </span>
          </div>
        )}
      </div>
      {blockMenu}
    </DragHandle>
  );
};
