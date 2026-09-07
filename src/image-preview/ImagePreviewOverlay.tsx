import classNames from 'classnames';
import {
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './image-preview.css';

const SCALE_MIN = 0.5;
const SCALE_MAX = 5;
const SCALE_STEP = 0.5;
const WHEEL_STEP = 0.2;
const CLOSE_MS = 200;
const EASE = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

export type ImagePreviewOverlayProps = {
  src: string;
  alt?: string;
  onClose: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImagePreviewOverlay({ src, alt = '', onClose }: ImagePreviewOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [flipX, setFlipX] = useState(1);
  const [flipY, setFlipY] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const requestClose = useCallback(() => {
    if (leaving) {
      return;
    }
    setLeaving(true);
    window.setTimeout(() => onCloseRef.current(), CLOSE_MS);
  }, [leaving]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose();
        return;
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setScale(current => clamp(current + SCALE_STEP, SCALE_MIN, SCALE_MAX));
        return;
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        setScale(current => clamp(current - SCALE_STEP, SCALE_MIN, SCALE_MAX));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [requestClose]);

  useEffect(() => {
    const node = overlayRef.current;
    if (!node) {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = event.deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP;
      setScale(current => clamp(Number((current + next).toFixed(2)), SCALE_MIN, SCALE_MAX));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    if (scale <= 1) {
      setOffset({ x: 0, y: 0 });
    }
  }, [scale]);

  const stop = (event: React.MouseEvent | React.PointerEvent) => {
    event.stopPropagation();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (event.button !== 0 || scale <= 1) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y
    };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    setOffset({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!dragRef.current) {
      return;
    }
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setScale(current => (current > 1 ? 1 : 2));
  };

  const zoomBy = (delta: number) => {
    setScale(current => clamp(Number((current + delta).toFixed(2)), SCALE_MIN, SCALE_MAX));
  };

  const visualScale = entered && !leaving ? scale : scale * 0.96;
  const transform = `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotate}deg) scale(${
    visualScale * flipX
  }, ${visualScale * flipY})`;

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={overlayRef}
      className={classNames('atiptap-image-preview', { 'is-open': entered && !leaving })}
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onClick={requestClose}
    >
      <img
        className={classNames('atiptap-image-preview__img', {
          'is-dragging': dragging,
          'is-zoomable': scale > 1
        })}
        src={src}
        alt={alt}
        draggable={false}
        style={{ transform, transitionTimingFunction: EASE }}
        onClick={stop}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div className="atiptap-image-preview__ops" onClick={stop}>
        <PreviewOp title="缩小" disabled={scale <= SCALE_MIN} onClick={() => zoomBy(-SCALE_STEP)}>
          <ZoomOut />
        </PreviewOp>
        <PreviewOp title="放大" disabled={scale >= SCALE_MAX} onClick={() => zoomBy(SCALE_STEP)}>
          <ZoomIn />
        </PreviewOp>
        <PreviewOp title="向左旋转" onClick={() => setRotate(current => current - 90)}>
          <RotateCcw />
        </PreviewOp>
        <PreviewOp title="向右旋转" onClick={() => setRotate(current => current + 90)}>
          <RotateCw />
        </PreviewOp>
        <PreviewOp title="水平翻转" onClick={() => setFlipX(current => current * -1)}>
          <FlipHorizontal2 />
        </PreviewOp>
        <PreviewOp title="垂直翻转" onClick={() => setFlipY(current => current * -1)}>
          <FlipVertical2 />
        </PreviewOp>
        <PreviewOp title="关闭预览" onClick={requestClose}>
          <X />
        </PreviewOp>
      </div>
    </div>,
    document.body
  );
}

function PreviewOp({
  title,
  disabled,
  onClick,
  children
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="atiptap-image-preview__op"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function getPreviewableImageSrc(target: EventTarget | null): string | null {
  if (!(target instanceof HTMLImageElement)) {
    return null;
  }
  if (target.closest('.atiptap-image-preview')) {
    return null;
  }
  const src = target.currentSrc || target.src;
  return src || null;
}
