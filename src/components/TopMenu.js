import React, { useState } from 'react';
import UserProfile from './UserProfile';

const TopMenu = ({ 
  onNewDocument, 
  onSaveDocument, 
  onOpenCollections, 
  currentDocumentTitle,
  hasUnsavedChanges,
  onDocumentTitleChange,
  firestoreStatus = 'untested',
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

  const getFirestoreStatusIcon = () => {
    switch (firestoreStatus) {
      case 'testing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const getFirestoreStatusTitle = () => {
    switch (firestoreStatus) {
      case 'testing': return 'Testing Firestore connection...';
      case 'success': return 'Firestore connected successfully';
      case 'error': return 'Firestore connection failed - check console for details';
      default: return 'Firestore status unknown';
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
          <span className="logo-icon">📝</span>
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
        <div 
          className="firestore-status" 
          title={getFirestoreStatusTitle()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '12px',
            fontSize: '12px',
            color: '#64748b'
          }}
        >
          <span>{getFirestoreStatusIcon()}</span>
          <span>DB</span>
        </div>
        <UserProfile />
      </div>
    </div>
  );
};

export default TopMenu;
