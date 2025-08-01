import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState(`# Markdown AI Editor

Welcome to your simple markdown editor with **LaTeX** and image support!

## Features

- **Bold** and *italic* text
- \`Inline code\` and code blocks
- Lists and tables
- Images and links
- LaTeX math expressions

## Math Examples

Inline math: $E = mc^2$

Block math:
$$
\\frac{d}{dx}\\left( \\int_{0}^{x} f(u) \\, du\\right) = f(x)
$$

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## Table Example

| Feature | Supported |
|---------|-----------|
| Markdown | ✅ |
| LaTeX | ✅ |
| Images | ✅ |
| Tables | ✅ |

## Image Example

![Sample Image](/assets/sample-image.svg)

> Try editing this text in the left panel to see the live preview!
`);

  const fileInputRef = useRef(null);

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

  // Convert base64 to File object
  const base64ToFile = (base64Data, filename, mimeType) => {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType || mime });
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
        setMarkdown(prev => prev.replace(uploadingMarkdown, imageMarkdown));
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
            setMarkdown(prev => prev.replace(uploadingMarkdown, imageMarkdown));
            
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
    const textarea = document.querySelector('.editor-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);
    setMarkdown(newText);
    
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
          Markdown Editor
        </div>
        <div className="toolbar">
          <button className="toolbar-button" onClick={insertHeader} title="Header">
            H
          </button>
          <button className="toolbar-button" onClick={insertBold} title="Bold">
            <strong>B</strong>
          </button>
          <button className="toolbar-button" onClick={insertItalic} title="Italic">
            <em>I</em>
          </button>
          <button className="toolbar-button" onClick={insertCode} title="Inline Code">
            &lt;/&gt;
          </button>
          <button className="toolbar-button" onClick={insertCodeBlock} title="Code Block">
            { }
          </button>
          <button className="toolbar-button" onClick={insertInlineMath} title="Inline Math">
            $x$
          </button>
          <button className="toolbar-button" onClick={insertMath} title="Math Block">
            $$
          </button>
          <button className="toolbar-button" onClick={insertTable} title="Table">
            📊
          </button>
          <button 
            className="toolbar-button" 
            onClick={() => fileInputRef.current?.click()}
            title="Insert Image"
          >
            📷
          </button>
          <span className="toolbar-hint" title="Paste images directly (Ctrl+V) - automatically uploaded to Firebase">
            📋🔥
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
          className="editor-textarea"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          onPaste={handlePaste}
          placeholder="Start typing your markdown here..."
          spellCheck="false"
        />
      </div>
      
      <div className="preview-panel">
        <div className="panel-header">
          Preview
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
    </div>
  );
};

export default MarkdownEditor;
