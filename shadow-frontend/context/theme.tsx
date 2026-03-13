// context/theme.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { KEYS, getStr, setStr } from "./storage";

export const DARK_COLORS = {
  bg: "#0E0E0E",
  fg: "#fff",
  muted: "#A0A3A7",
  accent: "#25b8a6",
  onAccent: "#000",
  box: "#111418",
  border: "#2A2D30",
  card: "#111",
};

export const LIGHT_COLORS = {
  bg: "#d9cfc1",
  fg: "#66655d",
  muted: "#666",
  accent: "#00E6C3",
  onAccent: "#000",
  box: "#FFF",
  border: "#E4DDD2",
  card: "#f4f7ee",
};

const ThemeCtx = createContext<{
  colors: typeof DARK_COLORS | typeof LIGHT_COLORS;
  isDark: boolean;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await getStr(KEYS.themeMode, "dark");
      setIsDark(saved === "dark");
    })();
  }, []);

  useEffect(() => {
    setStr(KEYS.themeMode, isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark((p) => !p);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeCtx.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}
