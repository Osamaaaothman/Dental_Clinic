import AnimatedButton from '../AnimatedButton.jsx';
import { useThemeStore } from '../../store/themeStore.js';

function Header({ title, subtitle, onMenuClick, actions }) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-base-300/60 bg-base-100/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm lg:hidden"
            onClick={onMenuClick}
            aria-label="open navigation"
          >
            ☰
          </button>
          <div>
            <h1 className="text-base font-bold text-base-content sm:text-lg">{title}</h1>
            {subtitle ? <p className="text-xs text-base-content/60">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={toggleTheme}
            aria-label="toggle theme"
          >
            {theme === 'clinic-dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
