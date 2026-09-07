/** 把 JSON / HTML 里的宽高转成可用的 CSS 长度。数字补 px，已有单位的字符串原样返回。 */
export function toCssSize(value: unknown): string | undefined {
  if (value === null || value === undefined || value === false) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? `${value}px` : undefined;
  }
  const str = String(value).trim();
  if (!str) {
    return undefined;
  }
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const num = Number(str);
    return Number.isFinite(num) && num > 0 ? `${num}px` : undefined;
  }
  return str;
}
