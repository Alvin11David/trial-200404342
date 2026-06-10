import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* eslint-disable react-refresh/only-export-components */

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "jambo-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () =>
      (typeof localStorage !== "undefined"
        ? (localStorage.getItem(storageKey) as Theme)
        : defaultTheme) || defaultTheme,
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const preferred = mq.matches ? "dark" : "light";
      root.classList.add(preferred);
      setResolvedTheme(preferred);
      root.style.colorScheme = preferred;

      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(next);
        setResolvedTheme(next);
        root.style.colorScheme = next;
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    root.classList.add(theme);
    setResolvedTheme(theme);
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(storageKey, t);
    setThemeState(t);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
