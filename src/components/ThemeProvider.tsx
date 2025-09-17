import React, { createContext, useContext, useEffect } from 'react';
import { useTheme, type Theme } from '~/hooks/useTheme';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const themeData = useTheme();

  // Set default theme on mount if no preference exists
  useEffect(() => {
    const stored = localStorage.getItem('contexus-theme');
    if (!stored) {
      themeData.setTheme(defaultTheme);
    }
  }, [defaultTheme, themeData]);

  return (
    <ThemeContext.Provider value={themeData}>
      {children}
    </ThemeContext.Provider>
  );
}