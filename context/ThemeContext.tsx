import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, Theme } from '../constants/theme';

const STORAGE_KEY = '@testforge_theme';
const DEFAULT_THEME = 'midnight';

type ThemeContextValue = {
  theme: Theme;
  themeKey: string;
  setThemeKey: (key: string) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[DEFAULT_THEME],
  themeKey: DEFAULT_THEME,
  setThemeKey: () => {},
});

/** Provides the active theme to the entire app and persists the user's selection. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<string>(DEFAULT_THEME);

  // Load saved theme from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved && THEMES[saved]) {
        setThemeKeyState(saved);
      }
    });
  }, []);

  // Persist theme selection to storage and update state
  function setThemeKey(key: string) {
    if (!THEMES[key]) return;
    setThemeKeyState(key);
    AsyncStorage.setItem(STORAGE_KEY, key);
  }

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeKey], themeKey, setThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Returns the active theme tokens and a setter to change themes. */
export function useTheme() {
  return useContext(ThemeContext);
}
