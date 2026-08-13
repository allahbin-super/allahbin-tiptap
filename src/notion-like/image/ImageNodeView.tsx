import { NodeSelection } from '@tiptap/pm/state';
import type { Editor, NodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isValidPosition } from './image-utils';

type ResizeParams = {
  handleUsed: 'left' | 'right';
  initialWidth: number;
  initialClientX: number;
};

export function ImageNodeView({ editor, node, updateAttributes, getPos }: NodeViewProps) {
  return (
    <ResizableImage
      src={node.attrs.src}
      alt={node.attrs.alt || ''}
      editor={editor}
      align={node.attrs['data-align'] || 'center'}
      initialWidth={node.attrs.width}
      showCaption={node.attrs.showCaption}
      hasContent={node.content.size > 0}
      nodeSize={node.nodeSize}
      onImageResize={width => updateAttributes({ width })}
      onUpdateAttributes={updateAttributes}
      getPos={getPos}
    />
  );
}

const ResizableImage: React.FC<{
  src: string;
  alt?: string;
  editor?: Editor;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  initialWidth?: number;
  showCaption?: boolean;
  hasContent?: boolean;
  onImageResize?: (width?: number) => void;
  onUpdateAttributes?: (attrs: Record<string, unknown>) => void;
  getPos: () => number | undefined;
  nodeSize?: number;
}> = ({
  src,
  alt = '',
  editor,
  minWidth = 96,
  maxWidth = 800,
  align = 'center',
  initialWidth,
  showCaption = false,
  hasContent = false,
  nodeSize,
  onImageResize,
  onUpdateAttributes,
  getPos
}) => {
  const [resizeParams, setResizeParams] = useState<ResizeParams | undefined>();
  const [width, setWidth] = useState<number | undefined>(
    initialWidth ? Number(initialWidth) : undefined
  );
  const [showHandles, setShowHandles] = useState(false);
  const isResizingRef = useRef(false);
  const isMountedRef = useRef(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor || !showCaption) {
      return;
    }
    const handleSelectionUpdate = () => {
      const pos = getPos();
      if (!isValidPosition(pos) || !nodeSize) {
        return;
      }
      const { from, to } = editor.state.selection;
      const isOutside = to < pos || from > pos + nodeSize;
      if (isOutside && !hasContent && onUpdateAttributes) {
        onUpdateAttributes({ showCaption: false });
      }
    };
    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, showCaption, hasContent, getPos, nodeSize, onUpdateAttributes]);

  const handleImageClick = useCallback(
    (event: React.MouseEvent) => {
      if (!editor || resizeParams) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const pos = getPos();
      if (isValidPosition(pos)) {
        editor.chain().focus().setNodeSelection(pos).run();
      }
    },
    [editor, getPos, resizeParams]
  );

  const onMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!resizeParams || !editor || !isMountedRef.current) {
        return;
      }
      const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
      const multiplier = align === 'center' ? 2 : 1;
      const delta =
        resizeParams.handleUsed === 'left'
          ? (resizeParams.initialClientX - clientX) * multiplier
          : (clientX - resizeParams.initialClientX) * multiplier;
      const effectiveMax = editor.view.dom?.firstElementChild?.clientWidth || maxWidth;
      const next = Math.min(Math.max(resizeParams.initialWidth + delta, minWidth), effectiveMax);
      setWidth(next);
      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${next}px`;
      }
    },
    [align, editor, maxWidth, minWidth, resizeParams]
  );

  const onUp = useCallback(() => {
    if (!editor || !isMountedRef.current) {
      return;
    }
    if (!resizeParams) {
      return;
    }
    const wasNodeSelection =
      editor.state.selection instanceof NodeSelection &&
      editor.state.selection.node.type.name === 'image';
    setResizeParams(undefined);
    onImageResize?.(width);
    const pos = getPos();
    if (isValidPosition(pos) && wasNodeSelection) {
      editor.chain().focus().setNodeSelection(pos).run();
    }
    isResizingRef.current = false;
  }, [editor, getPos, onImageResize, resizeParams, width]);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove, onUp]);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  const startResize = (handleUsed: 'left' | 'right', clientX: number) => {
    setResizeParams({
      handleUsed,
      initialWidth: wrapperRef.current?.clientWidth ?? minWidth,
      initialClientX: clientX
    });
    isResizingRef.current = true;
  };

  const shouldShowCaption = showCaption || hasContent;

  return (
    <NodeViewWrapper
      onMouseEnter={() => {
        if (editor?.isEditable) setShowHandles(true);
      }}
      onMouseLeave={() => {
        if (!resizeParams) setShowHandles(false);
      }}
      data-align={align}
      className="atiptap-notion-image"
    >
      <div
        ref={wrapperRef}
        className="atiptap-notion-image__container"
        style={{ width: width ? `${width}px` : 'fit-content' }}
      >
        <div className="atiptap-notion-image__content">
          <img
            src={src}
            alt={alt}
            className="atiptap-notion-image__img"
            contentEditable={false}
            draggable={false}
            onClick={handleImageClick}
          />
          {showHandles && editor?.isEditable ? (
            <>
              <div
                className="atiptap-notion-image__handle atiptap-notion-image__handle--left"
                onMouseDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize('left', event.clientX);
                }}
              />
              <div
                className="atiptap-notion-image__handle atiptap-notion-image__handle--right"
                onMouseDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize('right', event.clientX);
                }}
              />
            </>
          ) : null}
        </div>
        <NodeViewContent
          as="div"
          className={
            shouldShowCaption
              ? 'atiptap-notion-image__caption'
              : 'atiptap-notion-image__caption is-collapsed'
          }
          data-placeholder="添加图片说明..."
        />
      </div>
    </NodeViewWrapper>
  );
};
