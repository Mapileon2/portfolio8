# 🔒 Security Setup Guide

This guide will help you secure your existing Firebase and Cloudinary setup and integrate them into the enhanced portfolio architecture.

## 🚨 CRITICAL: Immediate Actions Required

### 1. **Stop Using Exposed Credentials**

Your current credentials are compromised and must be replaced immediately:

**Exposed Firebase API Key**: `AIzaSyBr8ZruVUy_bHlnQRR-J_D5swyKQobkCWg`
**Exposed Cloudinary Credentials**:
- API Key: `878564287771594`
- API Secret: `kUkyXlZ3wQ8qtr-ZNr2eWcqt4cc`
- Cloud Name: `dlvtcwqu7`

## 🔧 Step 1: Regenerate Firebase Credentials

### 1.1 Create New Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `projectportfolio-29467`
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file (keep it secure!)

### 1.2 Update Firebase Security Rules

Replace your current Firebase Realtime Database rules:

```json
{
  "rules": {
    ".read": true,
    ".write": false,
    
    "caseStudies": {
      ".read": true,
      ".write": "auth != null && auth.token.admin == true",
      "$caseStudyId": {
        ".validate": "newData.hasChildren(['projectTitle', 'createdAt']) && newData.child('projectTitle').isString() && newData.child('projectTitle').val().length > 0 && newData.child('projectTitle').val().length <= 200"
      }
    },
    
    "carouselImages": {
      ".read": true,
      ".write": "auth != null && auth.token.admin == true",
      "$imageId": {
        ".validate": "newData.hasChildren(['url', 'createdAt']) && newData.child('url').isString()"
      }
    },
    
    "sections": {
      ".read": true,
      ".write": "auth != null && auth.token.admin == true"
    },
    
    "analytics": {
      ".read": "auth != null && auth.token.admin == true",
      ".write": "auth != null && auth.token.admin == true"
    }
  }
}
```

### 1.3 Set Up Environment Variables

Create a new `.env` file in your enhanced-architecture folder:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration (from your new service account JSON)
FIREBASE_PROJECT_ID=projectportfolio-29467
FIREBASE_PRIVATE_KEY_ID=your-new-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_NEW_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@projectportfolio-29467.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-new-client-id
FIREBASE_DATABASE_URL=https://projectportfolio-29467-default-rtdb.firebaseio.com

# Cloudinary Configuration (create new account or regenerate)
CLOUDINARY_CLOUD_NAME=your-new-cloud-name
CLOUDINARY_API_KEY=your-new-api-key
CLOUDINARY_API_SECRET=your-new-api-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=your-email@gmail.com
SEND_AUTO_REPLY=true

# Site Information
SITE_NAME=Your Portfolio
SITE_URL=https://yourportfolio.com
FRONTEND_URL=https://yourportfolio.com

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_SEARCH=true
ENABLE_CONTACT_FORM=true
ENABLE_FIREBASE=true
ENABLE_CLOUDINARY=true
```

## 🔧 Step 2: Regenerate Cloudinary Credentials

### 2.1 Option A: Create New Cloudinary Account (Recommended)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a new account with a different email
3. Get your new credentials from the dashboard

### 2.2 Option B: Regenerate Existing Account Credentials

1. Log into your existing Cloudinary account
2. Go to **Settings** → **Security**
3. Click **Regenerate API Secret**
4. Update your cloud name if possible

### 2.3 Migrate Existing Images (Optional)

If you want to keep your existing images, you can migrate them:

```javascript
// Migration script (run once)
const oldCloudinary = require('cloudinary').v2;
const newCloudinary = require('cloudinary').v2;

// Configure old account
oldCloudinary.config({
  cloud_name: 'dlvtcwqu7',
  api_key: '878564287771594',
  api_secret: 'kUkyXlZ3wQ8qtr-ZNr2eWcqt4cc'
});

// Configure new account
newCloudinary.config({
  cloud_name: 'your-new-cloud-name',
  api_key: 'your-new-api-key',
  api_secret: 'your-new-api-secret'
});

