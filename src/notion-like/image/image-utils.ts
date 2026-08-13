export function isValidPosition(pos: number | null | undefined): pos is number {
  return typeof pos === 'number' && pos >= 0;
}

export function sanitizeUrl(inputUrl: string, baseUrl: string): string {
  try {
    const url = new URL(inputUrl, baseUrl);
    if (['http:', 'https:', 'data:', 'blob:'].includes(url.protocol)) {
      return url.href;
    }
  } catch {
    /* ignore */
  }
  return '#';
}

function getFileExtension(url: string, contentType?: string): string {
  const urlMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  if (urlMatch?.[1]) {
    return `.${urlMatch[1].toLowerCase()}`;
  }
  const mimeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  };
  return (contentType && mimeMap[contentType.toLowerCase()]) || '.jpg';
}

function tryDirectDownload(url: string, filename: string): boolean {
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(filename);
  const finalFilename = hasExtension ? filename : filename + getFileExtension(url);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}

async function tryFetchDownload(url: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(filename);
    const finalFilename = hasExtension
      ? filename
      : filename + getFileExtension(url, response.headers.get('content-type') || undefined);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    return false;
  }
}

export async function downloadImageUrl(src: string, filename?: string): Promise<boolean> {
  const sanitized = sanitizeUrl(src, window.location.href);
  if (sanitized === '#') {
    return false;
  }
  const name = filename || `image-${Date.now()}`;
  if (sanitized.startsWith('data:') || sanitized.startsWith(window.location.origin)) {
    return tryDirectDownload(sanitized, name);
  }
  const fetched = await tryFetchDownload(sanitized, name);
  if (fetched) {
    return true;
  }
  window.open(sanitized, '_blank');
  return true;
}
