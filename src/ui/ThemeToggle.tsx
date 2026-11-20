import { useState } from 'react';
import { currentTheme, setTheme, type Theme } from './theme';
import { MoonIcon, SunIcon } from './icons';

export function ThemeToggle({ className = 'icon-btn' }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>(currentTheme);
  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
    window.dispatchEvent(new CustomEvent('yg-theme', { detail: next }));
  };
  return (
    <button className={className} onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