// Migrate images
async function migrateImages() {
  const resources = await oldCloudinary.api.resources({
    type: 'upload',
    prefix: 'portfolio/',
    max_results: 500
  });

  for (const resource of resources.resources) {
    try {
      // Download from old account and upload to new
      const result = await newCloudinary.uploader.upload(resource.secure_url, {
        public_id: resource.public_id,
        folder: 'portfolio'
      });
      console.log(`Migrated: ${resource.public_id}`);
    } catch (error) {
      console.error(`Failed to migrate ${resource.public_id}:`, error);
    }
  }
}
```

## 🔧 Step 3: Set Up Client-Side Environment

Create a `.env.local` file for your React app:

```bash
# Client-side Firebase config (public - safe to expose)
VITE_FIREBASE_API_KEY=your-public-api-key
VITE_FIREBASE_AUTH_DOMAIN=projectportfolio-29467.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projectportfolio-29467
VITE_FIREBASE_STORAGE_BUCKET=projectportfolio-29467.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 🔧 Step 4: Install Dependencies

```bash
cd enhanced-architecture
npm install
```

## 🔧 Step 5: Create Admin User

### 5.1 Start the Server

```bash
npm run dev
```

### 5.2 Create Admin User (Development Only)

```bash
curl -X POST http://localhost:3000/api/firebase/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourportfolio.com",
    "password": "your-secure-password",
    "displayName": "Portfolio Admin"
  }'
```

## 🔧 Step 6: Test the Setup

### 6.1 Test Firebase Connection

```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "firebase": { "status": "healthy" },
    "cloudinary": { "status": "healthy" }
  }
}
```

### 6.2 Test Admin Login

1. Go to `http://localhost:3000/admin-login`
2. Use the admin credentials you created
3. Verify you can access admin features

### 6.3 Test Image Upload

1. Login as admin
2. Try uploading an image
3. Verify it appears in your new Cloudinary account

## 🔧 Step 7: Clean Up Old Files

### 7.1 Remove Exposed Credentials

Delete or secure these files:
- `vercel.env` (contains exposed credentials)
- `firebase-key.json` (if it exists)
- Any hardcoded credentials in HTML files

### 7.2 Update Existing Files

Replace hardcoded Firebase config in your existing files:

```javascript
// OLD (INSECURE)
const firebaseConfig = {
  apiKey: "AIzaSyBr8ZruVUy_bHlnQRR-J_D5swyKQobkCWg",
  // ...
};

// NEW (SECURE)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
};
```

## 🔧 Step 8: Deploy Securely

### 8.1 Environment Variables for Production

Set these in your hosting platform (Vercel, Netlify, etc.):

**Server Environment Variables:**
```bash
NODE_ENV=production
FIREBASE_PROJECT_ID=projectportfolio-29467
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@projectportfolio-29467.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_DATABASE_URL=https://projectportfolio-29467-default-rtdb.firebaseio.com
CLOUDINARY_CLOUD_NAME=your-new-cloud-name
CLOUDINARY_API_KEY=your-new-api-key
CLOUDINARY_API_SECRET=your-new-api-secret
```

**Client Environment Variables:**
```bash
VITE_FIREBASE_API_KEY=your-public-api-key
VITE_FIREBASE_AUTH_DOMAIN=projectportfolio-29467.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projectportfolio-29467
VITE_FIREBASE_STORAGE_BUCKET=projectportfolio-29467.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 8.2 Update CORS Settings

Update your CORS origins in production:

```javascript
// In server.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

## ✅ Security Checklist

- [ ] Regenerated Firebase service account key
- [ ] Updated Firebase security rules
- [ ] Regenerated Cloudinary credentials
- [ ] Removed all hardcoded credentials from code
- [ ] Set up environment variables
- [ ] Created secure admin user
- [ ] Tested all functionality
- [ ] Updated CORS settings
- [ ] Deployed with secure environment variables
- [ ] Verified no credentials in version control

## 🚨 Important Security Notes

1. **Never commit `.env` files** to version control
2. **Use different credentials** for development and production
3. **Regularly rotate API keys** (every 3-6 months)
4. **Monitor Firebase and Cloudinary usage** for suspicious activity
5. **Enable 2FA** on all service accounts
6. **Use HTTPS only** in production
7. **Implement proper error handling** to avoid information leakage

## 🆘 If You Need Help

1. **Firebase Issues**: Check Firebase Console logs
2. **Cloudinary Issues**: Check Cloudinary dashboard
3. **Authentication Issues**: Verify JWT tokens and admin claims
4. **CORS Issues**: Check browser console and server logs

## 📞 Emergency Response

If you suspect your credentials are still compromised:

1. **Immediately disable** the compromised service accounts
2. **Generate new credentials** with different names/emails
3. **Update all environment variables**
4. **Monitor logs** for suspicious activity
5. **Consider changing project IDs** if necessary

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures!