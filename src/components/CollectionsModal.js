import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

const CollectionsModal = ({ isOpen, onClose, onSelectDocument }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadDocuments();
    }
  }, [isOpen, user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      console.log('Loading documents for user:', user.uid);
      
      const documentsRef = collection(db, 'documents');
      
      // Try the optimized query first (requires composite index)
      let querySnapshot;
      try {
        const q = query(
          documentsRef,
          where('userId', '==', user.uid),
          orderBy('updatedAt', 'desc')
        );
        querySnapshot = await getDocs(q);
        console.log('✅ Used optimized query with composite index');
      } catch (indexError) {
        console.log('⚠️ Composite index not available, falling back to simple query');
        console.log('💡 To optimize performance, create a composite index in Firebase Console:');
        console.log('   Fields: userId (Ascending), updatedAt (Descending)');
        
        // Fallback: Simple query without orderBy, then sort in JavaScript
        const simpleQuery = query(
          documentsRef,
          where('userId', '==', user.uid)
        );
        querySnapshot = await getDocs(simpleQuery);
      }
      
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by updatedAt in JavaScript if we used the fallback query
      docs.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
        return bTime - aTime; // Descending order (newest first)
      });
      
      console.log('Loaded documents:', docs.length);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message
      });
      
      // Handle specific Firestore errors
      if (error.code === 'failed-precondition') {
        console.log('🔧 Firestore index might be missing. The app will work but performance may be slower.');
      } else if (error.code === 'permission-denied') {
        console.error('Permission denied. Check Firestore security rules.');
      }
      
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDoc(doc(db, 'documents', docId));
        setDocuments(docs => docs.filter(doc => doc.id !== docId));
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPreview = (content) => {
    // Remove markdown syntax for a cleaner preview
    const cleanContent = content
      .replace(/#+\s*/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '[Code Block]') // Replace code blocks
      .replace(/!\[.*?\]\(.*?\)/g, '[Image]') // Replace images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace links
    
    return cleanContent.substring(0, 200) + (cleanContent.length > 200 ? '...' : '');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="collections-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📚 My Collections</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? (
                <>
                  <p>No documents found matching "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} className="clear-search-button">
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <p>📝 No documents yet</p>
                  <p>Create your first document and save it to see it here!</p>
                </>
              )}
            </div>
          ) : (
            <div className="documents-grid">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="document-card"
                  onClick={() => onSelectDocument(document)}
                >
                  <div className="document-header">
                    <h3 className="document-title">{document.title}</h3>
                    <button
                      className="delete-button"
                      onClick={(e) => handleDeleteDocument(document.id, e)}
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="document-preview">
                    {getPreview(document.content)}
                  </div>
                  <div className="document-meta">
                    <span className="document-date">
                      📅 {formatDate(document.updatedAt)}
                    </span>
                    <span className="document-words">
                      📊 {document.content.split(/\s+/).filter(word => word.length > 0).length} words
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionsModal;
