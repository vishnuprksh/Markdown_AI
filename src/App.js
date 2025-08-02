import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import MarkdownEditor from './components/MarkdownEditor';
import Login from './components/Login';
import SharedDocument from './components/SharedDocument';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          Loading...
        </div>
      </div>
    );
  }

  return user ? <MarkdownEditor /> : <Login />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <div className="App">
            <Routes>
              <Route path="/share/:shareId" element={<SharedDocument />} />
              <Route path="/" element={<AppContent />} />
            </Routes>
          </div>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
