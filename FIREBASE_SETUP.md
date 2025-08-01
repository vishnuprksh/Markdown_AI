# Firebase Setup Instructions

This application uses Firebase for authentication (Google Sign-in) and Storage (for image uploads). Follow these steps to set up Firebase:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Choose a project name (e.g., "markdown-ai-editor")

## 2. Enable Firebase Authentication

1. In your Firebase project, go to "Build" > "Authentication"
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Google" as a sign-in provider:
   - Click on "Google"
   - Toggle "Enable"
   - Add your project's support email
   - Click "Save"

## 3. Enable Firebase Storage

1. In your Firebase project, go to "Build" > "Storage"
2. Click "Get started"
3. Start in test mode (for development)
4. Choose a storage location

## 4. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) 
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 5. Update Configuration

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

## 6. Configure Authorized Domains (For Production)

1. In Firebase Console, go to "Authentication" > "Settings" > "Authorized domains"
2. Add your production domain (e.g., `your-app.web.app` or your custom domain)
3. For development, `localhost` is automatically authorized

## 7. Firebase Security Rules

### Authentication Rules
The app automatically handles authentication - users must sign in with Google to access the editor.

### Storage Rules (Recommended for Production)

Update your Firebase Storage rules to require authentication:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read, write: if request.auth != null; // Requires authentication
      // For development/testing only (less secure):
      // allow read, write: if true;
    }
  }
}
```

## Features

### 🔐 Authentication
- ✅ **Google Sign-in**: Secure authentication using Google accounts
- ✅ **Session Persistence**: Stay logged in across browser sessions
- ✅ **User Profile**: Display user name and avatar
- ✅ **Secure Access**: Only authenticated users can access the editor

### 🖼️ Image Storage
- ✅ **Automatic Upload**: Images are automatically uploaded to Firebase Storage
- ✅ **Unique URLs**: Each image gets a permanent, shareable URL
- ✅ **Progress Indication**: Shows "Uploading..." placeholder during upload
- ✅ **Error Handling**: Graceful error handling with user feedback
- ✅ **Paste Support**: Paste images directly from clipboard (Ctrl+V)
- ✅ **File Upload**: Traditional file picker support

## Benefits of Firebase Integration

### Authentication
- **Secure**: Industry-standard OAuth 2.0 authentication
- **Easy Setup**: No complex user management required
- **Trusted**: Users authenticate with their existing Google accounts
- **Scalable**: Handles unlimited users

### Storage
- **Scalable**: Handles any amount of images
- **Fast**: Global CDN for fast image loading
- **Reliable**: 99.9% uptime guarantee
- **Secure**: Built-in security rules
- **Cost-effective**: Pay only for what you use

## Troubleshooting

### Authentication Issues
1. **"Unauthorized domain"**: Add your domain to authorized domains in Firebase Console
2. **"Invalid API key"**: Check your `.env` file configuration
3. **Sign-in popup blocked**: Enable popups for your domain

### Storage Issues
1. **Upload failed**: Check Firebase Storage rules and authentication
2. **Images not loading**: Verify storage bucket configuration
3. **CORS errors**: Ensure proper Firebase Storage setup

## Development vs Production

### Development
- Use `localhost` (automatically authorized)
- Can use test mode for storage rules
- Monitor usage in Firebase Console

### Production
- Add your production domain to authorized domains
- Implement proper security rules
- Set up monitoring and alerts
