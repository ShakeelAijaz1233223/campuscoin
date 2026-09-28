import { createContext, useContext, useEffect, useState } from 'react';
export const ThemeContext = createContext(null);
const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    read('cc-theme', 'dark') === 'light' ? 'light' : 'dark'
  );
  const [fontSize, setFontSize] = useState(() => {
    const stored = Number(read('cc-font', 16));
    return [16, 18, 20].includes(stored) ? stored : 16;
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.fontSize = fontSize + 'px';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#080a10' : '#f1f3f8');
    try {
      localStorage.setItem('cc-theme', theme);
      localStorage.setItem('cc-font', fontSize);
    } catch {
      /* Device storage may be disabled; the workspace still works. */
    }
  }, [theme, fontSize]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
