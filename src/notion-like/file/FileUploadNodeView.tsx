import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { formatFileSize } from './file-kind';
import { buildMediaNodeFromUpload } from './file-actions';
import { useFileNodeContext } from './FileNodeContext';

type FileItem = {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  abortController?: AbortController;
};

function isValidPosition(pos: number | undefined): pos is number {
  return typeof pos === 'number' && pos >= 0;
}

function acceptMatches(accept: string, file: File): boolean {
  const rules = accept
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  if (!rules.length || rules.includes('*/*')) {
    return true;
  }
  return rules.some(rule => {
    if (rule.endsWith('/*')) {
      const prefix = rule.slice(0, -1);
      return file.type.startsWith(prefix);
    }
    if (rule.startsWith('.')) {
      return file.name.toLowerCase().endsWith(rule.toLowerCase());
    }
    return file.type === rule;
  });
}

export const FileUploadNodeView: React.FC<NodeViewProps> = props => {
  const { accept, limit, maxSize } = props.node.attrs as {
    accept: string;
    limit: number;
    maxSize: number;
  };
  const { fileUploader } = useFileNodeContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errorHint, setErrorHint] = useState('');

  const resolveUpload = () => {
    const optionUpload = props.extension.options.upload as
      | ((
          file: File,
          onProgress?: (event: { progress: number }) => void,
          signal?: AbortSignal
        ) => Promise<string>)
      | undefined;
    const storageUpload = props.editor.storage.fileUploader?.upload as
      | ((file: File, progress: (n: number) => void) => Promise<string>)
      | undefined;
    return { optionUpload, storageUpload: storageUpload || fileUploader };
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (maxSize && file.size > maxSize) {
      const message = `文件大小超过最大限制 (${maxSize / 1024 / 1024}MB)`;
      setErrorHint(message);
      props.extension.options.onError?.(new Error(message));
      return null;
    }

    const { optionUpload, storageUpload } = resolveUpload();
    if (!optionUpload && !storageUpload) {
      const message = '未配置 fileUploader，无法上传非图片文件';
      setErrorHint(message);
      props.extension.options.onError?.(new Error(message));
      return null;
    }

    const abortController = new AbortController();
    const fileId = `${file.name}-${Date.now()}`;
    setFileItems(prev => [
      ...prev,
      { id: fileId, file, progress: 0, status: 'uploading', abortController }
    ]);

    try {
      const src = optionUpload
        ? await optionUpload(
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
        : await storageUpload!(file, progress => {
            setFileItems(prev =>
              prev.map(item => (item.id === fileId ? { ...item, progress } : item))
            );
          });

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
    setErrorHint('');
    const selected = files.filter(file => acceptMatches(accept || '*/*', file)).slice(0, limit || 1);
    if (!selected.length) {
      setErrorHint('没有匹配的文件类型');
      return;
    }

    const nodes: ReturnType<typeof buildMediaNodeFromUpload>[] = [];
    for (const file of selected) {
      const url = await uploadFile(file);
      if (url) {
        nodes.push(buildMediaNodeFromUpload(file, url));
      }
    }
    if (!nodes.length) {
      return;
    }
    const pos = props.getPos();
    if (!isValidPosition(pos)) {
      return;
    }
    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + props.node.nodeSize })
      .insertContentAt(pos, nodes)
      .run();
    props.editor.commands.setNodeSelection(pos);
  };

  const hasFiles = fileItems.length > 0;
  const { optionUpload, storageUpload } = resolveUpload();
  const hasUploader = Boolean(optionUpload || storageUpload);

  return (
    <NodeViewWrapper className="atiptap-notion-upload" tabIndex={0}>
      {!hasFiles ? (
        <div
          className={`atiptap-notion-upload__dropzone${dragOver ? ' is-over' : ''}${
            !hasUploader ? ' is-disabled' : ''
          }`}
          onClick={() => {
            if (!hasUploader) {
              setErrorHint('未配置 fileUploader，无法上传非图片文件');
              return;
            }
            inputRef.current?.click();
          }}
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
            if (!hasUploader) {
              setErrorHint('未配置 fileUploader，无法上传非图片文件');
              return;
            }
            void handleUpload(Array.from(event.dataTransfer.files));
          }}
        >
          <Upload size={22} />
          <div>
            <div className="atiptap-notion-upload__title">
              {hasUploader ? '点击上传或拖拽文件' : '未配置文件上传'}
            </div>
            <div className="atiptap-notion-upload__hint">
              {hasUploader
                ? maxSize
                  ? `最多 ${limit} 个文件，每个不超过 ${maxSize / 1024 / 1024}MB`
                  : `最多 ${limit} 个文件`
                : '请传入 fileUploader，上传后仅保存 URL'}
            </div>
            {errorHint ? <div className="atiptap-notion-upload__error">{errorHint}</div> : null}
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
