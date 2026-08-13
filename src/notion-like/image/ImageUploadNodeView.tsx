import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { fileToDataUrl } from '../../image-upload';
import { isValidPosition } from './image-utils';

type FileItem = {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  abortController?: AbortController;
};

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 字节';
  const units = ['字节', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${units[i]}`;
}

export const ImageUploadNodeView: React.FC<NodeViewProps> = props => {
  const { accept, limit, maxSize } = props.node.attrs as {
    accept: string;
    limit: number;
    maxSize: number;
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (maxSize && file.size > maxSize) {
      props.extension.options.onError?.(
        new Error(`文件大小超过最大限制 (${maxSize / 1024 / 1024}MB)`)
      );
      return null;
    }

    const abortController = new AbortController();
    const fileId = `${file.name}-${Date.now()}`;
    setFileItems(prev => [
      ...prev,
      { id: fileId, file, progress: 0, status: 'uploading', abortController }
    ]);

    try {
      const upload = props.extension.options.upload as
        | ((
            file: File,
            onProgress?: (event: { progress: number }) => void,
            signal?: AbortSignal
          ) => Promise<string>)
        | undefined;
      const storageUpload = props.editor.storage.imageUploader?.upload;
      const src = upload
        ? await upload(
            file,
            event => {
              setFileItems(prev =>
                prev.map(item =>
                  item.id === fileId ? { ...item, progress: event.progress } : item
                )
              );
            },
            abortController.signal
          )
        : storageUpload
          ? await storageUpload(file, progress => {
              setFileItems(prev =>
                prev.map(item => (item.id === fileId ? { ...item, progress } : item))
              );
            })
          : await fileToDataUrl(file);

      if (!src) {
        throw new Error('上传失败');
      }
      setFileItems(prev =>
        prev.map(item =>
          item.id === fileId ? { ...item, status: 'success', progress: 100 } : item
        )
      );
      return src;
    } catch {
      setFileItems(prev =>
        prev.map(item => (item.id === fileId ? { ...item, status: 'error' } : item))
      );
      return null;
    }
  };

  const handleUpload = async (files: File[]) => {
    const images = files.filter(file => file.type.startsWith('image/')).slice(0, limit || 1);
    const urls: string[] = [];
    for (const file of images) {
      const url = await uploadFile(file);
      if (url) {
        urls.push(url);
      }
    }
    if (!urls.length) {
      return;
    }
    const pos = props.getPos();
    if (!isValidPosition(pos)) {
      return;
    }
    const imageNodes = urls.map((url, index) => ({
      type: props.extension.options.type || 'image',
      attrs: {
        src: url,
        alt: images[index]?.name || 'image',
        title: images[index]?.name || 'image'
      }
    }));
    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + props.node.nodeSize })
      .insertContentAt(pos, imageNodes)
      .run();
  };

  const hasFiles = fileItems.length > 0;

  return (
    <NodeViewWrapper className="atiptap-notion-upload" tabIndex={0}>
      {!hasFiles ? (
        <div
          className={`atiptap-notion-upload__dropzone${dragOver ? ' is-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={event => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={event => {
            event.preventDefault();
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            setDragOver(false);
            void handleUpload(Array.from(event.dataTransfer.files));
          }}
        >
          <Upload size={22} />
          <div>
            <div className="atiptap-notion-upload__title">点击上传或拖拽文件</div>
            <div className="atiptap-notion-upload__hint">
              最多 {limit} 个文件，每个不超过 {maxSize / 1024 / 1024}MB
            </div>
          </div>
        </div>
      ) : (
        <div className="atiptap-notion-upload__previews">
          {fileItems.map(item => (
            <div key={item.id} className="atiptap-notion-upload__preview">
              <div
                className="atiptap-notion-upload__progress"
                style={{ width: `${item.progress}%` }}
              />
              <span>
                {item.file.name} · {formatFileSize(item.file.size)}
                {item.status === 'uploading' ? ` · ${item.progress}%` : ''}
              </span>
              <button
                type="button"
                className="atiptap-notion-bubble__btn"
                onClick={event => {
                  event.stopPropagation();
                  item.abortController?.abort();
                  setFileItems(prev => prev.filter(current => current.id !== item.id));
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={limit > 1}
        hidden
        onChange={event => {
          const files = event.target.files;
          if (files?.length) {
            void handleUpload(Array.from(files));
          }
        }}
      />
    </NodeViewWrapper>
  );
};
