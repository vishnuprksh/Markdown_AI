# Firebase Troubleshooting Guide

## Common Issues and Solutions

### 1. "Firebase: Error (auth/invalid-api-key)"

This error indicates that your Firebase API key is not valid. Here's how to fix it:

#### Step 1: Verify Your Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `markdown-ai-71673`
3. Click the gear icon ⚙️ > "Project settings"
4. Scroll down to "Your apps" section
5. Click on your web app (or create one if it doesn't exist)

#### Step 2: Get the Correct Configuration
Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

#### Step 3: Update Your .env File
Make sure your `.env` file has the correct values:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyAvj9wt3ss0-PxVhuQdVhA44y-p701zX5A
REACT_APP_FIREBASE_AUTH_DOMAIN=markdown-ai-71673.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=markdown-ai-71673
REACT_APP_FIREBASE_STORAGE_BUCKET=markdown-ai-71673.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=233496640133
REACT_APP_FIREBASE_APP_ID=1:233496640133:web:f53e68a1907a4a38ef87ec
```

#### Step 4: Enable Google Authentication
1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Click on "Google" provider
3. Toggle "Enable" to ON
4. Set a support email (required)
5. Click "Save"

#### Step 5: Check Authorized Domains
1. In "Authentication" > "Sign-in method", scroll to "Authorized domains"
2. Make sure these domains are listed:
   - `localhost` (for development)
   - Your production domain (if deploying)

#### Step 6: Restart Your Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

### 2. "Firebase: Error (auth/unauthorized-domain)"

This means your current domain is not authorized:

1. Go to Firebase Console > Authentication > Sign-in method
2. Scroll to "Authorized domains"
3. Add your domain:
   - For development: `localhost` (should already be there)
   - For production: your actual domain

### 3. Popup Blocked Errors

If the Google sign-in popup is blocked:

1. Enable popups for your site
2. Try the sign-in again
3. Alternative: The app will show a user-friendly error message

### 4. Network/CORS Errors

If you see CORS or network errors:

1. Make sure your Firebase project is active
2. Check that all Firebase services (Auth, Storage) are enabled
3. Verify your internet connection
4. Try clearing browser cache

## Debugging Steps

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for Firebase configuration debug info
4. Check for any red error messages

### Verify Environment Variables
The app will log configuration info to console. Look for:
```
Firebase Config: {
  apiKey: "AIzaSyAvj9...",
  authDomain: "markdown-ai-71673.firebaseapp.com",
  ...
}
```

If any fields show "MISSING", check your `.env` file.

### Test Firebase Connection
You can test the connection by opening the browser console and running:
```javascript
// This should show your Firebase app
console.log(window.firebase);
```

## Getting Help

If you're still having issues:

1. Check the browser console for specific error messages
2. Verify your Firebase project settings match your `.env` file
3. Make sure Google Authentication is enabled in Firebase Console
4. Try creating a new API key in Firebase Console if the current one doesn't work

## Security Notes

- Never commit your `.env` file to version control
- API keys for Firebase web apps are safe to expose (they're public identifiers)
- Security is enforced through Firebase Security Rules, not by hiding the API key
- Always set up proper Firebase Security Rules for production
