# Vercel Deployment Guide

This guide explains how to deploy your portfolio website to Vercel and fix the issues with sections editor and Cloudinary integration.

## 1. Prerequisites

- A Vercel account (sign up at https://vercel.com)
- Your repository pushed to GitHub

## 2. Files to Upload

Make sure these files are in your repository:
- `vercel.env` (don't push this to GitHub, just use it as a reference)
- `cors-fix.js`
- `sections-api.js`
- Updated `server.js` and `vercel.json`

## 3. Setting Up Environment Variables in Vercel

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on "Settings" tab
4. Scroll down to "Environment Variables" section
5. Add each variable from your `vercel.env` file:

### Required Variables

```
# Vercel-specific configuration
VERCEL=1
NODE_ENV=production

# JWT Authentication
JWT_SECRET=aX7Fb5kP9qRs3vT8zL2wD6eG0hJ4mY1nC

# Firebase Database
FIREBASE_DATABASE_URL=https://projectportfolio-29467-default-rtdb.firebaseio.com
FIREBASE_HOSTING_URL=https://projectportfolio-29467.web.app

# Firebase Admin SDK
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=projectportfolio-29467
FIREBASE_PRIVATE_KEY_ID=d34583dfb687f8756ef612497b4674323e441dc6
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQClNIVWlTXfHGfp\nAQPtYb8Wf6F2oxU+7kqAdHN3GdqaZO4zAQZhhCY/cQ+01O4+TFGHf2CyFwewbo2q\nLaIWIyI8yqGuU22jBx8z5eO1Oj9IIV45RCpIqG4OBLcpex2HLf9gUJGwF5t0E/Je\nuBBdZwEV/98/Y372mipAprnEd7UwFJPrRnAuiEy6tt6XPkzy9p2rSDg111oGXCva\nonHKSL/Qg4W4/M2DNA0g04+IQax+4Y/4OyDr3X6L5l2XQYO5PeaueTOJF9veMbLc\nQxQlYf1OYSrn6IFf7hK+1WJ5wb+TssRxWcb976Wrr5wd0wrrTZYikK8xp1KHYtYs\n9F3a9KtjAgMBAAECggEAAptd9f9oIDenF/OwjLw9FvoJkk3s0ebCzMNRV8QHJ/C1\nYyRVPQtBracWCjPnaRWxxy2rd8AeuUMLvTxJqw0KFBG9ifXNn7w8y33llwMSm8QO\nOw8G8oGbqGs2T2zcFRB7Oz0hRnGFuPDgRxpbf251ZLpwCO7V4S0yPfiHY4N6oNzv\nkWNQo66NYCjYc/lkkgAFjGkcOihUy5qHGPT905Rn6rdRrbDvJXrIJ12ZjZH7ramR\n9oFbNxW2M0i/Yd91FlHrfsLOwCeuh3fXuUIo4adLDQAsHSlu/Yld6DgTzjWc3JQu\nZ0a08tfXwC9F8a/vjVjS2NAiyNHuKwwU9cUypsxkoQKBgQDn0EySBODguR9fdtck\nxtLNpvdGR9yq9HHG1oTVeN2FHUbJbs7DiZAwpyKqpUk/OX8VDTLOQGJJ0fD2niIG\nJ76jGKyYpsg2TWgnXInZghP+sLw5rDBQHrnXUAS96mwhdXzh9Ej8TTnX+1alkB+H\nae+GkF8KOpRD5p1Tq3j+4zQhOwKBgQC2cR7fssF6n4ych6gyC9UbOP0oLKhh2jes\nLcev8MeUMRRlqCJswGz6OSw4hjTvMMv8q/z8PLVoPwqLu7johddL+ML7i1iMIWZF\nnfPpbisQqcxF/6sfvvJ2umOZPZI1bcfAe0ki8nXAIu9CeuXYLzp8PmE7nIi4/kf+\nS2Yn70t7+QKBgFVAj8hrruA2dMlBBWJrFH+5Vdss9oSQnX9IyVVQu/cGi0/tRnE3\nGCYscV1cqBFubcQqNHMRzpPjd8Da6xxkZYHJwz/opl0CHrnLGI87fWr/SFnVb3cn\ntaTvsq69lcLAWIsosebH5+v8bSM6W74LQaG1Wp6CaKCIIXfx6e+jUzqdAoGAMPj8\niJ+7P+dEH2BqzcRPWBdcHUSfjmS9PQKs75V6fVUPXJpdY0Pj/OcL78BWxT4cA59H\nMY46Q9loQ0oIwKHswP/tlwg4pKTyhw13Q9nGxZpOsxuGG+dtvmEaCzBz5tOpIwn0\n/+SFpyW5g+bpe7ZxxJgaEZ5bNQ1M1f33VhDt+kECgYA0QrKakxU3r2R93hV+ZcaU\nc8eJetxaENe9ix/4vzzL/ocIac2taBuZ8Zh+Sds+ih7gLcYnllN42OhrhAM6+FFb\nAhElkl1+ES9pIX8lsZcx0+Lop7yUhosSfUPYsv+25VW6AnHdht7K9q/4D0eiDC1R\ngLqAIimsYt+6kEMLretAuw==\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@projectportfolio-29467.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=115589496742678661487
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40projectportfolio-29467.iam.gserviceaccount.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dlvtcwqu7
CLOUDINARY_API_KEY=878564287771594
CLOUDINARY_API_SECRET=kUkyXlZ3wQ8qtr-ZNr2eWcqt4cc
CLOUDINARY_URL=cloudinary://878564287771594:kUkyXlZ3wQ8qtr-ZNr2eWcqt4cc@dlvtcwqu7

# CORS settings
CORS_ORIGIN=*
ALLOW_ORIGINS=https://arpan-guria-production-level-portfolio.vercel.app
```

> **Important:** When adding the `FIREBASE_PRIVATE_KEY`, make sure to copy it exactly as shown, including the quotes and all newline characters (`\n`). Vercel will automatically handle these correctly.

## 4. Deploy Your Project

1. After adding all environment variables, go to the "Deployments" tab
2. Click "Redeploy" on your latest deployment, or push new changes to GitHub
3. Wait for the deployment to complete
4. Visit your site at the Vercel-provided URL (e.g., https://arpan-guria-production-level-portfolio.vercel.app)

## 5. Troubleshooting

If you're still experiencing issues:

1. Check the Vercel deployment logs for errors:
   - Go to your project in the Vercel dashboard
   - Click on "Deployments"
   - Select the latest deployment
   - Click on "Functions" or "View Function Logs"
   - Look for any error messages

2. Common issues:
   - **Firebase authentication errors**: Check that your `FIREBASE_PRIVATE_KEY` is properly formatted with newlines
   - **CORS errors**: Make sure the CORS headers are properly set in both your code and vercel.json
   - **Cloudinary connection issues**: Verify all Cloudinary credentials are correct

3. If sections API is still not working:
   - Make sure `sections-api.js` is properly imported in server.js
   - Check that the Firebase database has a 'sections' node (you can create it manually if needed)

## 6. Create Initial Sections Data

If your sections editor is still showing "Error loading sections", you may need to initialize the sections data in Firebase:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Realtime Database
4. Create a new node called `sections` with initial data:

```json
{
  "about": {
    "title": "About Arpan",
    "description": "Professional portfolio showcasing my work and skills", 
    "image": "/images/profile.jpg"
  },
  "skills": [],
  "timeline": [],
  "testimonials": []
}
```

This should resolve the missing sections data issue. 