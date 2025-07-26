import { useEffect } from 'react';

type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      shortcuts.forEach(shortcut => {
        const ctrlOrCmd = (shortcut.ctrl && event.ctrlKey) || (shortcut.cmd && event.metaKey);
        const shift = !shortcut.shift || event.shiftKey;
        const alt = !shortcut.alt || event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (shortcut.ctrl || shortcut.cmd ? ctrlOrCmd : true) &&
          shift &&
          alt
        ) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}