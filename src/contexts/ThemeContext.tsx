import React, { createContext, useContext, useState, useEffect } from 'react';

export type ColorScheme = 'dark-blue' | 'dark-green' | 'orange' | 'red' | 'brown' | 'gray';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const COLOR_SCHEMES: Record<ColorScheme, { label: string; primary: string; accent: string; preview: string }> = {
  'dark-blue': { label: 'Dark Blue', primary: '217 91% 40%', accent: '210 100% 56%', preview: '#1a56db' },
  'dark-green': { label: 'Dark Green', primary: '152 69% 31%', accent: '158 64% 42%', preview: '#1a7a4c' },
  'orange': { label: 'Orange', primary: '25 95% 50%', accent: '33 100% 50%', preview: '#f97316' },
  'red': { label: 'Red', primary: '0 72% 45%', accent: '4 90% 58%', preview: '#c62828' },
  'brown': { label: 'Brown', primary: '28 56% 35%', accent: '30 50% 45%', preview: '#8b5e3c' },
  'gray': { label: 'Gray', primary: '220 9% 46%', accent: '220 9% 56%', preview: '#6b7280' },
};

export { COLOR_SCHEMES };

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    return (localStorage.getItem('color-scheme') as ColorScheme) || 'dark-blue';
  });
  const [isDark, setIsDarkState] = useState(() => {
    return localStorage.getItem('theme-dark') === 'true';
  });

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem('color-scheme', scheme);
  };

  const setIsDark = (dark: boolean) => {
    setIsDarkState(dark);
    localStorage.setItem('theme-dark', String(dark));
  };

  useEffect(() => {
    const root = document.documentElement;
    const scheme = COLOR_SCHEMES[colorScheme];

    if (isDark) {
      root.style.setProperty('--background', '220 25% 7%');
      root.style.setProperty('--foreground', '210 40% 95%');
      root.style.setProperty('--card', '220 22% 10%');
      root.style.setProperty('--card-foreground', '210 40% 95%');
      root.style.setProperty('--popover', '220 22% 10%');
      root.style.setProperty('--popover-foreground', '210 40% 95%');
      root.style.setProperty('--secondary', '220 20% 16%');
      root.style.setProperty('--secondary-foreground', '210 40% 90%');
      root.style.setProperty('--muted', '220 18% 14%');
      root.style.setProperty('--muted-foreground', '215 15% 55%');
      root.style.setProperty('--border', '220 15% 18%');
      root.style.setProperty('--input', '220 15% 18%');
      root.style.setProperty('--sidebar-background', '220 25% 9%');
      root.style.setProperty('--sidebar-foreground', '210 20% 75%');
      root.style.setProperty('--sidebar-accent', '220 20% 14%');
      root.style.setProperty('--sidebar-accent-foreground', '210 40% 95%');
      root.style.setProperty('--sidebar-border', '220 15% 15%');
      root.style.setProperty('--destructive-foreground', '210 40% 98%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
    } else {
      root.style.setProperty('--background', '0 0% 98%');
      root.style.setProperty('--foreground', '220 20% 15%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '220 20% 15%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '220 20% 15%');
      root.style.setProperty('--secondary', '220 14% 94%');
      root.style.setProperty('--secondary-foreground', '220 20% 25%');
      root.style.setProperty('--muted', '220 14% 96%');
      root.style.setProperty('--muted-foreground', '215 15% 45%');
      root.style.setProperty('--border', '220 13% 88%');
      root.style.setProperty('--input', '220 13% 88%');
      root.style.setProperty('--sidebar-background', '0 0% 100%');
      root.style.setProperty('--sidebar-foreground', '220 15% 40%');
      root.style.setProperty('--sidebar-accent', '220 14% 96%');
      root.style.setProperty('--sidebar-accent-foreground', '220 20% 15%');
      root.style.setProperty('--sidebar-border', '220 13% 90%');
      root.style.setProperty('--destructive-foreground', '0 0% 100%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
    }

    root.style.setProperty('--primary', scheme.primary);
    root.style.setProperty('--accent', scheme.primary);
    root.style.setProperty('--ring', scheme.primary);
    root.style.setProperty('--sidebar-primary', scheme.primary);
    root.style.setProperty('--sidebar-ring', scheme.primary);
    root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
  }, [colorScheme, isDark]);

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
