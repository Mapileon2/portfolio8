# Setting Up a Production API Server

This guide explains how to set up a production server to handle your API requests for the portfolio application.

## Problem Overview

The Firebase Hosting environment only serves static files and doesn't run your Node.js API servers. This causes 404 errors for API endpoints when deployed to Firebase Hosting.

## Solution Options

### 1. Firebase Cloud Functions (Recommended)

Firebase Cloud Functions allow you to run server-side code in response to events or HTTP requests.

1. **Initialize Functions**:
   ```bash
   firebase init functions
   ```

2. **Convert your Express API to Firebase Functions**:
   Create a file at `functions/index.js`:
   ```javascript
   const functions = require('firebase-functions');
   const express = require('express');
   const cors = require('cors');
   const dataService = require('../data-service');
   
   // Create Express app
   const app = express();
   app.use(cors({ origin: true }));
   app.use(express.json());
   
   // API routes
   app.get('/api/status', (req, res) => {
     res.json({ status: 'online' });
   });
   
   app.get('/api/projects', async (req, res) => {
     try {
       const projects = await dataService.getProjects();
       res.json(projects);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   
   // Add all your other API endpoints here...
   
   // Export the Express app as a Firebase Function
   exports.api = functions.https.onRequest(app);
   ```

3. **Deploy your Functions**:
   ```bash
   firebase deploy --only functions
   ```

### 2. Self-Hosted API Server

You can host your API server on a different platform:

1. **Create a Production Environment Config**:
   Update `deploy-config.js` with production URLs.
   
2. **Prepare for Production**:
   ```bash
   npm run build
   ```
   
3. **Deploy to a Cloud Provider**:
   - **Heroku**:
     ```bash
     heroku create
     git push heroku main
     ```
   - **DigitalOcean**:
     Create a Droplet and set up Node.js.
   - **Railway, Render, or Vercel**:
     Follow their deployment guides.

4. **Update CORS Settings**:
   Make sure to allow your Firebase Hosting domain in CORS settings.

5. **Update Frontend URL References**:
   Update all your frontend API URLs to point to your production API server.

### 3. Client-Side Fallback (Current Implementation)

For simple or demo sites, we've implemented a client-side fallback mechanism that intercepts API requests and returns static data when Firebase Hosting is detected. This is already deployed in your application via the `firebase-data-fallback.js` script.

## Troubleshooting

- **CORS Issues**: If you see CORS errors, ensure your API server allows requests from your Firebase Hosting domain.
  
- **Authentication**: If your API requires authentication, ensure tokens are properly passed and validated in the production environment.
  
- **Environment Variables**: Make sure all environment variables are correctly set in your production environment.

## Monitoring

Once you have a production API server, set up monitoring to ensure it stays online:

1. **Set up Uptime Monitoring**:
   - Use Firebase Performance Monitoring
   - Or services like Uptime Robot, Pingdom, or StatusCake
   
2. **Error Tracking**:
   - Consider integrating Sentry or similar error tracking

## Conclusion

For a production-grade portfolio, we recommend implementing either Firebase Cloud Functions or a dedicated API server. The client-side fallback currently implemented is a good stopgap solution but has limitations as it uses static data. 