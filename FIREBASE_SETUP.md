# Firebase Setup Instructions

This application uses Firebase Storage for image uploads. Follow these steps to set up Firebase:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Choose a project name (e.g., "markdown-ai-editor")

## 2. Enable Firebase Storage

1. In your Firebase project, go to "Build" > "Storage"
2. Click "Get started"
3. Start in test mode (for development)
4. Choose a storage location

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) 
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 4. Update Configuration

Create a `.env` file in your project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Then update the `.env` file with your actual Firebase config:

```env
REACT_APP_FIREBASE_API_KEY=your-actual-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```

**Important:** Never commit the `.env` file to version control!

## 5. Firebase Storage Security Rules (Optional for Production)

For production, update your Firebase Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read, write: if request.auth != null; // Requires authentication
      // Or for public access (development only):
      // allow read, write: if true;
    }
  }
}
```

## Features

- ✅ **Automatic Upload**: Images are automatically uploaded to Firebase Storage
- ✅ **Unique URLs**: Each image gets a permanent, shareable URL
- ✅ **Progress Indication**: Shows "Uploading..." placeholder during upload
- ✅ **Error Handling**: Graceful error handling with user feedback
- ✅ **Paste Support**: Paste images directly from clipboard (Ctrl+V)
- ✅ **File Upload**: Traditional file picker support

## Benefits of Firebase Storage

- **Scalable**: Handles any amount of images
- **Fast**: Global CDN for fast image loading
- **Reliable**: 99.9% uptime guarantee
- **Secure**: Built-in security rules
- **Cost-effective**: Pay only for what you use
