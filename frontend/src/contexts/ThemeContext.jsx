// frontend/src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import config from '../config';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'mint';
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Apply theme to document
  useEffect(() => {
    // Remove all existing theme classes
    document.documentElement.className = '';
    
    // Add dark mode class if needed
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Apply theme colors
    if (config.themes && config.themes[theme]) {
      const root = document.documentElement;
      const themeColors = config.themes[theme];
      
      root.style.setProperty('--color-primary', themeColors.primary);
      root.style.setProperty('--color-primary-light', themeColors.light);
      root.style.setProperty('--color-primary-dark', themeColors.dark);
      
      // Update CSS custom properties for consistent theming
      root.style.setProperty('--theme-primary', themeColors.primary);
      root.style.setProperty('--theme-light', themeColors.light);
      root.style.setProperty('--theme-dark', themeColors.dark);
    }
  }, [theme, darkMode]);

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const value = {
    theme,
    darkMode,
    updateTheme,
    toggleDarkMode,
    currentThemeConfig: config.themes?.[theme] || config.themes?.mint
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};