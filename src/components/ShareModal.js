import React, { useState } from 'react';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, onShare, documentTitle, markdown }) => {
  const [isPublic, setIsPublic] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const result = await onShare(isPublic);
      setShareLink(result.shareUrl);
      setPreviewUrl(result.previewUrl);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleOpenPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const handleModalClose = () => {
    setShareLink('');
    setPreviewUrl('');
    setCopySuccess(false);
    setIsGenerating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Share Document</h2>
          <button className="close-button" onClick={handleModalClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="document-info">
            <h3>📝 {documentTitle}</h3>
            <p className="document-stats">
              {markdown.split('\n').length} lines • {markdown.length} characters
            </p>
          </div>

          <div className="share-options">
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isGenerating || shareLink}
                />
                <span className="checkmark"></span>
                Make this document publicly viewable
              </label>
              <p className="option-description">
                {isPublic 
                  ? "Anyone with the link can view this document"
                  : "Only people you specifically share with can view this document"
                }
              </p>
            </div>
          </div>

          {!shareLink ? (
            <div className="generate-section">
              <button
                className="generate-button"
                onClick={handleGenerateLink}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating Link...
                  </>
                ) : (
                  <>
                    🔗 Generate Share Link
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="share-result">
              <div className="link-section">
                <label htmlFor="share-link">Share Link:</label>
                <div className="link-input-group">
                  <input
                    id="share-link"
                    type="text"
                    value={shareLink}
                    readOnly
                    className="share-link-input"
                  />
                  <button
                    className={`copy-button ${copySuccess ? 'success' : ''}`}
                    onClick={handleCopyLink}
                  >
                    {copySuccess ? '✅' : '📋'}
                  </button>
                </div>
                {copySuccess && (
                  <p className="copy-success">✅ Link copied to clipboard!</p>
                )}
              </div>

              <div className="preview-section">
                <button
                  className="preview-button"
                  onClick={handleOpenPreview}
                >
                  👁️ Preview Document
                </button>
              </div>

              <div className="share-actions">
                <button
                  className="share-action-button email"
                  onClick={() => window.open(`mailto:?subject=${encodeURIComponent(documentTitle)}&body=${encodeURIComponent('Check out this document: ' + shareLink)}`)}
                >
                  📧 Share via Email
                </button>
                
                <button
                  className="share-action-button social"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this document: ' + documentTitle)}&url=${encodeURIComponent(shareLink)}`)}
                >
                  🐦 Share on Twitter
                </button>
              </div>
            </div>
          )}

          <div className="share-info">
            <h4>ℹ️ About Sharing</h4>
            <ul>
              <li>Shared documents are view-only and cannot be edited</li>
              <li>Mathematical expressions and formatting are preserved</li>
              <li>Images hosted on Firebase will display correctly</li>
              <li>The share link will remain active as long as your account exists</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
