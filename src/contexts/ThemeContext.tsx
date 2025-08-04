'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  currentTheme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('weather-dashboard-theme') as Theme;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Determine effective theme
    let effective: 'light' | 'dark' = 'light';
    
    if (currentTheme === 'auto') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effective = currentTheme;
    }
    
    setEffectiveTheme(effective);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.className = effective === 'dark' ? 'dark-theme' : 'light-theme';
    
    // Save to localStorage
    localStorage.setItem('weather-dashboard-theme', currentTheme);
  }, [currentTheme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (currentTheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [currentTheme]);

  const setTheme = (newTheme: Theme) => {
    setCurrentTheme(newTheme);
  };

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Ant Design theme configuration
  const antdTheme = {
    algorithm: effectiveTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      fontSize: 14,
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      fontSizeHeading4: 16,
      fontSizeHeading5: 14,
      fontWeightStrong: 600,
      lineHeight: 1.6,
      // Enhanced contrast ratios
      colorText: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
      colorTextSecondary: effectiveTheme === 'dark' ? '#d1d5db' : '#4b5563',
      colorTextTertiary: effectiveTheme === 'dark' ? '#9ca3af' : '#6b7280',
      colorBgContainer: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
      colorBgElevated: effectiveTheme === 'dark' ? '#374151' : '#ffffff',
      colorBgLayout: effectiveTheme === 'dark' ? '#111827' : '#f5f5f5',
      colorBorder: effectiveTheme === 'dark' ? '#4b5563' : '#d9d9d9',
      colorBorderSecondary: effectiveTheme === 'dark' ? '#374151' : '#f0f0f0',
    },
    components: {
      Layout: {
        headerBg: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
        bodyBg: effectiveTheme === 'dark' ? '#111827' : '#f5f5f5',
        siderBg: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
      },
      Card: {
        colorBgContainer: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
        colorText: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
        colorTextHeading: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
      },
      Button: {
        colorText: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
        colorBgContainer: effectiveTheme === 'dark' ? '#374151' : '#ffffff',
        fontWeight: 500,
      },
      Typography: {
        colorText: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
        colorTextHeading: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
        colorTextSecondary: effectiveTheme === 'dark' ? '#d1d5db' : '#4b5563',
        fontWeightStrong: 600,
      },
    },
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, effectiveTheme, setTheme, toggleTheme }}>
      <ConfigProvider theme={antdTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
