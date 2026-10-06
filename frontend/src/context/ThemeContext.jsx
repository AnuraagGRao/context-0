import { createContext, useContext, useEffect, useState } from 'react';

const THEMES = ['obsidian', 'cyber', 'arcade'];
const THEME_ICONS = {
  obsidian: '🖤',
  cyber: '⚡',
  arcade: '🕹️',
};
const THEME_NAMES = {
  obsidian: 'Obsidian',
  cyber: 'Cyber',
  arcade: 'Arcade',
};

const ThemeContext = createContext({
  theme: 'obsidian',
  themeIcon: '🖤',
  themeName: 'Obsidian',
  setTheme: () => {},
  cycleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('user-theme') || 'obsidian';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('user-theme', theme);
  }, [theme]);

  const setTheme = (nextTheme) => {
    if (THEMES.includes(nextTheme)) {
      setThemeState(nextTheme);
    }
  };

  const cycleTheme = () => {
    const nextIdx = (THEMES.indexOf(theme) + 1) % THEMES.length;
    setThemeState(THEMES[nextIdx]);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeIcon: THEME_ICONS[theme] || '🖤',
        themeName: THEME_NAMES[theme] || theme,
        setTheme,
        cycleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
