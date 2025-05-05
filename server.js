require('dotenv').config({ path: './backend.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const { authMiddleware, requireAdmin } = require('./auth-middleware');
const fs = require('fs');
const https = require('https');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const dataService = require('./data-service');
const imageService = require('./image-service');
const { auth, rtdb } = require('./firebase-admin');
const config = require('./deploy-config');

const app = express();
const PORT = config.mainServer.port;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware
app.use(cors(config.corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add cache control for static assets in production
if (config.mainServer.environment === 'production' && config.cache.enabled) {
  app.use((req, res, next) => {
    if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', `public, max-age=${config.cache.maxAge}`);
    }
    next();
  });
}

/**
 * Helper function to sync time with Google's servers
 * This is critical for JWT token validation
 */
const syncTimeWithGoogle = async () => {
  return new Promise((resolve, reject) => {
    // Use HTTPS.get instead of fetch for more reliable time sync
    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: '/oauth2/v1/tokeninfo?access_token=invalid',
      method: 'GET',
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      // Extract date from headers
      const serverDateStr = res.headers.date;
      if (!serverDateStr) {
        reject(new Error('No date header in response'));
        return;
      }
      
      try {
        const serverDate = new Date(serverDateStr);
        const localDate = new Date();
        
        // Calculate time difference in milliseconds
        const timeDiff = serverDate.getTime() - localDate.getTime();
        
        if (Math.abs(timeDiff) > 30000) {
          console.warn(`⚠️ WARNING: System time differs from Google servers by ${timeDiff}ms (${Math.round(timeDiff/1000)} seconds)`);
          console.warn('This may cause JWT authentication issues. Consider syncing your system clock.');
        }
        
        // Save the time difference for runtime adjustment
        global.serverTimeDiff = timeDiff;
        
        resolve(timeDiff);
      } catch (error) {
        reject(error);
      }
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    req.end();
  });
};

/**
 * Adjusts the current time by the server time difference
 * Use this when creating JWT tokens to avoid validation issues
 */
const getAdjustedTime = () => {
  const now = new Date();
  if (global.serverTimeDiff) {
    now.setTime(now.getTime() + global.serverTimeDiff);
  }
  return now;
};

// Public API Routes

// Get all projects (public)
app.get('/api/projects', async (req, res) => {
  try {
    const projects = dataService.projects.getAll();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get a single project (public)
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = dataService.projects.getById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get all case studies (public)
app.get('/api/case-studies', async (req, res) => {
  try {
    console.log('📊 GET /api/case-studies - Fetching case studies from Firebase');
    const snapshot = await rtdb.ref('caseStudies').once('value');
    const val = snapshot.val() || {};
    console.log(`📊 Found ${Object.keys(val).length} case studies`);
    
    // Debug log the first case study if any exist
    if (Object.keys(val).length > 0) {
      const firstKey = Object.keys(val)[0];
      console.log(`📊 Sample case study ID: ${firstKey}`);
      console.log(`📊 Sample case study has fields: ${Object.keys(val[firstKey]).join(', ')}`);
    }
    
    // Map and transform case studies for consistent structure
    const caseStudies = Object.entries(val).map(([id, cs]) => {
      // Create standardized case study object with required fields
      const standardizedCS = { 
        id,
        projectTitle: cs.projectTitle || cs.title || (cs.sections?.hero?.headline) || 'Untitled Project',
        projectDescription: cs.projectDescription || cs.summary || 
                          (cs.sections?.overview?.content?.replace(/<[^>]*>/g, '').substring(0, 100)) || '',
        projectImageUrl: cs.projectImageUrl || cs.coverImageUrl || cs.imageUrl || '',
        projectCategory: cs.projectCategory || cs.category || 'Case Study',
        projectRating: cs.projectRating || cs.rating || 5,
        projectAchievement: cs.projectAchievement || '',
        ...cs  // Keep all original fields
      };
      
      return standardizedCS;
    });
    
    res.json(caseStudies);
  } catch (error) {
    console.error('Error fetching case studies from Firebase:', error);
    res.status(500).json({ error: 'Failed to fetch case studies' });
  }
});

// Get a single case study (public)
app.get('/api/case-studies/:id', async (req, res) => {
  try {
    console.log(`📊 GET /api/case-studies/${req.params.id} - Fetching case study`);
    const snapshot = await rtdb.ref(`caseStudies/${req.params.id}`).once('value');
    if (!snapshot.exists()) return res.status(404).json({ error: 'Case study not found' });
    
    const cs = snapshot.val();
    // Standardize case study object with required fields for consistent API
    const standardizedCS = { 
      id: snapshot.key,
      projectTitle: cs.projectTitle || cs.title || (cs.sections?.hero?.headline) || 'Untitled Project',
      projectDescription: cs.projectDescription || cs.summary || 
                        (cs.sections?.overview?.content?.replace(/<[^>]*>/g, '').substring(0, 100)) || '',
      projectImageUrl: cs.projectImageUrl || cs.coverImageUrl || cs.imageUrl || '',
      projectCategory: cs.projectCategory || cs.category || 'Case Study',
      projectRating: cs.projectRating || cs.rating || 5,
      projectAchievement: cs.projectAchievement || '',
      ...cs  // Keep all original fields
    };
    
    res.json(standardizedCS);
  } catch (error) {
    console.error('Error fetching case study from Firebase:', error);
    res.status(500).json({ error: 'Failed to fetch case study' });
  }
});

// Get sections data (public)
app.get('/api/sections', async (req, res) => {
  try {
    const sections = dataService.sections.getAll();
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Get carousel images (public)
app.get('/api/carousel-images', async (req, res) => {
  try {
    console.log('📊 GET /api/carousel-images - Fetching carousel images');
    
    // First try to fetch from Firebase if available
    let carouselImages = [];
    try {
      const snapshot = await rtdb.ref('carouselImages').once('value');
      const val = snapshot.val() || {};
      
      if (Object.keys(val).length > 0) {
        console.log(`📊 Found ${Object.keys(val).length} carousel images in Firebase`);
        carouselImages = Object.entries(val).map(([id, image]) => ({
          id,
          ...image
        }));
      }
    } catch (fbError) {
      console.log('Firebase carousel fetch failed, falling back to local data:', fbError);
    }
    
    // If no images in Firebase, fall back to local data
    if (carouselImages.length === 0) {
      console.log('📊 No carousel images in Firebase, falling back to local data');
      carouselImages = dataService.carouselImages.getAll();
    }
    
    // Sort by order
    carouselImages.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    res.json(carouselImages);
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    res.status(500).json({ error: 'Failed to fetch carousel images' });
  }
});

// Get a single carousel image by ID (public)
app.get('/api/carousel-images/:id', async (req, res) => {
  try {
    console.log(`📊 GET /api/carousel-images/${req.params.id} - Fetching carousel image`);
    
    // Try to get from Firebase first
    let image = null;
    try {
      const snapshot = await rtdb.ref(`carouselImages/${req.params.id}`).once('value');
      if (snapshot.exists()) {
        image = {
          id: req.params.id,
          ...snapshot.val()
        };
        console.log(`📊 Found carousel image in Firebase: ${req.params.id}`);
      }
    } catch (fbError) {
      console.error('Error getting carousel image from Firebase:', fbError);
    }
    
    // Fall back to local if not in Firebase
    if (!image) {
      image = dataService.carouselImages.getById(req.params.id);
      if (image) {
        console.log(`📊 Found carousel image in local database: ${req.params.id}`);
      }
    }
    
    if (!image) {
      return res.status(404).json({ error: 'Carousel image not found' });
    }
    
    res.json(image);
  } catch (error) {
    console.error('Error fetching carousel image:', error);
    res.status(500).json({ error: 'Failed to fetch carousel image' });
  }
});

// Protected API Routes (require authentication)

// Create a new project (protected)
app.post('/api/projects', authMiddleware, async (req, res) => {
  try {
    const newProject = dataService.projects.create(req.body, req.user.uid);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project (protected)
app.put('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const updatedProject = dataService.projects.update(req.params.id, req.body, req.user.uid);
    
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project (protected - admin only)
app.delete('/api/projects/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    dataService.projects.delete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Create a new case study (public - intentionally unprotected for admin panel testing)
app.post('/api/case-studies', async (req, res) => {
  console.log('📝 POST /api/case-studies received, body =', req.body);
  try {
    const ref = await rtdb.ref('caseStudies').push({
      ...req.body,
      createdAt: Date.now()
    });
    res.status(201).json({ id: ref.key, ...req.body });
  } catch (error) {
    console.error('Error creating case study in Firebase:', error);
    res.status(500).json({ error: 'Failed to create case study' });
  }
});

// Update a case study (public - intentionally unprotected for admin panel testing)
app.put('/api/case-studies/:id', async (req, res) => {
  try {
    await rtdb.ref(`caseStudies/${req.params.id}`).update({
      ...req.body,
      updatedAt: Date.now()
    });
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    console.error('Error updating case study in Firebase:', error);
    res.status(500).json({ error: 'Failed to update case study' });
  }
});

// Delete a case study (public - intentionally unprotected for admin panel testing)
app.delete('/api/case-studies/:id', async (req, res) => {
  try {
    await rtdb.ref(`caseStudies/${req.params.id}`).remove();
    res.json({ message: 'Case study deleted successfully' });
  } catch (error) {
    console.error('Error deleting case study from Firebase:', error);
    res.status(500).json({ error: 'Failed to delete case study' });
  }
});

// Update sections (protected - admin only)
app.put('/api/sections', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updatedSections = dataService.sections.update(req.body, req.user.uid);
    res.json(updatedSections);
  } catch (error) {
    console.error('Error updating sections:', error);
    res.status(500).json({ error: 'Failed to update sections' });
  }
});

// Carousel images CRUD operations (public - intentionally unprotected for admin panel testing)
app.post('/api/carousel-images', upload.single('image'), async (req, res) => {
  try {
    console.log('📊 POST /api/carousel-images - Adding new carousel image');
    
    // Enhanced logging for debugging
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.path : 'No file');
    
    // Check if we have direct Cloudinary info
    let imageInfo;
    if (req.body.url && req.body.publicId) {
      console.log('📊 Using directly provided Cloudinary image info');
      // Handle direct Cloudinary upload info (from widget)
      imageInfo = {
        url: req.body.url,
        publicId: req.body.publicId,
        width: parseInt(req.body.width) || 800,
        height: parseInt(req.body.height) || 400,
        service: 'cloudinary'
      };
    } else if (req.file) {
      // Upload the image to Cloudinary
      console.log('📊 Uploading image file to Cloudinary');
      
      // Use enhanced upload options for Cloudinary
      const uploadOptions = {
        folder: req.body.folder || 'portfolio/carousel',
        resource_type: 'auto', // Auto-detect file type
        overwrite: true,
        transformation: [
          { width: 1920, crop: "limit" }, // Limit width while maintaining aspect ratio
          { quality: "auto:best" } // Optimal quality
        ],
        context: req.body.metadata || {}
      };
      
      imageInfo = await imageService.uploadImage(
      req.file.path,
      'carousel',
        uploadOptions.folder,
        uploadOptions
    );
    
      // Clean up the temporary file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Enhanced image data with additional fields for better display
    const imageData = {
      url: imageInfo.url,
      publicId: imageInfo.publicId,
      service: imageInfo.service || 'cloudinary',
      caption: req.body.caption || '',
      title: req.body.caption || 'Magical Journey',
      description: req.body.description || '',
      altText: req.body.altText || req.body.caption || 'Carousel image', // For accessibility
      order: parseInt(req.body.order) || 999,
      width: imageInfo.width,
      height: imageInfo.height,
      thumbnail: imageService.getResizedImageUrl(imageInfo.url, 300, 200, { crop: 'fill' }),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Save to Firebase
    let firebaseId;
    try {
      const imageRef = await rtdb.ref('carouselImages').push(imageData);
      firebaseId = imageRef.key;
      console.log(`📊 Saved carousel image to Firebase with ID: ${firebaseId}`);
    } catch (fbError) {
      console.error('Error saving to Firebase:', fbError);
      // Continue anyway, will use local ID as fallback
    }
    
    // Also save to local database as backup
    const savedImage = dataService.carouselImages.create(imageData, req.user?.uid || 'anonymous');
    
    // Return the Firebase ID if available, otherwise local ID
    res.status(201).json({ 
      id: firebaseId || savedImage.id, 
      ...imageData 
    });
  } catch (error) {
    console.error('Error adding carousel image:', error);
    
    // Clean up the temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to add carousel image', details: error.message });
  }
});

// Update carousel image metadata (public - intentionally unprotected for admin panel testing)
app.put('/api/carousel-images/:id', async (req, res) => {
  try {
    console.log(`📊 PUT /api/carousel-images/${req.params.id} - Updating carousel image`);
    
    // Try to update in Firebase first
    let updatedImage = null;
    try {
      const ref = rtdb.ref(`carouselImages/${req.params.id}`);
      const snapshot = await ref.once('value');
      
      if (snapshot.exists()) {
        // Get current data and merge with updates
        const currentData = snapshot.val();
        const updates = {
          ...currentData,
          ...req.body,
          updatedAt: Date.now()
        };
        
        // Update in Firebase
        await ref.update(updates);
        updatedImage = { id: req.params.id, ...updates };
        console.log(`📊 Updated carousel image in Firebase: ${req.params.id}`);
      }
    } catch (fbError) {
      console.error('Error updating carousel image in Firebase:', fbError);
    }
    
    // Also update in local database if Firebase failed or image wasn't there
    if (!updatedImage) {
      // For public access, we'll pass a default userId for database tracking
      const userId = req.user?.uid || 'anonymous-user';
      updatedImage = dataService.carouselImages.update(req.params.id, req.body, userId);
    
      if (!updatedImage) {
        return res.status(404).json({ error: 'Carousel image not found' });
      }
    }
    
    res.json(updatedImage);
  } catch (error) {
    console.error('Error updating carousel image:', error);
    res.status(500).json({ error: 'Failed to update carousel image' });
  }
});

// Delete carousel image (public - intentionally unprotected for admin panel testing)
app.delete('/api/carousel-images/:id', async (req, res) => {
  try {
    console.log(`📊 DELETE /api/carousel-images/${req.params.id} - Deleting carousel image`);
    
    // Try to get the image from both sources
    let image = null;
    
    // Try Firebase first
    try {
      const snapshot = await rtdb.ref(`carouselImages/${req.params.id}`).once('value');
      if (snapshot.exists()) {
        image = { id: req.params.id, ...snapshot.val() };
        console.log(`📊 Found carousel image in Firebase: ${req.params.id}`);
      }
    } catch (fbError) {
      console.error('Error getting carousel image from Firebase:', fbError);
    }
    
    // Fall back to local if not in Firebase
    if (!image) {
      image = dataService.carouselImages.getById(req.params.id);
    }
    
    if (!image) {
      return res.status(404).json({ error: 'Carousel image not found' });
    }
    
    // Delete from cloud storage
    if (image.publicId) {
      await imageService.deleteImage(image.publicId, image.service || 'cloudinary');
      console.log(`📊 Deleted image from ${image.service || 'cloudinary'}`);
    }
    
    // Delete from Firebase
    try {
      await rtdb.ref(`carouselImages/${req.params.id}`).remove();
      console.log(`📊 Deleted carousel image from Firebase: ${req.params.id}`);
    } catch (fbError) {
      console.error('Error deleting carousel image from Firebase:', fbError);
    }
    
    // Delete from our database
    dataService.carouselImages.delete(req.params.id);
    
    res.json({ message: 'Carousel image deleted successfully' });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    res.status(500).json({ error: 'Failed to delete carousel image' });
  }
});

// Get image upload signature (for direct browser uploads)
app.get('/api/upload-signature', async (req, res) => {
  try {
    console.log('📊 GET /api/upload-signature - Generating upload signature');
    const { folder = 'portfolio', service = 'cloudinary' } = req.query;
    
    // Ensure the folder is allowed (security measure)
    const allowedFolders = ['portfolio', 'portfolio/carousel', 'portfolio/projects', 'portfolio/caseStudies'];
    const safeFolder = allowedFolders.includes(folder) ? folder : 'portfolio';
    
    const signature = imageService.getUploadSignature(safeFolder, service);
    console.log(`📊 Generated upload signature for ${service}, folder: ${safeFolder}`);
    
    res.json(signature);
  } catch (error) {
    console.error('Error generating upload signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

// Carousel settings endpoints (public - intentionally unprotected for admin panel testing)
app.get('/api/carousel-settings', async (req, res) => {
  try {
    console.log('📊 GET /api/carousel-settings - Fetching carousel settings');
    
    // Try to get from Firebase first
    let settings = null;
    try {
      const snapshot = await rtdb.ref('carouselSettings').once('value');
      if (snapshot.exists()) {
        settings = snapshot.val();
        console.log('📊 Found carousel settings in Firebase');
      }
    } catch (fbError) {
      console.error('Error fetching carousel settings from Firebase:', fbError);
    }
    
    // Return default settings if none found
    if (!settings) {
      settings = {
        title: 'Magical Journey',
        speed: 5000,
        autoplay: true,
        indicators: true
      };
      console.log('📊 Using default carousel settings');
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching carousel settings:', error);
    res.status(500).json({ error: 'Failed to fetch carousel settings' });
  }
});

app.put('/api/carousel-settings', async (req, res) => {
  try {
    console.log('📊 PUT /api/carousel-settings - Updating carousel settings');
    console.log('Request body:', req.body);
    
    // Validate required fields
    const settings = {
      title: req.body.title || 'Magical Journey',
      speed: parseInt(req.body.speed) || 5000,
      autoplay: req.body.autoplay !== false,
      indicators: req.body.indicators !== false,
      updatedAt: Date.now()
    };
    
    // Save to Firebase
    try {
      await rtdb.ref('carouselSettings').set(settings);
      console.log('📊 Saved carousel settings to Firebase');
    } catch (fbError) {
      console.error('Error saving carousel settings to Firebase:', fbError);
      // Continue to return success even if Firebase fails
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating carousel settings:', error);
    res.status(500).json({ error: 'Failed to update carousel settings' });
  }
});

// Upload image (unprotected - intentionally public for admin panel testing)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  console.log('📤 POST /api/upload, file =', req.file && req.file.path, ', body =', req.body);
  try {
    const { folder, imageType, metadata } = req.body;
    
    // Parse metadata if it's a string
    const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    
    // Force Cloudinary for case study images
    const effectiveImageType = imageType || 'project';
    const targetService = effectiveImageType.includes('case') ? 'cloudinary' : null;
    
    // Upload the image
    const result = await imageService.uploadImage(
      req.file.path,
      effectiveImageType,
      folder || 'portfolio/images',
      parsedMetadata || {},
      targetService
    );
    
    // Clean up the temporary file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Clean up the temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Authentication endpoint - use Firebase Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // First check if user exists in our database
    const user = dataService.users.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Authenticate with Firebase
    const firebase = require('firebase/app');
    require('firebase/auth');
    
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyBr8ZruVUy_bHlnQRR-J_D5swyKQobkCWg",
        authDomain: "projectportfolio-29467.firebaseapp.com",
        projectId: "projectportfolio-29467"
      });
    }
    
    try {
      // Sign in with Firebase
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      // Get the ID token
      const token = await userCredential.user.getIdToken();
      
      // Return the token and user info
      res.json({ 
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin || dataService.users.getAdmins().includes(user.email)
        }
      });
    } catch (firebaseError) {
      console.error('Firebase authentication error:', firebaseError);
      
      // Fall back to local authentication if Firebase fails
      const bcrypt = require('bcrypt');
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate a custom token using Firebase Admin SDK
      const customToken = await auth.createCustomToken(user.id, {
        email: user.email,
        admin: user.isAdmin || dataService.users.getAdmins().includes(user.email)
      });
      
      res.json({ 
        token: customToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin || dataService.users.getAdmins().includes(user.email)
        }
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Server status endpoint - simplified for faster response
app.get('/api/status', (req, res) => {
  res.json({ status: 'online' });
});

// --- New Content Endpoints ---

// Skills CRUD
app.get('/api/skills', async (req, res) => {
  try {
    const list = dataService.skills.getAll();
    res.json(list);
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});
app.get('/api/skills/:id', async (req, res) => {
  try {
    const item = dataService.skills.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Skill not found' });
    res.json(item);
  } catch (err) {
    console.error('Error fetching skill:', err);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});
app.post('/api/skills', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const created = dataService.skills.create(req.body, req.user.uid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating skill:', err);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});
app.put('/api/skills/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = dataService.skills.update(req.params.id, req.body, req.user.uid);
    if (!updated) return res.status(404).json({ error: 'Skill not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating skill:', err);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});
app.delete('/api/skills/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    dataService.skills.delete(req.params.id);
    res.json({ message: 'Skill deleted successfully' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// Testimonials CRUD
app.get('/api/testimonials', async (req, res) => {
  try {
    const list = dataService.testimonials.getAll();
    res.json(list);
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});
app.get('/api/testimonials/:id', async (req, res) => {
  try {
    const item = dataService.testimonials.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Testimonial not found' });
    res.json(item);
  } catch (err) {
    console.error('Error fetching testimonial:', err);
    res.status(500).json({ error: 'Failed to fetch testimonial' });
  }
});
app.post('/api/testimonials', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const created = dataService.testimonials.create(req.body, req.user.uid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating testimonial:', err);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});
app.put('/api/testimonials/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = dataService.testimonials.update(req.params.id, req.body, req.user.uid);
    if (!updated) return res.status(404).json({ error: 'Testimonial not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating testimonial:', err);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});
app.delete('/api/testimonials/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    dataService.testimonials.delete(req.params.id);
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (err) {
    console.error('Error deleting testimonial:', err);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

// Contact (single resource)
app.get('/api/contact', async (req, res) => {
  try {
    const info = dataService.contact.get();
    res.json(info);
  } catch (err) {
    console.error('Error fetching contact:', err);
    res.status(500).json({ error: 'Failed to fetch contact info' });
  }
});
app.put('/api/contact', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = dataService.contact.update(req.body, req.user.uid);
    res.json(updated);
  } catch (err) {
    console.error('Error updating contact:', err);
    res.status(500).json({ error: 'Failed to update contact info' });
  }
});

// About (single resource)
app.get('/api/about', async (req, res) => {
  try {
    const info = dataService.about.get();
    res.json(info);
  } catch (err) {
    console.error('Error fetching about:', err);
    res.status(500).json({ error: 'Failed to fetch about info' });
  }
});
app.put('/api/about', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = dataService.about.update(req.body, req.user.uid);
    res.json(updated);
  } catch (err) {
    console.error('Error updating about:', err);
    res.status(500).json({ error: 'Failed to update about info' });
  }
});

// Timeline CRUD
app.get('/api/timeline', async (req, res) => {
  try {
    const list = dataService.timeline.getAll();
    res.json(list);
  } catch (err) {
    console.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});
app.get('/api/timeline/:id', async (req, res) => {
  try {
    const item = dataService.timeline.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Timeline item not found' });
    res.json(item);
  } catch (err) {
    console.error('Error fetching timeline item:', err);
    res.status(500).json({ error: 'Failed to fetch timeline item' });
  }
});
app.post('/api/timeline', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const created = dataService.timeline.create(req.body, req.user.uid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating timeline item:', err);
    res.status(500).json({ error: 'Failed to create timeline item' });
  }
});
app.put('/api/timeline/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = dataService.timeline.update(req.params.id, req.body, req.user.uid);
    if (!updated) return res.status(404).json({ error: 'Timeline item not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating timeline item:', err);
    res.status(500).json({ error: 'Failed to update timeline item' });
  }
});
app.delete('/api/timeline/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    dataService.timeline.delete(req.params.id);
    res.json({ message: 'Timeline item deleted successfully' });
  } catch (err) {
    console.error('Error deleting timeline item:', err);
    res.status(500).json({ error: 'Failed to delete timeline item' });
  }
});

// Site settings (single resource)
app.get('/api/settings', async (req, res) => {
  try {
    const info = dataService.settings.get();
    res.json(info);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});
app.put('/api/settings', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = dataService.settings.update(req.body, req.user.uid);
    res.json(updated);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Catch-all for the single page application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  // Enhanced logging for server startup
  console.log(`🚀 Main server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.mainServer.environment}`);
  console.log(`📊 Logging level: ${config.logging.level}`);
  
  // Sync time with Google as JWT requires accurate time
  syncTimeWithGoogle()
    .then(timeDiff => {
      if (Math.abs(timeDiff) > 5000) {
        console.warn(`⚠️ System time differs from Google servers by ${Math.round(timeDiff/1000)} seconds`);
      } else {
        console.log(`✅ System time synced within ${Math.round(timeDiff/1000)} seconds of Google time`);
      }
    })
    .catch(error => {
      console.error('⚠️ Failed to sync time with Google:', error.message);
    });
}); 