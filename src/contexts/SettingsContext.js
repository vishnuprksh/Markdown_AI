import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const DEFAULT_SETTINGS = {
  renderLatex: true,
  theme: 'light',
  fontSize: 14,
  lineHeight: 1.5,
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  showLineNumbers: false,
  wordWrap: true,
  previewMode: 'side', // 'side', 'preview', 'edit'
};

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings when user changes
  useEffect(() => {
    if (user) {
      loadUserSettings();
    } else {
      loadLocalSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    setIsLoading(true);
    try {
      // For now, store in localStorage with user-specific key
      // In the future, this could be stored in Firestore
      const storageKey = `markdown_ai_settings_${user.uid}`;
      const savedSettings = localStorage.getItem(storageKey);
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      setSettings(DEFAULT_SETTINGS);
    }
    setIsLoading(false);
  };

  const loadLocalSettings = () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('markdown_ai_settings_local');
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading local settings:', error);
      setSettings(DEFAULT_SETTINGS);
    }
    setIsLoading(false);
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const saveSettings = (settingsToSave) => {
    try {
      const storageKey = user 
        ? `markdown_ai_settings_${user.uid}` 
        : 'markdown_ai_settings_local';
      
      localStorage.setItem(storageKey, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  };

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
