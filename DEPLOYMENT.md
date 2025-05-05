# Portfolio Application Deployment Guide

This document provides instructions for deploying the Portfolio Application in a production environment.

## Prerequisites

- Node.js (v14 or higher)
- Firebase project and credentials
- Cloudinary account (for image storage)
- A server/hosting platform (e.g., DigitalOcean, AWS, Heroku, Netlify, etc.)

## Configuration

Before deployment, ensure you have properly configured the following files:

1. **backend.env**: Contains environment variables for backends
2. **deploy-config.js**: Contains deployment configuration for all servers
3. **Firebase credentials**: Make sure your Firebase credential files are valid

## Deployment Steps

### Local Deployment

To deploy and run all services locally:

```bash
# Kill any processes that might be using our ports
npm run killport:5000
npm run killport:5002

# Start all servers with the deploy script
npm run deploy
```

For individual server deployment:

```bash
# Main server only
npm run deploy:main

# Carousel server only
npm run deploy:carousel
```

### Cloud/Server Deployment

1. **Prepare your environment**:
   - Clone the repository on your server
   - Install dependencies: `npm install --production`
   - Set up environment variables on your hosting platform

2. **Update CORS settings**:
   - Edit `deploy-config.js` to add your production domain to the CORS origin list

3. **Build frontend assets**:
   ```bash
   npm run build:css
   ```

4. **Start the application**:
   - For PM2 (recommended for Node.js apps):
     ```bash
     pm2 start deploy.js --name "portfolio"
     ```
   - For Docker deployment, use the included Dockerfile:
     ```bash
     docker build -t portfolio-app .
     docker run -p 5000:5000 -p 5002:5002 portfolio-app
     ```

## Firebase Setup

Ensure your Firebase services are properly configured:

1. **Authentication**: Enable email/password authentication
2. **Realtime Database**: Set up rules for secure access
3. **Storage**: Configure CORS using the `fix-storage-cors.js` script
4. **Update Firebase rules**: Deploy the storage.rules file

```bash
firebase deploy --only storage
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: 
   - Use the `npm run killport:5000` and `npm run killport:5002` commands
   - Or manually find and kill processes:
     ```bash
     # Windows
     netstat -ano | findstr :5000
     taskkill /PID <PID> /F
     
     # Linux/Mac
     lsof -i :5000
     kill -9 <PID>
     ```

2. **Firebase authentication errors**:
   - Check Firebase credential files
   - Ensure your project is properly configured in Firebase console
   - Verify CORS is properly set up for your domain

3. **Image upload issues**:
   - Verify Cloudinary credentials in backend.env
   - Check folder permissions for the uploads directory

## Monitoring

After deployment, monitor the application logs to identify any issues:

```bash
# For PM2:
pm2 logs portfolio

# For Docker:
docker logs <container-id>
```

## Performance Optimization

The application includes performance optimizations:

- Static asset caching (CSS, JS, images)
- Image optimization through Cloudinary
- Optimized carousel image loading with PowerPoint-like adaptive display

## Security Considerations

- Keep your environment variables secure
- Regularly update dependencies
- Use HTTPS for all production traffic
- Review Firebase security rules regularly

## Need Help?

If you encounter issues during deployment, please refer to the troubleshooting section or contact the development team. 