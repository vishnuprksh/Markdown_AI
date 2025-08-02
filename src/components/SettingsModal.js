import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      resetSettings();
    }
  };

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>General Settings</h3>
      
      <div className="setting-item">
        <label className="setting-label">
          <input
            type="checkbox"
            checked={settings.renderLatex}
            onChange={(e) => updateSetting('renderLatex', e.target.checked)}
          />
          <span className="setting-text">
            <strong>Render LaTeX/Math</strong>
            <small>Enable mathematical formula rendering using KaTeX</small>
          </span>
        </label>
      </div>

      <div className="setting-item">
        <label className="setting-label">
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => updateSetting('autoSave', e.target.checked)}
          />
          <span className="setting-text">
            <strong>Auto Save</strong>
            <small>Automatically save documents at regular intervals</small>
          </span>
        </label>
      </div>

      {settings.autoSave && (
        <div className="setting-item indented">
          <label className="setting-label">
            <span className="setting-text">
              <strong>Auto Save Interval</strong>
              <small>How often to auto-save (in seconds)</small>
            </span>
            <select
              value={settings.autoSaveInterval / 1000}
              onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value) * 1000)}
              className="setting-select"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </label>
        </div>
      )}

      <div className="setting-item">
        <label className="setting-label">
          <span className="setting-text">
            <strong>Theme</strong>
            <small>Choose your preferred color theme</small>
          </span>
          <select
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value)}
            className="setting-select"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </label>
      </div>
    </div>
  );

  const renderEditorSettings = () => (
    <div className="settings-section">
      <h3>Editor Settings</h3>
      
      <div className="setting-item">
        <label className="setting-label">
          <span className="setting-text">
            <strong>Font Size</strong>
            <small>Editor font size in pixels</small>
          </span>
          <input
            type="range"
            min="10"
            max="24"
            value={settings.fontSize}
            onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
            className="setting-range"
          />
          <span className="setting-value">{settings.fontSize}px</span>
        </label>
      </div>

      <div className="setting-item">
        <label className="setting-label">
          <span className="setting-text">
            <strong>Line Height</strong>
            <small>Spacing between lines</small>
          </span>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
            className="setting-range"
          />
          <span className="setting-value">{settings.lineHeight}</span>
        </label>
      </div>

      <div className="setting-item">
        <label className="setting-label">
          <input
            type="checkbox"
            checked={settings.showLineNumbers}
            onChange={(e) => updateSetting('showLineNumbers', e.target.checked)}
          />
          <span className="setting-text">
            <strong>Show Line Numbers</strong>
            <small>Display line numbers in the editor</small>
          </span>
        </label>
      </div>

      <div className="setting-item">
        <label className="setting-label">
          <input
            type="checkbox"
            checked={settings.wordWrap}
            onChange={(e) => updateSetting('wordWrap', e.target.checked)}
          />
          <span className="setting-text">
            <strong>Word Wrap</strong>
            <small>Wrap long lines in the editor</small>
          </span>
        </label>
      </div>

      <div className="setting-item">
        <label className="setting-label">
          <span className="setting-text">
            <strong>Preview Mode</strong>
            <small>Default layout mode</small>
          </span>
          <select
            value={settings.previewMode}
            onChange={(e) => updateSetting('previewMode', e.target.value)}
            className="setting-select"
          >
            <option value="side">Side by Side</option>
            <option value="preview">Preview Only</option>
            <option value="edit">Edit Only</option>
          </select>
        </label>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab-button ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'editor' && renderEditorSettings()}
        </div>

        <div className="settings-footer">
          <button className="reset-button" onClick={handleResetSettings}>
            Reset to Defaults
          </button>
          <button className="close-settings-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
