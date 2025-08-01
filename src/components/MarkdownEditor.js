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
import UserProfile from './UserProfile';
import AIModal from './AIModal';

const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState(`# 🚀 Markdown AI Editor

Welcome to your **enhanced** markdown editor with beautiful styling, **LaTeX** support, and seamless image uploads!

## ✨ Key Features

- **Rich Typography** with beautiful gradients and modern design
- *Elegant* syntax highlighting and code blocks
- \`Enhanced inline code\` styling
- 📊 Beautiful tables with hover effects
- 🖼️ Drag & drop image uploads to Firebase
- 🧮 Advanced LaTeX math rendering
- 📱 Fully responsive design

## 🧮 Math Examples

Inline math works beautifully: $E = mc^2$ and $f(x) = x^2 + 2x + 1$

Block math with enhanced styling:
$$
\\frac{d}{dx}\\left( \\int_{0}^{x} f(u) \\, du\\right) = f(x)
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

## 💻 Code Examples

JavaScript with beautiful syntax highlighting:

\`\`\`javascript
function createAwesomeApp() {
  const features = ['markdown', 'latex', 'images'];
  return features.map(f => \`✅ \${f}\`).join('\\n');
}

console.log(createAwesomeApp());
\`\`\`

Python example:

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

def plot_function(x):
    return np.sin(x) * np.exp(-x/10)

x = np.linspace(0, 20, 1000)
y = plot_function(x)
plt.plot(x, y, 'b-', linewidth=2)
plt.show()
\`\`\`

## 📊 Enhanced Table

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Markdown Rendering | ✅ Complete | High | Full GFM support |
| LaTeX Math | ✅ Complete | High | KaTeX integration |
| Image Upload | ✅ Complete | Medium | Firebase Storage |
| Syntax Highlighting | ✅ Complete | Medium | Prism.js powered |
| Responsive Design | ✅ Complete | High | Mobile-friendly |
| Dark Mode | 🚧 Planned | Low | Coming soon |

## 🎨 Enhanced Styling Features

> **Tip**: This blockquote demonstrates the beautiful gradient styling and improved typography that makes your content stand out!

### Lists with Custom Bullets

- Beautiful custom bullet points
- Enhanced spacing and typography
- Hover effects on interactive elements
- Smooth animations and transitions

### Numbered Lists

1. First item with enhanced styling
2. Second item with perfect spacing
3. Third item with beautiful typography

## 🖼️ Image Upload Demo

![Sample Image](/assets/sample-image.svg)

**Pro tip**: You can paste images directly from your clipboard (Ctrl+V) and they'll be automatically uploaded to Firebase Storage!

---

> 🎉 **Ready to create?** Start editing this text in the left panel to see the beautiful live preview in action!`);

  // Undo history state
  const [undoHistory, setUndoHistory] = useState([]);
  const [currentUndoIndex, setCurrentUndoIndex] = useState(-1);
  
  // AI Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleCloseAIModal = () => {
    setIsAIModalOpen(false);
    setSelectedText('');
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
      const previousContent = undoHistory[currentUndoIndex - 1];
      setMarkdown(previousContent);
      setCurrentUndoIndex(prev => prev - 1);
    }
  }, [currentUndoIndex, undoHistory]);

  const handleRedo = useCallback(() => {
    if (currentUndoIndex < undoHistory.length - 1) {
      const nextContent = undoHistory[currentUndoIndex + 1];
      setMarkdown(nextContent);
      setCurrentUndoIndex(prev => prev + 1);
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
            
            // Restore cursor position after the inserted image
            setTimeout(() => {
              textarea.focus();
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
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);
    updateMarkdown(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
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
    <div className="markdown-editor">
      <div className="editor-panel">
        <div className="panel-header">
          <span>📝 Markdown Editor</span>
          <UserProfile />
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
            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{ }</span>
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
          <span className="toolbar-hint" title="💡 Tip: Paste images directly (Ctrl+V) - automatically uploaded to Firebase Storage">
            💡 Paste images with Ctrl+V
          </span>
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
          value={markdown}
          onChange={(e) => {
            // Only save to history if it's a significant change (more than 10 characters difference)
            const newValue = e.target.value;
            if (Math.abs(newValue.length - markdown.length) > 10 || newValue.trim() !== markdown.trim()) {
              saveToUndoHistory(markdown);
            }
            setMarkdown(newValue);
          }}
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
          👁️ Live Preview
        </div>
        <div className="preview-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
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
      
      <AIModal
        isOpen={isAIModalOpen}
        onClose={handleCloseAIModal}
        onApply={handleAIApply}
        selectedText={selectedText}
        fullContent={markdown}
      />
    </div>
  );
};

export default MarkdownEditor;
