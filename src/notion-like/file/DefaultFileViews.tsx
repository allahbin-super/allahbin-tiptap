import { File as FileIcon, Film, Music } from 'lucide-react';
import React from 'react';
import type { FileKind } from './file-kind';
import { formatFileSize } from './file-kind';
import type { FileNodeInfo } from './FileNodeContext';

type DefaultViewProps = FileNodeInfo & {
  selected?: boolean;
  onActivate?: (event: React.MouseEvent) => void;
};

function KindIcon({ kind }: { kind: FileKind }) {
  if (kind === 'video') {
    return <Film size={18} />;
  }
  if (kind === 'audio') {
    return <Music size={18} />;
  }
  return <FileIcon size={18} />;
}

/** 默认视频播放器：控件不拦截点击 */
export function DefaultVideoView({ src, name, onActivate }: DefaultViewProps) {
  return (
    <div className="atiptap-notion-file atiptap-notion-file--video">
      <div
        className="atiptap-notion-file__titlebar"
        onClick={event => {
          event.preventDefault();
          onActivate?.(event);
        }}
      >
        <KindIcon kind="video" />
        <span className="atiptap-notion-file__name" title={name}>
          {name || '视频'}
        </span>
      </div>
      <video className="atiptap-notion-file__media" src={src} controls preload="metadata" />
    </div>
  );
}

/** 默认音频播放器 */
export function DefaultAudioView({ src, name, onActivate }: DefaultViewProps) {
  return (
    <div className="atiptap-notion-file atiptap-notion-file--audio">
      <div
        className="atiptap-notion-file__titlebar"
        onClick={event => {
          event.preventDefault();
          onActivate?.(event);
        }}
      >
        <KindIcon kind="audio" />
        <span className="atiptap-notion-file__name" title={name}>
          {name || '音频'}
        </span>
      </div>
      <audio className="atiptap-notion-file__audio" src={src} controls preload="metadata" />
    </div>
  );
}

/** 默认附件卡片 */
export function DefaultFileCard({ name, size, mime, onActivate }: DefaultViewProps) {
  const sizeLabel = formatFileSize(size);
  return (
    <button
      type="button"
      className="atiptap-notion-file atiptap-notion-file--card"
      onClick={event => {
        event.preventDefault();
        onActivate?.(event);
      }}
    >
      <span className="atiptap-notion-file__icon">
        <KindIcon kind="file" />
      </span>
      <span className="atiptap-notion-file__meta">
        <span className="atiptap-notion-file__name" title={name}>
          {name || '附件'}
        </span>
        <span className="atiptap-notion-file__sub">
          {[mime, sizeLabel].filter(Boolean).join(' · ') || '文件'}
        </span>
      </span>
    </button>
  );
}

export function renderDefaultFileView(props: DefaultViewProps): React.ReactNode {
  if (props.kind === 'video') {
    return <DefaultVideoView {...props} />;
  }
  if (props.kind === 'audio') {
    return <DefaultAudioView {...props} />;
  }
  return <DefaultFileCard {...props} />;
}
