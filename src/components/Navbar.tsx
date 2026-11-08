import { Moon, Plus, Sun } from "lucide-react";
import type { Theme } from "../hooks/useTheme";

interface NavbarProps {
  theme: Theme;
  onToggleTheme: () => void;
  onAddCamera: () => void;
}

/** Top bar: brand, add-camera action, and theme switch. Label collapses to an icon on phones. */
export function Navbar({ theme, onToggleTheme, onAddCamera }: NavbarProps) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-panel px-3 sm:px-4">
      <span className="truncate text-xs font-semibold tracking-[0.18em] sm:text-sm sm:tracking-[0.2em]">ROADGUARD</span>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" className="btn-primary" onClick={onAddCamera} aria-label="Add camera">
          <Plus size={13} />
          <span className="hidden sm:inline">Add camera</span>
        </button>
        <button
          type="button"
          className="btn px-2"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
