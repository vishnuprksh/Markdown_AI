import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';

// Simple Firestore test service to debug 400 errors
export const firestoreTestService = {
  // Test basic write operation
  async testBasicWrite(userId) {
    try {
      console.log('Testing basic Firestore write...');
      
      // Use setDoc with a specific document ID to avoid auto-generation issues
      const testDocRef = doc(db, 'test', `user_${userId}_${Date.now()}`);
      
      const testData = {
        userId: String(userId), // Ensure it's a string
        message: 'Test document',
        timestamp: new Date().toISOString(), // Use ISO string instead of Date object
        testNumber: 123,
        testBoolean: true
      };
      
      console.log('Attempting to write test data:', testData);
      
      await setDoc(testDocRef, testData);
      
      console.log('✅ Basic write test successful');
      return { success: true, id: testDocRef.id };
      
    } catch (error) {
      console.error('❌ Basic write test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Test basic read operation
  async testBasicRead(docId) {
    try {
      console.log('Testing basic Firestore read...');
      
      const docRef = doc(db, 'test', docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ Basic read test successful:', docSnap.data());
        return { success: true, data: docSnap.data() };
      } else {
        console.log('❌ Document not found');
        return { success: false, error: 'Document not found' };
      }
      
    } catch (error) {
      console.error('❌ Basic read test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test collection operations (uses test collection to avoid polluting documents)
  async testCollectionWrite(userId) {
    try {
      console.log('Testing collection write...');
      
      const testData = {
        userId: String(userId),
        title: 'Test Document',
        content: '# Test Content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTestDocument: true // Mark as test document
      };
      
      console.log('Attempting to write to test_documents collection:', testData);
      
      // Use a separate test collection to avoid polluting the main documents collection
      const docRef = await addDoc(collection(db, 'test_documents'), testData);
      
      console.log('✅ Collection write test successful, ID:', docRef.id);
      
      // Clean up the test document immediately
      try {
        await deleteDoc(doc(db, 'test_documents', docRef.id));
        console.log('🧹 Test document cleaned up successfully');
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up test document, but test passed:', cleanupError.message);
      }
      
      return { success: true, id: docRef.id };
      
    } catch (error) {
      console.error('❌ Collection write test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Clean up any test documents that might exist in the main documents collection
  async cleanupTestDocuments(userId) {
    try {
      console.log('🧹 Cleaning up any existing test documents...');
      
      // Import additional Firestore functions for cleanup
      const { query, where, getDocs } = await import('firebase/firestore');
      
      const documentsRef = collection(db, 'documents');
      const q = query(
        documentsRef,
        where('userId', '==', userId),
        where('title', '==', 'Test Document')
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      
      querySnapshot.forEach((doc) => {
        console.log('🗑️ Found test document to delete:', doc.id);
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`✅ Cleaned up ${deletePromises.length} test document(s)`);
      } else {
        console.log('✅ No test documents found to clean up');
      }
      
      return { success: true, cleaned: deletePromises.length };
      
    } catch (error) {
      console.error('❌ Test document cleanup failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default firestoreTestService;
