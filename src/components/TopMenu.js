import React, { useState } from 'react';
import UserProfile from './UserProfile';

const TopMenu = ({ 
  onNewDocument, 
  onSaveDocument, 
  onOpenCollections,
  onShare,
  onOpenSettings, 
  currentDocumentTitle,
  hasUnsavedChanges,
  onDocumentTitleChange,
  saveStatus = 'idle'
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(currentDocumentTitle);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTempTitle(currentDocumentTitle);
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    onDocumentTitleChange(tempTitle.trim() || 'Untitled');
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTempTitle(currentDocumentTitle);
    }
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <span className="button-icon">⏳</span>
            Saving...
          </>
        );
      case 'saved':
        return (
          <>
            <span className="button-icon">✅</span>
            Saved!
          </>
        );
      case 'error':
        return (
          <>
            <span className="button-icon">❌</span>
            Error
          </>
        );
      default:
        return (
          <>
            <span className="button-icon">💾</span>
            Save
            {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
          </>
        );
    }
  };

  const getSaveButtonDisabled = () => {
    return saveStatus === 'saving' || (!hasUnsavedChanges && saveStatus === 'idle');
  };

  return (
    <div className="top-menu">
      <div className="menu-left">
        <div className="app-logo">
          <svg className="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#000000"/>
                <stop offset="100%" stopColor="#B00020"/>
              </linearGradient>
            </defs>
            
            {/* Main document shape */}
            <rect x="4" y="6" width="18" height="22" rx="2" fill="white" stroke="url(#logoGradient)" strokeWidth="1.5"/>
            
            {/* Markdown symbol - stylized M */}
            <path d="M8 12 L10 16 L12 12 L14 16 L16 12" stroke="url(#logoGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            
            {/* Text lines */}
            <line x1="8" y1="19" x2="16" y2="19" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            <line x1="8" y1="21.5" x2="14" y2="21.5" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            <line x1="8" y1="24" x2="15" y2="24" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            
            {/* AI circuit pattern */}
            <circle cx="25" cy="9" r="5" fill="url(#logoGradient)" opacity="0.1"/>
            <circle cx="25" cy="9" r="5" stroke="url(#logoGradient)" strokeWidth="1.5" fill="none"/>
            
            {/* Neural network nodes */}
            <circle cx="23" cy="7" r="1" fill="url(#logoGradient)"/>
            <circle cx="27" cy="7" r="1" fill="url(#logoGradient)"/>
            <circle cx="25" cy="11" r="1" fill="url(#logoGradient)"/>
            <circle cx="25" cy="9" r="0.5" fill="url(#logoGradient)"/>
            
            {/* Neural connections */}
            <line x1="23" y1="7" x2="25" y2="9" stroke="url(#logoGradient)" strokeWidth="0.8" opacity="0.7"/>
            <line x1="27" y1="7" x2="25" y2="9" stroke="url(#logoGradient)" strokeWidth="0.8" opacity="0.7"/>
            <line x1="25" y1="9" x2="25" y2="11" stroke="url(#logoGradient)" strokeWidth="0.8" opacity="0.7"/>
          </svg>
          <span className="logo-text">Markdown AI</span>
        </div>
        
        <div className="menu-buttons">
          <button 
            className="menu-button" 
            onClick={onNewDocument}
            title="Create new document"
          >
            <span className="button-icon">📄</span>
            New
          </button>
          
          <button 
            className="menu-button save-button" 
            onClick={onSaveDocument}
            title="Save document"
            disabled={getSaveButtonDisabled()}
          >
            {getSaveButtonContent()}
          </button>
          
          <button 
            className="menu-button" 
            onClick={onOpenCollections}
            title="View saved documents"
          >
            <span className="button-icon">📚</span>
            Collections
          </button>
          
          <button 
            className="menu-button share-button" 
            onClick={onShare}
            title="Share document with others"
          >
            <span className="button-icon">🔗</span>
            Share
          </button>
          
          <button 
            className="menu-button settings-button" 
            onClick={onOpenSettings}
            title="Open settings"
          >
            <span className="button-icon">⚙️</span>
            Settings
          </button>
        </div>
      </div>

      <div className="menu-center">
        <div className="document-title-container">
          {isEditingTitle ? (
            <input
              type="text"
              className="title-input"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              maxLength={100}
            />
          ) : (
            <h1 className="document-title" onClick={handleTitleClick} title="Click to edit title">
              {currentDocumentTitle}
              {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
            </h1>
          )}
        </div>
      </div>

      <div className="menu-right">
        <UserProfile />
      </div>
    </div>
  );
};

export default TopMenu;
