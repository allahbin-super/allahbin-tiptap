const isWindows = () => typeof navigator !== 'undefined' && /win/i.test(navigator.platform);

export const command = isWindows() ? 'Ctrl' : '⌘';

export const option = isWindows() ? 'Alt' : 'Option';
