import React, { useCallback, useState } from 'react';
import { ImagePreviewOverlay } from './ImagePreviewOverlay';

export type PreviewableImageProps = {
  src: string;
  alt?: string;
  width?: string;
  className?: string;
  /** 有回调则交给业务，否则走内置灯箱 */
  onPreviewClick?: (src: string, event: React.MouseEvent) => void;
  preview?: boolean;
};

export function PreviewableImage({
  src,
  alt = '',
  width,
  className,
  onPreviewClick,
  preview = true
}: PreviewableImageProps) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!preview || !src) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (onPreviewClick) {
        onPreviewClick(src, event);
        return;
      }
      setOpen(true);
    },
    [onPreviewClick, preview, src]
  );

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          width: width || 'auto',
          maxWidth: '100%',
          height: 'auto',
          cursor: preview ? 'zoom-in' : undefined
        }}
        onClick={handleClick}
      />
      {open ? <ImagePreviewOverlay src={src} alt={alt} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
