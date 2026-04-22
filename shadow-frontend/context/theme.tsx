// context/theme.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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

const SCENARIO_DARK_THEMES = {
  "team-presentation": {
    bg: "#081311",
    fg: "#F4FFFD",
    muted: "#95ABA6",
    accent: "#41DCC7",
    onAccent: "#041311",
    box: "#0D1C1A",
    border: "#173B37",
    card: "#0F241F",
  },
  "job-interview": {
    bg: "#09121E",
    fg: "#F5F8FF",
    muted: "#9BA9BF",
    accent: "#6EA8FF",
    onAccent: "#07111E",
    box: "#101A2C",
    border: "#1B2E4A",
    card: "#101B2B",
  },
  "difficult-conversation": {
    bg: "#160B0E",
    fg: "#FFF7F6",
    muted: "#C5A4A0",
    accent: "#FF8B79",
    onAccent: "#200B0F",
    box: "#261115",
    border: "#4B2329",
    card: "#241216",
  },
  "q-and-a-pressure": {
    bg: "#171207",
    fg: "#FFF8E9",
    muted: "#CDBA8F",
    accent: "#F3C95A",
    onAccent: "#1A1205",
    box: "#241B0C",
    border: "#4E3C17",
    card: "#221A0C",
  },
} as const;

const SCENARIO_LIGHT_THEMES = {
  "team-presentation": {
    bg: "#D9F0EB",
    fg: "#1F3F3A",
    muted: "#5A7872",
    accent: "#18BCA7",
    onAccent: "#071814",
    box: "#F7FCFA",
    border: "#B6DBD3",
    card: "#F2FBF8",
  },
  "job-interview": {
    bg: "#DDE8F7",
    fg: "#203049",
    muted: "#5D6F88",
    accent: "#3E87F5",
    onAccent: "#07111E",
    box: "#FAFCFF",
    border: "#B9C8E2",
    card: "#F3F7FF",
  },
  "difficult-conversation": {
    bg: "#F6E4E1",
    fg: "#4B2329",
    muted: "#7D5F62",
    accent: "#E96E5A",
    onAccent: "#240A0F",
    box: "#FFF9F8",
    border: "#E0B6AF",
    card: "#FFF4F2",
  },
  "q-and-a-pressure": {
    bg: "#F6EDD2",
    fg: "#4A3712",
    muted: "#7A6235",
    accent: "#D6A92D",
    onAccent: "#1A1205",
    box: "#FFFDF5",
    border: "#E1CC8B",
    card: "#FFF8E7",
  },
} as const;

type ThemeColors = typeof DARK_COLORS;

const ThemeCtx = createContext<{
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
} | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
  scenarioId?: keyof typeof SCENARIO_DARK_THEMES;
};

export function ThemeProvider({
  children,
  scenarioId,
}: ThemeProviderProps) {
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

  const colors = useMemo(() => {
    if (scenarioId) {
      return isDark
        ? SCENARIO_DARK_THEMES[scenarioId]
        : SCENARIO_LIGHT_THEMES[scenarioId];
    }

    return isDark ? DARK_COLORS : LIGHT_COLORS;
  }, [isDark, scenarioId]);

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
