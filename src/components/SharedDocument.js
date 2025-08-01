import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { shareService } from '../services/shareService';
import './SharedDocument.css';

const SharedDocument = () => {
  const { shareId } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSharedDocument = async () => {
      try {
        setLoading(true);
        const sharedDoc = await shareService.getSharedDocument(shareId);
        setDocument(sharedDoc);
      } catch (err) {
        console.error('Error loading shared document:', err);
        setError('Document not found or no longer available');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadSharedDocument();
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="shared-document-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading shared document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-document-container">
        <div className="error-container">
          <h1>📄 Document Not Found</h1>
          <p>{error}</p>
          <p>The document may have been removed or the link may be invalid.</p>
          <a href="/" className="back-home-link">← Back to Markdown AI Editor</a>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="shared-document-container">
        <div className="error-container">
          <h1>📄 Document Not Available</h1>
          <p>This document is not available for viewing.</p>
          <a href="/" className="back-home-link">← Back to Markdown AI Editor</a>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-document-container">
      <div className="shared-document-header">
        <div className="header-content">
          <h1 className="document-title">📝 {document.title}</h1>
          <div className="document-meta">
            <span className="created-date">
              Shared on {document.createdAt ? new Date(document.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
            </span>
            {document.isPublic && (
              <span className="public-badge">🌐 Public</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <a href="/" className="back-link">
            ← Back to Editor
          </a>
        </div>
      </div>

      <div className="shared-document-content">
        <div className="content-wrapper">
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
            {document.content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="shared-document-footer">
        <div className="footer-content">
          <p>📝 Created with <strong>Markdown AI Editor</strong></p>
          <p>
            <a href="/" className="editor-link">
              Create your own documents →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedDocument;
