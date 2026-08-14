export type FileKind = 'video' | 'audio' | 'file';

const EXT_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  md: 'text/markdown'
};

/** 从文件名扩展名推断 MIME */
export function inferMimeFromName(name?: string | null): string {
  if (!name) {
    return '';
  }
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return EXT_MIME[ext] || '';
}

/** 规范化 mime：优先传入值，否则按文件名推断 */
export function resolveMime(mime?: string | null, name?: string | null): string {
  const trimmed = (mime || '').trim();
  if (trimmed) {
    return trimmed;
  }
  return inferMimeFromName(name);
}

/** 运行时 kind，不入库 */
export function getFileKind(mime?: string | null, name?: string | null): FileKind {
  const resolved = resolveMime(mime, name).toLowerCase();
  if (resolved.startsWith('video/')) {
    return 'video';
  }
  if (resolved.startsWith('audio/')) {
    return 'audio';
  }
  return 'file';
}

export function isImageMime(mime?: string | null, name?: string | null): boolean {
  const resolved = resolveMime(mime, name).toLowerCase();
  if (resolved.startsWith('image/')) {
    return true;
  }
  const ext = (name || '').split('.').pop()?.toLowerCase() || '';
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) {
    return '';
  }
  if (bytes === 0) {
    return '0 字节';
  }
  const units = ['字节', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
