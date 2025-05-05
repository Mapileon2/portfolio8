# Firebase Hosting Deployment Guide

This guide explains how to deploy your Portfolio Application to Firebase Hosting with a focus on ensuring the Magical Journeys carousel works correctly.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project configured (already set up as "projectportfolio-29467")
- Firebase configuration files (.firebaserc and firebase.json)

## Deployment Process

### 1. Local Setup and Testing

Before deploying, make sure your local environment is working correctly:

```bash
# Start the main server
node server.js

# Start the carousel server (in another terminal)
node carousel-server.js
```

Verify that the Magical Journeys carousel works locally with no flickering.

### 2. Carousel Server Configuration

Since Firebase Hosting doesn't support Node.js servers directly, the portfolio is configured to use:

- **Local Development**: Uses a separate Carousel server on port 5002
- **Production**: Falls back to localStorage for images when Firebase auth fails

The `carousel-fix-client.js` file automatically handles this transition between environments.

### 3. Deploy to Firebase Hosting

To deploy only the frontend files to Firebase Hosting:

```bash
firebase deploy --only hosting
```

This will deploy the contents of the `public` directory as configured in `firebase.json`.

### 4. Verify the Deployment

1. Open your Firebase Hosting URL: https://projectportfolio-29467.web.app
2. Check that the Magical Journeys carousel works without flickering
3. Verify that images load correctly (may use fallback images initially)
4. Test other portfolio sections to ensure everything displays properly

### 5. Custom Domain Setup (Optional)

To use a custom domain instead of the default Firebase domain:

```bash
# Connect a custom domain
firebase hosting:sites:create YOUR-SITE-NAME
firebase target:apply hosting YOUR-TARGET-NAME YOUR-SITE-NAME
firebase deploy --only hosting:YOUR-TARGET-NAME
```

Then follow the Firebase Console instructions to verify domain ownership.

### 6. Troubleshooting

If you encounter issues with the carousel after deployment:

1. **Images not loading**: Check the browser console for errors. Images may be using fallbacks due to CORS issues.
2. **Flickering issues**: Ensure all CSS and JS files are properly loaded. Check browser network tab for 404 errors.
3. **Layout shifts**: The `carousel-fix-client.js` file should handle this automatically.

### 7. Keeping Images Updated

To add new carousel images to your deployed site:

1. Upload them through the admin panel (requires Firebase authentication)
2. Or add them directly to Firebase Storage through the Firebase Console
3. Update the localStorage cache by visiting the admin panel and syncing images

## Firebase Storage Rules

If you need to modify storage access rules, edit the `storage.rules` file and deploy with:

```bash
firebase deploy --only storage
```

## References

- Firebase Hosting Documentation: https://firebase.google.com/docs/hosting
- Firebase CLI Documentation: https://firebase.google.com/docs/cli
- Your Project Console: https://console.firebase.google.com/project/projectportfolio-29467/overview 