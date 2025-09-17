import { useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'contexus-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get stored theme preference or default to system
    const stored = localStorage.getItem(STORAGE_KEY) as Theme;
    return stored || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Apply theme to document
  const applyTheme = useCallback((resolvedTheme: 'light' | 'dark') => {
    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    // Add current theme class
    root.classList.add(resolvedTheme);

    // Update meta theme-color for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#1f2937' : '#ffffff'
      );
    }

    // Update CSS custom property for dynamic theming
    root.style.setProperty('--theme', resolvedTheme);
  }, []);

  // Resolve system theme
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Update resolved theme when theme changes
  useEffect(() => {
    const newResolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme);
  }, [theme, getSystemTheme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const newResolvedTheme = getSystemTheme();
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme);
    };

    // Check if addEventListener is available (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme, getSystemTheme, applyTheme]);

  // Set theme and persist to storage
  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  // Toggle between light and dark (ignoring system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  }, [resolvedTheme, changeTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme: changeTheme,
    toggleTheme,
  };
}