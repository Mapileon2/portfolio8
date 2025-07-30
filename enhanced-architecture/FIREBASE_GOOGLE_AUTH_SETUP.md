# 🔥 Firebase Google Authentication Setup Guide (Free Plan)

## 🎯 **What You Need to Set Up in Firebase Console**

### **Step 1: Create Firebase Project**

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Project Setup:**
   ```
   Project name: portfolio-auth (or your preferred name)
   Enable Google Analytics: Optional (recommended for free plan)
   Location: Choose your region
   ```

### **Step 2: Enable Authentication**

1. **In Firebase Console, go to "Authentication"**
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Enable Google Sign-in:**
   - Click on "Google"
   - Toggle "Enable"
   - Set project support email (your Gmail)
   - Click "Save"

### **Step 3: Set Up Realtime Database**

1. **Go to "Realtime Database" in sidebar**
2. **Click "Create Database"**
3. **Choose location:** `us-central1` (free tier)
4. **Security rules:** Start in test mode (we'll secure it later)

### **Step 4: Configure Web App**

1. **Go to Project Settings (gear icon)**
2. **Scroll to "Your apps" section**
3. **Click "Add app" → Web app**
4. **App setup:**
   ```
   App nickname: portfolio-web
   Firebase Hosting: No (we're using Vercel)
   ```
5. **Copy the config object** (you'll need this)

### **Step 5: Set Up Service Account**

1. **Go to Project Settings → Service accounts**
2. **Click "Generate new private key"**
3. **Download the JSON file** (keep it secure!)
4. **Extract the values** for environment variables

## 🔒 **Database Security Rules (Free Plan Optimized)**

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "portfolio": {
      "case-studies": {
        ".read": true,
        ".write": "auth != null && (auth.token.email == 'your-email@gmail.com' || auth.token.admin == true)"
      },
      "carousel-images": {
        ".read": true,
        ".write": "auth != null && (auth.token.email == 'your-email@gmail.com' || auth.token.admin == true)"
      },
      "sections": {
        ".read": true,
        ".write": "auth != null && (auth.token.email == 'your-email@gmail.com' || auth.token.admin == true)"
      },
      "analytics": {
        ".read": "auth != null && (auth.token.email == 'your-email@gmail.com' || auth.token.admin == true)",
        ".write": true
      },
      "contacts": {
        ".read": "auth != null && (auth.token.email == 'your-email@gmail.com' || auth.token.admin == true)",
        ".write": true
      }
    }
  }
}
```

## 💰 **Free Plan Limits & Optimization**

### **What's Included in Free Plan:**
- ✅ **Authentication**: 10,000 phone auths/month (Google auth is unlimited)
- ✅ **Realtime Database**: 1GB storage, 10GB/month transfer
- ✅ **Hosting**: 10GB storage, 360MB/day transfer
- ✅ **Cloud Functions**: 125K invocations/month, 40K GB-seconds/month

### **Cost-Effective Structure:**
```
portfolio/
├── case-studies/          # Your projects
├── carousel-images/       # Homepage images
├── sections/             # Page content
├── analytics/            # Visitor data (limited)
└── contacts/             # Contact form submissions
```

## 🔧 **Environment Variables You'll Need**

### **Client-side (.env.local):**
```bash
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_ADMIN_EMAIL=your-email@gmail.com
```

### **Server-side (.env):**
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=key-id-from-service-account
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=client-id-from-service-account
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
ADMIN_EMAIL=your-email@gmail.com
```

## 🚀 **Quick Setup Checklist**

- [ ] Create Firebase project
- [ ] Enable Google Authentication
- [ ] Set up Realtime Database
- [ ] Configure web app
- [ ] Download service account key
- [ ] Set database security rules
- [ ] Add environment variables
- [ ] Test authentication

## 💡 **Free Plan Tips**

1. **Use your Gmail as admin email** - no additional cost
2. **Limit analytics data** - to stay within database limits
3. **Optimize database structure** - minimize reads/writes
4. **Use client-side caching** - reduce database calls
5. **Monitor usage** - Firebase console shows usage stats

## 🔍 **Testing Your Setup**

1. **Test Google Sign-in** in Firebase Auth console
2. **Verify database rules** with the Rules Playground
3. **Check service account** permissions
4. **Test API calls** with your credentials

---

**Total Setup Time: ~15 minutes**
**Cost: $0/month (within free limits)**