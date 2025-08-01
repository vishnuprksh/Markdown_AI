import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

class ShareService {
  // Generate a shareable HTML document
  generateShareableHTML(title, markdown, isPublic = true) {
    // Convert markdown to a simple HTML representation for sharing
    // This is a basic implementation - in a real app you'd use the same markdown parser
    const htmlContent = this.markdownToBasicHTML(markdown);
    
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #ffffff;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 2.5em;
            margin: 0;
            color: #2c3e50;
        }
        .subtitle {
            color: #7f8c8d;
            margin-top: 10px;
            font-size: 0.9em;
        }
        .content {
            background: #fdfdfd;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 0.85em;
        }
        pre {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 16px;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
        }
        blockquote {
            border-left: 4px solid #667eea;
            margin: 20px 0;
            padding-left: 20px;
            color: #555;
            background: #f9f9f9;
            border-radius: 0 4px 4px 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        h1 { font-size: 2.2em; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        h2 { font-size: 1.8em; }
        h3 { font-size: 1.4em; }
        .math-display {
            text-align: center;
            margin: 20px 0;
        }
        .share-warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 20px;
            color: #856404;
        }
        @media (max-width: 768px) {
            body {
                margin: 20px auto;
                padding: 15px;
            }
            .title {
                font-size: 2em;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${this.escapeHtml(title)}</h1>
        <div class="subtitle">Shared from Markdown AI Editor</div>
    </div>
    
    ${isPublic ? '' : '<div class="share-warning">⚠️ This document is shared with view-only access.</div>'}
    
    <div class="content">
        ${htmlContent}
    </div>
    
    <div class="footer">
        <p>📝 Created with <strong>Markdown AI Editor</strong></p>
        <p><small>Generated on ${new Date().toLocaleDateString()}</small></p>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false}
                ]
            });
        });
    </script>
</body>
</html>`;
    
    return template;
  }

  // Basic markdown to HTML converter (simplified)
  markdownToBasicHTML(markdown) {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    
    // Line breaks and paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><h([1-6])>/g, '<h$1>');
    html = html.replace(/<\/h([1-6])><\/p>/g, '</h$1>');
    html = html.replace(/<p><pre>/g, '<pre>');
    html = html.replace(/<\/pre><\/p>/g, '</pre>');
    
    return html;
  }

  // Escape HTML characters
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Create a shareable document in Firestore
  async createShareableDocument(userId, title, markdown, isPublic = true) {
    try {
      console.log('Creating shareable document with data:', {
        titleLength: title.length,
        contentLength: markdown.length,
        isPublic,
        userId
      });

      const shareData = {
        title: title.replace('.md', ''),
        content: markdown,
        // Store HTML content separately to avoid size issues
        // htmlContent: this.generateShareableHTML(title, markdown, isPublic),
        isPublic: isPublic,
        createdBy: userId,
        createdAt: serverTimestamp(),
        viewCount: 0
      };

      console.log('Attempting to add document to Firestore...');
      const docRef = await addDoc(collection(db, 'shared_documents'), shareData);
      console.log('Document created successfully with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating shareable document:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        customData: error.customData
      });
      throw error;
    }
  }

  // Get a shared document
  async getSharedDocument(shareId) {
    try {
      const docRef = doc(db, 'shared_documents', shareId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error('Shared document not found');
      }
    } catch (error) {
      console.error('Error getting shared document:', error);
      throw error;
    }
  }

  // Generate share URL
  generateShareURL(shareId) {
    const baseURL = window.location.origin;
    return `${baseURL}/share/${shareId}`;
  }

  // Generate a data URL for instant sharing (for small documents)
  generateDataURL(title, markdown) {
    const html = this.generateShareableHTML(title, markdown, true);
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }
}

export const shareService = new ShareService();
