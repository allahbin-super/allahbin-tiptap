import { offset } from '@floating-ui/react';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  CheckSquare,
  Code2,
  Copy,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Table,
  Trash2,
  Type
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  deleteNode,
  duplicateNode,
  insertSlashAtNode,
  isTextSelectionActive,
  selectBlockNode,
  setEditorMeta
} from './block-actions';

type BlockIcon = React.ComponentType<{ className?: string; size?: number }>;

const DRAG_HANDLE_GAP = 8;

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
  }
];

/** 块拖拽句柄：胶囊句柄、空段加号、点击出块操作菜单 */
export const BlockDragHandle: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const [node, setNode] = useState<ProseMirrorNode | null>(null);
  const [nodePos, setNodePos] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectionState = useEditorState({
    editor,
    selector: ctx => ({
      hasTextSelection: isTextSelectionActive(ctx.editor)
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
    setEditorMeta(editor, 'lockDragHandle', menuOpen);
  }, [editor, menuOpen]);

  useEffect(() => {
    if (!editor || nodePos < 0) {
      return;
    }
    const nodeDom = editor.view.nodeDOM(nodePos);
    if (!(nodeDom instanceof HTMLElement)) {
      return;
    }
    nodeDom.classList.add('atiptap-notion-block-active');
    return () => {
      nodeDom.classList.remove('atiptap-notion-block-active');
    };
  }, [editor, node, nodePos]);

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
      if (nextNode) {
        setNode(nextNode);
      }
      setNodePos(pos);
      if (pos < 0) {
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
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 180;
      const gap = 8;
      const canOpenRight = rect.right + gap + menuWidth < window.innerWidth;
      setMenuPos({
        top: rect.top,
        left: canOpenRight ? rect.right + gap : Math.max(8, rect.left - gap - menuWidth)
      });
    }
    setMenuOpen(open => !open);
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

  const TypeIcon = getBlockTypeIcon(node);
  const isEmptyParagraph = node?.type.name === 'paragraph' && node.content.size === 0;
  const hidden = isMobile || dragging || Boolean(selectionState?.hasTextSelection);

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
        style={{
          '--drag-handle-main-axis-offset': `${DRAG_HANDLE_GAP}px`,
          ...(hidden ? { opacity: 0, pointerEvents: 'none' } : {})
        } as React.CSSProperties}
      >
        {isEmptyParagraph ? (
          <button
            type="button"
            className="atiptap-notion-drag-trigger atiptap-notion-drag-trigger--add"
            title="插入块"
            onMouseDown={event => event.preventDefault()}
            onClick={() => insertSlashAtNode(editor, node, nodePos)}
          >
            <Plus size={15} />
          </button>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            className="atiptap-notion-drag-trigger"
            title="点击查看操作，长按拖拽"
            data-open={menuOpen ? 'true' : 'false'}
            style={{ cursor: 'grab', ...(menuOpen ? { pointerEvents: 'none' } : undefined) }}
            onMouseDown={event => {
              event.preventDefault();
              if (nodePos >= 0) {
                selectBlockNode(editor, nodePos);
              }
            }}
            onClick={openMenu}
          >
            {TypeIcon ? <TypeIcon size={15} className="atiptap-notion-drag-type-icon" /> : null}
            <GripVertical size={10} className="atiptap-notion-drag-grip" />
          </button>
        )}
      </div>
      {menuOpen
        ? createPortal(
            <div
              ref={menuRef}
              className="atiptap-notion-drag-menu"
              role="menu"
              style={{ top: menuPos.top, left: menuPos.left }}
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
                复制块
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
            </div>,
            document.body
          )
        : null}
    </DragHandle>
  );
};
