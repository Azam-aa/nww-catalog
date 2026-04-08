# Deployment Guide - NWW Catalog

This guide explains how to deploy the application to Vercel and configure Firebase and Cloudinary for hosting, database, and image storage.

## 1. Firebase Configuration

You need a Firebase project with **Firestore** enabled.

### Database Rules
Ensure your Firestore rules allow read/write access (you may want to restrict this in production later):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ Restricted access is recommended later
    }
  }
}
```

## 2. Cloudinary Configuration

Cloudinary is used for optimized image storage, especially for mobile uploads.

1.  **Cloud Name**: Found in your Cloudinary Dashboard.
2.  **Upload Preset**: 
    - Go to **Settings** -> **Upload**.
    - Add a new **Upload preset**.
    - Set **Signing Mode** to `Unsigned`.
    - Note down the name of this preset.

## 3. Vercel Deployment

When deploying to Vercel, add the following **Environment Variables** in the Project Settings:

### Firebase Variables
| Key | Value |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `nww-catalog.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | e.g. `nww-catalog` |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g. `nww-catalog.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Sender ID |
| `VITE_FIREBASE_APP_ID` | Your App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your Measurement ID (optional) |

### Cloudinary Variables
| Key | Value |
| :--- | :--- |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Your **Unsigned** Upload Preset |

## 4. Mobile Image Uploads

The application is optimized for mobile uploads:
- **Image Compression**: Automatically reduces image size before uploading to save data and improve speed.
- **Progress Tracking**: Shows a progress bar during the upload process.
- **Multi-image Support**: Supports up to 5 images per product.

---

## Git Commands to Commit & Push

Use these commands in your terminal to save your progress and update your GitHub repository:

```bash
git add .
git commit -m "Optimize loading speed and update deployment documentation"
git push origin master
```
