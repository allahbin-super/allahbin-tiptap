import { NodeSelection } from '@tiptap/pm/state';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import React, { useCallback, useMemo } from 'react';
import { getFileKind, resolveMime } from './file-kind';
import { renderDefaultFileView } from './DefaultFileViews';
import { useFileNodeContext, type FileNodeInfo } from './FileNodeContext';

function isValidPosition(pos: number | undefined): pos is number {
  return typeof pos === 'number' && pos >= 0;
}

export const FileNodeView: React.FC<NodeViewProps> = ({ editor, node, getPos, selected }) => {
  const { fileRenderers, onFileClick } = useFileNodeContext();
  const src = String(node.attrs.src || '');
  const name = String(node.attrs.name || '');
  const mime = resolveMime(node.attrs.mime, name);
  const size =
    typeof node.attrs.size === 'number'
      ? node.attrs.size
      : node.attrs.size == null
        ? null
        : Number(node.attrs.size);
  const kind = getFileKind(mime, name);

  const info: FileNodeInfo = useMemo(
    () => ({
      kind,
      src,
      name,
      mime,
      size: Number.isFinite(size as number) ? (size as number) : null
    }),
    [kind, src, name, mime, size]
  );

  const selectNode = useCallback(
    (event?: React.MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (!editor) {
        return;
      }
      const pos = getPos();
      if (isValidPosition(pos)) {
        editor.chain().focus().setNodeSelection(pos).run();
      }
    },
    [editor, getPos]
  );

  const handleActivate = useCallback(
    (event: React.MouseEvent) => {
      selectNode(event);
      if (onFileClick) {
        onFileClick(info, event);
        return;
      }
      if (info.kind === 'file' && info.src) {
        window.open(info.src, '_blank', 'noopener,noreferrer');
      }
    },
    [info, onFileClick, selectNode]
  );

  const defaultRender = useCallback(
    () => renderDefaultFileView({ ...info, selected, onActivate: handleActivate }),
    [info, selected, handleActivate]
  );

  const custom = fileRenderers?.[kind];
  const content = custom
    ? custom({
        ...info,
        selected: Boolean(selected),
        defaultRender
      })
    : defaultRender();

  const isNodeSelected =
    selected ||
    (editor?.state.selection instanceof NodeSelection &&
      editor.state.selection.node === node);

  return (
    <NodeViewWrapper
      className={`atiptap-notion-file-node${isNodeSelected ? ' is-selected' : ''}`}
      data-file-kind={kind}
      onClick={(event: React.MouseEvent) => {
        // 点在媒体控件上不抢选中，其余区域选中节点
        const target = event.target as HTMLElement;
        if (target.closest('video, audio, .atiptap-notion-file--card')) {
          return;
        }
        selectNode(event);
      }}
    >
      {content}
    </NodeViewWrapper>
  );
};
