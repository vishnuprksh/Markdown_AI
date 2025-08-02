import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { documentService } from '../services/documentService';
import TopMenu from './TopMenu';
import CollectionsModal from './CollectionsModal';
import AIModal from './AIModal';
import ShareModal from './ShareModal';
import SettingsModal from './SettingsModal';
import { shareService } from '../services/shareService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MarkdownEditor = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  
  // Document management state
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('Untitled.md');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  
  const [markdown, setMarkdown] = useState(`# Welcome to Markdown AI Editor

Start writing your **markdown** content here! This document will be automatically saved when you click the save button.

## Features
- Beautiful live preview
- Math support with LaTeX
- Image uploads
- AI assistance
- Collections management`);

  // Undo history state
  const [undoHistory, setUndoHistory] = useState([]);
  const [currentUndoIndex, setCurrentUndoIndex] = useState(-1);
  
  // AI Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showFloatingAI, setShowFloatingAI] = useState(false);
  const [floatingAIPosition, setFloatingAIPosition] = useState({ x: 0, y: 0 });

  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // PDF download state
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle, generating, success, error

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize with default content and track changes
  useEffect(() => {
    setOriginalContent(markdown);
  }, []);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(markdown !== originalContent);
  }, [markdown, originalContent]);

  // Reset save status when content changes after saving
  useEffect(() => {
    if (saveStatus === 'saved' && markdown !== originalContent) {
      setSaveStatus('idle');
    }
  }, [markdown, originalContent, saveStatus]);

  // Hide floating AI button when clicking outside
  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!showFloatingAI) return;
      
      const isFloatingButton = event.target.closest('.floating-ai-button');
      const isTextarea = event.target.closest('.editor-textarea');
      
      // If clicking outside both the floating button and textarea, hide it
      if (!isFloatingButton && !isTextarea) {
        setShowFloatingAI(false);
        setSelectedText('');
      }
    };

    // Add listener with slight delay to avoid conflicts
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleGlobalClick, true);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [showFloatingAI]);

  // Document management functions
  const handleNewDocument = async () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Create a new document anyway?')) {
        return;
      }
    }
    
    setCurrentDocumentId(null);
    
    // Generate a unique title for new documents
    let newTitle = 'Untitled';
    if (user) {
      try {
        newTitle = await documentService.generateUniqueTitle(user.uid, 'Untitled');
      } catch (error) {
        console.warn('Could not generate unique title, using default:', error);
        // Fallback to timestamp-based naming
        newTitle = `Untitled ${new Date().toLocaleDateString()}`;
      }
    }
    
    setDocumentTitle(newTitle + '.md');
    const newContent = `# New Document

Start writing your **markdown** content here!`;
    setMarkdown(newContent);
    setOriginalContent(newContent);
    setHasUnsavedChanges(false);
  };

  const handleSaveDocument = async () => {
    if (!user) {
      alert('Please log in to save documents');
      return;
    }

    console.log('Attempting to save document:', {
      userId: user.uid,
      title: documentTitle.replace('.md', ''),
      contentLength: markdown.length,
      currentDocumentId
    });

    try {
      // Set saving status
      setSaveStatus('saving');
        
      const docId = await documentService.saveDocument(
        user.uid,
        documentTitle.replace('.md', ''), // Remove .md extension for storage
        markdown,
        currentDocumentId
      );
      
      if (!currentDocumentId) {
        setCurrentDocumentId(docId);
      }
      
      setOriginalContent(markdown);
      setHasUnsavedChanges(false);
      
      // Show success status briefly
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
      console.log('Document saved successfully:', docId);
    } catch (error) {
      console.error('Error saving document:', error);
      
      // Set error status
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      
      // Show more specific error message
      if (error.message.includes('Missing or insufficient permissions')) {
        alert('Permission denied. Please check your Firestore security rules.');
      } else if (error.message.includes('Failed to get document')) {
        alert('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('already exists')) {
        // Handle duplicate name error with better UX
        const suggestedTitleMatch = error.message.match(/Suggested alternative: "([^"]+)"/);
        if (suggestedTitleMatch) {
          const suggestedTitle = suggestedTitleMatch[1];
          const userChoice = window.confirm(
            `${error.message}\n\nWould you like to use the suggested title "${suggestedTitle}"?`
          );
          if (userChoice) {
            setDocumentTitle(suggestedTitle + '.md');
            // Don't show error status since user accepted the suggestion
            setSaveStatus('idle');
            return; // Exit early to avoid showing error
          }
        }
        alert(error.message);
      } else {
        alert(`Failed to save document: ${error.message}`);
      }
    }
  };

  const handleSelectDocument = async (document) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Load a different document anyway?')) {
        return;
      }
    }

    try {
      setCurrentDocumentId(document.id);
      setDocumentTitle(document.title + '.md');
      setMarkdown(document.content);
      setOriginalContent(document.content);
      setHasUnsavedChanges(false);
      setIsCollectionsOpen(false);
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document. Please try again.');
    }
  };

  const handleDocumentTitleChange = (newTitle) => {
    setDocumentTitle(newTitle.endsWith('.md') ? newTitle : newTitle + '.md');
  };

  const handleCloseAIModal = () => {
    setIsAIModalOpen(false);
    setSelectedText('');
    setShowFloatingAI(false);
  };

  // Share functionality
  const handleShare = async (isPublic = true) => {
    if (!user) {
      alert('Please log in to share documents');
      return;
    }

    console.log('Starting share process:', {
      userId: user.uid,
      documentTitle,
      markdownLength: markdown.length,
      isPublic
    });

    try {
      // Create shareable document in Firestore
      const shareId = await shareService.createShareableDocument(
        user.uid,
        documentTitle,
        markdown,
        isPublic
      );

      console.log('Share document created successfully:', shareId);

      // Generate share URL
      const shareUrl = shareService.generateShareURL(shareId);
      
      // Generate preview URL (data URL for immediate preview)
      const previewUrl = shareService.generateDataURL(documentTitle, markdown);

      return {
        shareUrl,
        previewUrl,
        shareId
      };
    } catch (error) {
      console.error('Error creating share link:', error);
      throw error;
    }
  };

  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
  };

  // Settings Modal handlers
  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
  };

  // PDF download functionality
  const handleDownloadPDF = async () => {
    try {
      setDownloadStatus('generating');
      
      // Get the preview content element
      const previewContent = document.querySelector('.preview-content');
      if (!previewContent) {
        throw new Error('Preview content not found');
      }

      // Create canvas from the preview content
      const canvas = await html2canvas(previewContent, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        width: previewContent.scrollWidth,
        height: previewContent.scrollHeight,
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit the content on A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add the image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const filename = documentTitle.replace('.md', '') + '.pdf';
      
      // Download the PDF
      pdf.save(filename);
      
      setDownloadStatus('success');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setDownloadStatus('error');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 2000);
    }
  };

  // Markdown file download functionality
  const handleDownloadMarkdown = () => {
    try {
      // Create blob with markdown content
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = documentTitle.endsWith('.md') ? documentTitle : `${documentTitle}.md`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading markdown file:', error);
      alert('Failed to download markdown file. Please try again.');
    }
  };

  const getDownloadButtonContent = () => {
    switch (downloadStatus) {
      case 'generating':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '�';
    }
  };

  const getDownloadButtonTitle = () => {
    switch (downloadStatus) {
      case 'generating':
        return 'Generating PDF...';
      case 'success':
        return 'PDF downloaded successfully!';
      case 'error':
        return 'Failed to generate PDF';
      default:
        return 'Download as PDF';
    }
  };

  // Undo functionality
  const saveToUndoHistory = useCallback((newContent) => {
    // Remove any redo history if we're not at the end
    const newHistory = undoHistory.slice(0, currentUndoIndex + 1);
    newHistory.push(newContent);
    
    // Limit history to last 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setCurrentUndoIndex(prev => prev + 1);
    }
    
    setUndoHistory(newHistory);
  }, [undoHistory, currentUndoIndex]);

  const handleUndo = useCallback(() => {
    if (currentUndoIndex > 0) {
      const textarea = textareaRef.current;
      const scrollTop = textarea?.scrollTop || 0; // Preserve scroll position
      const previousContent = undoHistory[currentUndoIndex - 1];
      setMarkdown(previousContent);
      setCurrentUndoIndex(prev => prev - 1);
      
      // Restore scroll position after state update
      setTimeout(() => {
        if (textarea) {
          textarea.scrollTop = scrollTop;
        }
      }, 0);
    }
  }, [currentUndoIndex, undoHistory]);

  const handleRedo = useCallback(() => {
    if (currentUndoIndex < undoHistory.length - 1) {
      const textarea = textareaRef.current;
      const scrollTop = textarea?.scrollTop || 0; // Preserve scroll position
      const nextContent = undoHistory[currentUndoIndex + 1];
      setMarkdown(nextContent);
      setCurrentUndoIndex(prev => prev + 1);
      
      // Restore scroll position after state update
      setTimeout(() => {
        if (textarea) {
          textarea.scrollTop = scrollTop;
        }
      }, 0);
    }
  }, [currentUndoIndex, undoHistory]);

  // Update markdown with undo support
  const updateMarkdown = useCallback((newContent) => {
    saveToUndoHistory(markdown);
    setMarkdown(newContent);
  }, [markdown, saveToUndoHistory]);

  // AI functionality
  const handleAIPrompt = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = markdown.substring(start, end);
      
      setSelectedText(selected);
      setSelectionStart(start);
      setSelectionEnd(end);
      setIsAIModalOpen(true);
    }
  }, [markdown]);

  const handleAIApply = (enhancedContent) => {
    if (selectedText) {
      // Replace selected text
      const newContent = markdown.substring(0, selectionStart) + 
                        enhancedContent + 
                        markdown.substring(selectionEnd);
      updateMarkdown(newContent);
    } else {
      // Replace entire document
      updateMarkdown(enhancedContent);
    }
  };

  const handleTextSelection = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.substring(start, end);
    
    if (selected.length > 0) {
      // Calculate position at the end of selection
      const textBeforeSelection = markdown.substring(0, end);
      const lines = textBeforeSelection.split('\n');
      const currentLine = lines.length - 1;
      const currentColumn = lines[lines.length - 1].length;
      
      // Get textarea styling
      const computedStyle = window.getComputedStyle(textarea);
      const fontSize = parseInt(computedStyle.fontSize) || 16;
      const lineHeight = parseInt(computedStyle.lineHeight) || fontSize * 1.2;
      const paddingLeft = parseInt(computedStyle.paddingLeft) || 8;
      const paddingTop = parseInt(computedStyle.paddingTop) || 8;
      
      // Calculate character width (approximate)
      const charWidth = fontSize * 0.6; // Approximate character width
      
      // Get textarea position
      const rect = textarea.getBoundingClientRect();
      
      // Calculate position at end of selection
      const x = rect.left + paddingLeft + (currentColumn * charWidth);
      const y = rect.top + paddingTop + (currentLine * lineHeight) - textarea.scrollTop + lineHeight;
      
      setSelectedText(selected);
      setSelectionStart(start);
      setSelectionEnd(end);
      setFloatingAIPosition({
        x: Math.min(x, window.innerWidth - 80), // Ensure it doesn't go off screen
        y: Math.min(y, window.innerHeight - 50)
      });
      setShowFloatingAI(true);
    } else {
      // Hide floating AI button when no text is selected
      setShowFloatingAI(false);
      setSelectedText('');
    }
  };

  const handleFloatingAIClick = () => {
    setIsAIModalOpen(true);
    setShowFloatingAI(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo - Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Redo - Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
      
      // AI Enhancement - Ctrl+I (Windows/Linux) or Cmd+I (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        handleAIPrompt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleAIPrompt, handleUndo, handleRedo]);

  // Initialize undo history with current content
  useEffect(() => {
    if (undoHistory.length === 0) {
      setUndoHistory([markdown]);
      setCurrentUndoIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate unique filename for images
  const generateUniqueFilename = (originalName, extension) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const baseName = originalName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${baseName}_${timestamp}_${random}.${extension}`;
  };

  // Upload image to Firebase Storage
  const uploadImageToFirebase = async (file, filename) => {
    try {
      // Create a reference to the file in Firebase Storage
      const imageRef = ref(storage, `images/${filename}`);
      
      // Upload the file
      const snapshot = await uploadBytes(imageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image to Firebase:', error);
      throw error;
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const extension = file.name.split('.').pop() || 'png';
        const filename = generateUniqueFilename(file.name.split('.')[0], extension);
        
        // Show uploading indicator
        const uploadingMarkdown = `\n![Uploading ${file.name}...](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiI+VXBsb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==)\n`;
        setMarkdown(prev => prev + uploadingMarkdown);
        
        // Upload to Firebase
        const downloadURL = await uploadImageToFirebase(file, filename);
        
        // Replace uploading placeholder with actual image
        const imageMarkdown = `\n![${file.name}](${downloadURL})\n`;
        setMarkdown(prev => {
          const newContent = prev.replace(uploadingMarkdown, imageMarkdown);
          saveToUndoHistory(prev);
          return newContent;
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        
        // Remove uploading placeholder on error
        setMarkdown(prev => prev.replace(/\n!\[Uploading.*?\]\(.*?\)\n/g, ''));
      }
    }
  };

  // Handle paste events for images
  const handlePaste = async (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        
        const file = item.getAsFile();
        if (file) {
          try {
            const extension = item.type.split('/')[1] || 'png';
            const filename = generateUniqueFilename('pasted_image', extension);
            
            // Show uploading indicator at cursor position
            const textarea = event.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const scrollTop = textarea.scrollTop; // Preserve scroll position
            const uploadingMarkdown = `\n![Uploading pasted image...](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiI+VXBsb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==)\n`;
            
            const newText = markdown.substring(0, start) + uploadingMarkdown + markdown.substring(end);
            setMarkdown(newText);
            
            // Upload to Firebase
            const downloadURL = await uploadImageToFirebase(file, filename);
            
            // Replace uploading placeholder with actual image
            const imageMarkdown = `\n![Pasted Image](${downloadURL})\n`;
            setMarkdown(prev => {
              const newContent = prev.replace(uploadingMarkdown, imageMarkdown);
              saveToUndoHistory(prev);
              return newContent;
            });
            
            // Restore cursor position and scroll position after the inserted image
            setTimeout(() => {
              textarea.focus();
              textarea.scrollTop = scrollTop; // Restore scroll position
              const newPosition = start + imageMarkdown.length;
              textarea.setSelectionRange(newPosition, newPosition);
            }, 100);
          } catch (error) {
            console.error('Error uploading pasted image:', error);
            alert('Failed to upload pasted image. Please try again.');
            
            // Remove uploading placeholder on error
            setMarkdown(prev => prev.replace(/\n!\[Uploading.*?\]\(.*?\)\n/g, ''));
          }
        }
        break;
      }
    }
  };

  const insertText = (before, after = '') => {
    const textarea = textareaRef.current || document.querySelector('.editor-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop; // Preserve scroll position
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);
    updateMarkdown(newText);
    
    // Restore cursor position and scroll position
    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = scrollTop; // Restore scroll position
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertMath = () => {
    insertText('$$\n', '\n$$');
  };

  const insertInlineMath = () => {
    insertText('$', '$');
  };

  const insertHeader = () => {
    insertText('## ');
  };

  const insertBold = () => {
    insertText('**', '**');
  };

  const insertItalic = () => {
    insertText('*', '*');
  };

  const insertCode = () => {
    insertText('`', '`');
  };

  const insertCodeBlock = () => {
    insertText('```\n', '\n```');
  };

  const insertTable = () => {
    const table = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |
`;
    insertText(table);
  };

  return (
    <div className="app-container">
      <TopMenu
        onNewDocument={handleNewDocument}
        onSaveDocument={handleSaveDocument}
        onOpenCollections={() => setIsCollectionsOpen(true)}
        onShare={handleOpenShareModal}
        onOpenSettings={handleOpenSettings}
        currentDocumentTitle={documentTitle}
        hasUnsavedChanges={hasUnsavedChanges}
        onDocumentTitleChange={handleDocumentTitleChange}
        saveStatus={saveStatus}
      />
      
      <div className="markdown-editor">
        <div className="editor-panel">
          <div className="panel-header">
            <span>📝 Editor</span>
            <button 
              className="download-button"
              onClick={handleDownloadMarkdown}
              title="Download as Markdown file"
            >
              📄
            </button>
          </div>
        <div className="toolbar">
          <button className="toolbar-button" onClick={insertHeader} title="Header (H2)">
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>H₂</span>
          </button>
          <button className="toolbar-button" onClick={insertBold} title="Bold Text">
            <strong style={{ fontSize: '14px' }}>B</strong>
          </button>
          <button className="toolbar-button" onClick={insertItalic} title="Italic Text">
            <em style={{ fontSize: '14px' }}>I</em>
          </button>
          <button className="toolbar-button" onClick={insertCode} title="Inline Code">
            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>&lt;/&gt;</span>
          </button>
          <button className="toolbar-button" onClick={insertCodeBlock} title="Code Block">
            <span style={{ fontSize: '14px' }}>▦</span>
          </button>
          <button className="toolbar-button" onClick={insertInlineMath} title="Inline Math">
            <span style={{ fontSize: '12px' }}>f(x)</span>
          </button>
          <button className="toolbar-button" onClick={insertMath} title="Math Block">
            <span style={{ fontSize: '12px' }}>∑∫</span>
          </button>
          <button className="toolbar-button" onClick={insertTable} title="Insert Table">
            <span style={{ fontSize: '14px' }}>⊞</span>
          </button>
          <button 
            className="toolbar-button" 
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image"
          >
            <span style={{ fontSize: '14px' }}>🖼️</span>
          </button>
          <div className="toolbar-separator"></div>
          <button 
            className="toolbar-button ai-button" 
            onClick={handleAIPrompt}
            title="AI Assistant - Enhance with Gemini (Ctrl+I)"
          >
            <span style={{ fontSize: '14px' }}>🤖</span>
          </button>
          <div className="toolbar-separator"></div>
          <button 
            className="toolbar-button" 
            onClick={handleUndo}
            disabled={currentUndoIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <span style={{ fontSize: '14px' }}>↶</span>
          </button>
          <button 
            className="toolbar-button" 
            onClick={handleRedo}
            disabled={currentUndoIndex >= undoHistory.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <span style={{ fontSize: '14px' }}>↷</span>
          </button>
          <div className="toolbar-separator"></div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="file-input"
          />
        </div>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
          }}
          value={markdown}
          onChange={(e) => {
            // Only save to history if it's a significant change (more than 10 characters difference)
            const newValue = e.target.value;
            if (Math.abs(newValue.length - markdown.length) > 10 || newValue.trim() !== markdown.trim()) {
              saveToUndoHistory(markdown);
            }
            setMarkdown(newValue);
          }}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          onPaste={handlePaste}
          placeholder="🚀 Start writing your markdown here... 

✨ Features:
• **Bold** and *italic* text
• Headers with # ## ###
• Code blocks with ```
• Math expressions with $ or $$
• Tables, lists, and links
• Drag & drop or paste images
• 🤖 AI enhancement with Gemini"
          spellCheck="false"
        />
      </div>
      
      <div className="preview-panel">
        <div className="panel-header">
          <span>👁️ Live Preview</span>
          <button 
            className="download-button"
            onClick={handleDownloadPDF}
            title={getDownloadButtonTitle()}
            disabled={downloadStatus === 'generating'}
          >
            {getDownloadButtonContent()}
          </button>
        </div>
        <div className="preview-content">
          <ReactMarkdown
            remarkPlugins={settings.renderLatex ? [remarkGfm, remarkMath] : [remarkGfm]}
            rehypePlugins={settings.renderLatex ? [rehypeKatex, rehypeRaw] : [rehypeRaw]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={tomorrow}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
      
      </div> {/* Close markdown-editor div */}
      
      {/* Floating AI Assistant Button */}
      {showFloatingAI && (
        <div 
          className="floating-ai-button"
          style={{
            position: 'fixed',
            left: `${floatingAIPosition.x}px`,
            top: `${floatingAIPosition.y}px`,
            zIndex: 999
          }}
          onClick={handleFloatingAIClick}
          title="Enhance selected text with AI"
        >
          🤖 AI
        </div>
      )}
      
      <AIModal
        isOpen={isAIModalOpen}
        onClose={handleCloseAIModal}
        onApply={handleAIApply}
        selectedText={selectedText}
        fullContent={markdown}
      />
      
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        onShare={handleShare}
        documentTitle={documentTitle}
        markdown={markdown}
      />
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettings}
      />
      
      <CollectionsModal
        isOpen={isCollectionsOpen}
        onClose={() => setIsCollectionsOpen(false)}
        onSelectDocument={handleSelectDocument}
      />
    </div>
  );
};

export default MarkdownEditor;
