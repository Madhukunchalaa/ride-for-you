import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-dark-200/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-300 relative overflow-hidden group"
      aria-label="Toggle Theme"
    >
      <div className="relative z-10">
        {theme === 'dark' ? (
          <Sun size={20} className="animate-in spin-in-180 duration-500" />
        ) : (
          <Moon size={20} className="animate-in spin-in-180 duration-500" />
        )}
      </div>
      <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors"></div>
    </button>
  );
}
