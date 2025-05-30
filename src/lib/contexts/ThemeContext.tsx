import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Define type for theme
export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * ThemeProvider manages the UI color theme (light or dark) and persists the user preference in localStorage.
 * It toggles the corresponding class (`light` or `dark`) on the <html> element so that Tailwind's `dark:` variants work.
 * Dark mode is the default theme
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // On mount, read initial theme from localStorage or system preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      updateHtmlClass(stored);
      return;
    }

    // Default to dark mode if no stored preference
    const initial: Theme = "dark";
    setTheme(initial);
    updateHtmlClass(initial);
  }, []);

  const updateHtmlClass = (value: Theme) => {
    const root = document.documentElement;
    root.classList.remove(value === "dark" ? "light" : "dark");
    root.classList.add(value);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", next);
        updateHtmlClass(next);
      }
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
} 