import React, { useState, useRef, useEffect } from 'react';
import './AIModal.css';
import geminiService from '../services/geminiService';

const AIModal = ({ isOpen, onClose, onApply, selectedText, fullContent }) => {
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessContent = async () => {
    if (!customPrompt.trim()) {
      alert('Please enter a prompt to process the content');
      return;
    }

    setLoading(true);
    try {
      const contentToProcess = selectedText || fullContent;
      const result = await geminiService.customProcess(contentToProcess, customPrompt);
      onApply(result);
      onClose();
      setCustomPrompt('');
    } catch (error) {
      console.error('AI processing error:', error);
      alert(error.message || 'Failed to process content with AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = async () => {
    if (!customPrompt.trim()) {
      alert('Please enter a prompt to generate content');
      return;
    }

    setLoading(true);
    try {
      const result = await geminiService.generateMarkdown(customPrompt);
      onApply(result);
      onClose();
      setCustomPrompt('');
    } catch (error) {
      console.error('Content generation error:', error);
      alert(error.message || 'Failed to generate content with AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (selectedText) {
        handleProcessContent();
      } else {
        handleGenerateNew();
      }
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <h2>🤖 AI Assistant {selectedText ? `(${selectedText.length} chars selected)` : `(${fullContent.length} chars)`}</h2>
          <button className="ai-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ai-modal-content">
          <div className="ai-tab-content">
            <textarea
              ref={textareaRef}
              className="custom-prompt-input"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your instructions...

Examples:
• Improve grammar and clarity
• Convert to a how-to guide
• Add more technical details
• Summarize the main points"
            />
            <div className="ai-actions">
              {selectedText ? (
                <button 
                  className="ai-action-btn primary" 
                  onClick={handleProcessContent}
                  disabled={loading || !customPrompt.trim()}
                >
                  {loading ? '🔄 Processing Selection...' : '✨ Process Selected Text'}
                </button>
              ) : (
                <button 
                  className="ai-action-btn generate" 
                  onClick={handleGenerateNew}
                  disabled={loading || !customPrompt.trim()}
                >
                  {loading ? '🔄 Generating...' : '✨ Generate New Content'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModal;
