import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query,
  where,
  getDocs
} from 'firebase/firestore';

/* 
 * Firestore Index Requirements:
 * 
 * For optimal query performance, create these composite indexes in Firebase Console:
 * 1. Collection: 'documents'
 *    Fields: userId (Ascending), updatedAt (Descending)
 *    
 * Note: The app will work without these indexes using JavaScript sorting,
 * but performance will be slower for large datasets.
 */

export const documentService = {
  // Check if a document with the same title already exists for the user
  async checkDuplicateTitle(userId, title, excludeDocId = null) {
    try {
      console.log(`🔍 Checking for duplicates: userId="${userId}", title="${title}", excluding="${excludeDocId}"`);
      
      const documentsRef = collection(db, 'documents');
      const q = query(
        documentsRef,
        where('userId', '==', userId),
        where('title', '==', title.trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      // Check if any documents exist with this title
      const duplicates = [];
      querySnapshot.forEach((doc) => {
        // Exclude the current document if we're updating
        if (doc.id !== excludeDocId) {
          duplicates.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      console.log(`📊 Found ${duplicates.length} duplicate(s) for title "${title}"`);
      return duplicates.length > 0 ? duplicates : null;
    } catch (error) {
      console.error('Error checking for duplicate titles:', error);
      throw error;
    }
  },

  // Generate a unique title by appending a number
  async generateUniqueTitle(userId, baseTitle) {
    console.log(`🔄 Generating unique title for base: "${baseTitle}"`);
    let counter = 1;
    let candidateTitle = baseTitle;
    
    while (await this.checkDuplicateTitle(userId, candidateTitle)) {
      counter++;
      candidateTitle = `${baseTitle} (${counter})`;
      console.log(`📝 Trying candidate title: "${candidateTitle}"`);
      
      // Safety check to prevent infinite loops
      if (counter > 100) {
        candidateTitle = `${baseTitle} (${Date.now()})`;
        break;
      }
    }
    
    console.log(`✅ Generated unique title: "${candidateTitle}"`);
    return candidateTitle;
  },

  // Save a new document with improved error handling
  async saveDocument(userId, title, content, docId = null) {
    try {
      // Validate inputs thoroughly
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID provided');
      }
      
      if (!title || typeof title !== 'string') {
        title = 'Untitled';
      }
      
      if (typeof content !== 'string') {
        content = content || '';
      }

      // Clean and validate the data
      const cleanUserId = String(userId).trim();
      const cleanTitle = String(title).trim() || 'Untitled';
      const cleanContent = String(content);
      
      // Check for duplicate titles
      console.log('Checking for duplicate document titles...');
      const duplicates = await this.checkDuplicateTitle(cleanUserId, cleanTitle, docId);
      if (duplicates) {
        // Generate a suggested alternative title
        const suggestedTitle = await this.generateUniqueTitle(cleanUserId, cleanTitle);
        throw new Error(`A document with the title "${cleanTitle}" already exists. Suggested alternative: "${suggestedTitle}"`);
      }
      
      console.log('Saving document with data:', {
        userId: cleanUserId,
        title: cleanTitle,
        contentLength: cleanContent.length,
        docId
      });

      // Use ISO strings for timestamps to avoid serialization issues
      const now = new Date().toISOString();
      
      if (docId) {
        // Update existing document using setDoc for better reliability
        console.log('Updating existing document:', docId);
        
        const docRef = doc(db, 'documents', docId);
        
        const updateData = {
          userId: cleanUserId,
          title: cleanTitle,
          content: cleanContent,
          updatedAt: now
        };
        
        // Use setDoc with merge to ensure the document exists
        await setDoc(docRef, updateData, { merge: true });
        
        console.log('✅ Document updated successfully');
        return docId;
        
      } else {
        // Create new document
        console.log('Creating new document...');
        
        const documentData = {
          userId: cleanUserId,
          title: cleanTitle,
          content: cleanContent,
          createdAt: now,
          updatedAt: now
        };
        
        // Try using setDoc with a generated ID first
        const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const docRef = doc(db, 'documents', newDocId);
        
        await setDoc(docRef, documentData);
        
        console.log('✅ New document created successfully:', newDocId);
        return newDocId;
      }
      
    } catch (error) {
      console.error('❌ Error saving document:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack?.substring(0, 500) // Truncate stack trace
      });
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check Firestore security rules.');
      } else if (error.code === 'unavailable') {
        throw new Error('Firestore service is temporarily unavailable. Please try again.');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Invalid data format. Please check your input.');
      } else {
        throw new Error(`Failed to save document: ${error.message}`);
      }
    }
  },

  // Load a document by ID
  async loadDocument(docId) {
    try {
      const docRef = doc(db, 'documents', docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error('Error loading document:', error);
      throw new Error('Failed to load document');
    }
  }
};

export default documentService;
