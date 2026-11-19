import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  className?: string;
}

const ThemeToggle: React.FC<Props> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition hover:border-line-strong hover:text-brand ${className}`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
};

export default ThemeToggle;
