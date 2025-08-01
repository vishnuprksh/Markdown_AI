import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-profile')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="user-profile">
      <button 
        className="profile-button"
        onClick={toggleDropdown}
        title={`Signed in as ${user.displayName || user.email}`}
      >
        <img 
          src={user.photoURL || '/assets/default-avatar.svg'} 
          alt={user.displayName || 'User'} 
          className="profile-avatar"
          onError={(e) => {
            e.target.src = `data:image/svg+xml;base64,${btoa(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#667eea"/>
                <circle cx="16" cy="12" r="4" fill="white"/>
                <circle cx="16" cy="24" r="6" fill="white"/>
              </svg>
            `)}`;
          }}
        />
        <span className="profile-name">
          {user.displayName || user.email?.split('@')[0] || 'User'}
        </span>
        <svg 
          className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} 
          width="16" 
          height="16" 
          viewBox="0 0 16 16"
        >
          <path 
            fill="currentColor" 
            d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <img 
              src={user.photoURL || '/assets/default-avatar.svg'} 
              alt={user.displayName || 'User'} 
              className="dropdown-avatar"
              onError={(e) => {
                e.target.src = `data:image/svg+xml;base64,${btoa(`
                  <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#667eea"/>
                    <circle cx="24" cy="18" r="6" fill="white"/>
                    <circle cx="24" cy="36" r="9" fill="white"/>
                  </svg>
                `)}`;
              }}
            />
            <div className="dropdown-user-info">
              <div className="dropdown-name">
                {user.displayName || 'User'}
              </div>
              <div className="dropdown-email">
                {user.email}
              </div>
            </div>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-actions">
            <button 
              className={`logout-button ${isLoggingOut ? 'logging-out' : ''}`}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <div className="spinner-small"></div>
                  Signing out...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/>
                    <path d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"/>
                  </svg>
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
