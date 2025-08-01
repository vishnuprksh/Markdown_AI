import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageMarkdown = `\n![${file.name}](${e.target.result})\n`;
        setMarkdown(prev => prev + imageMarkdown);
      };
      reader.readAsDataURL(file);
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
