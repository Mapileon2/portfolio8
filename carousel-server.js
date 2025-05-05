require('dotenv').config({ path: './backend.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const dataService = require('./data-service');
const imageService = require('./image-service');
const { auth, rtdb } = require('./firebase-admin');
const config = require('./deploy-config');

const app = express();
const PORT = config.carouselServer.port;

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

// Server status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online',
    service: 'carousel-server',
    version: '1.0.0',
    port: PORT,
    environment: config.carouselServer.environment
  });
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

// Post carousel images
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
          // Create responsive image transformations
          { 
            width: 1920, 
            crop: "limit", 
            quality: "auto:best",
            fetch_format: "auto",
            dpr: "auto"
          }
        ],
        responsive_breakpoints: {
          create_derived: true,
          bytes_step: 20000,
          min_width: 200,
          max_width: 1000,
          max_images: 5
        },
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
      // Add responsive image variations
      responsive: {
        thumbnail: imageService.getResizedImageUrl(imageInfo.url, 300, 200, { crop: 'fill' }),
        small: imageService.getResizedImageUrl(imageInfo.url, 640, 480, { crop: 'fill' }),
        medium: imageService.getResizedImageUrl(imageInfo.url, 800, 600, { crop: 'fill' }),
        large: imageService.getResizedImageUrl(imageInfo.url, 1200, 900, { crop: 'fill' })
      },
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
    const savedImage = dataService.carouselImages.create(imageData, 'anonymous');
    
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

// Special endpoint for direct file uploads
app.post('/api/carousel-images/upload', upload.single('image'), async (req, res) => {
  try {
    console.log('📊 POST /api/carousel-images/upload - Direct file upload');
    
    // Enhanced logging for debugging
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.path : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
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
    
    const imageInfo = await imageService.uploadImage(
      req.file.path,
      'carousel',
      uploadOptions.folder,
      uploadOptions
    );
    
    // Clean up the temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Enhanced image data with fields needed for the form
    const imageData = {
      url: imageInfo.url,
      publicId: imageInfo.publicId,
      service: imageInfo.service || 'cloudinary',
      width: imageInfo.width,
      height: imageInfo.height,
      caption: req.body.caption || '',
      order: parseInt(req.body.order) || 999,
      // Don't save to Firebase here - we'll let the form submit do that
    };
    
    // Return just the image data for the form to use
    res.status(200).json(imageData);
  } catch (error) {
    console.error('Error uploading carousel image:', error);
    
    // Clean up the temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload carousel image', details: error.message });
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

// DELETE a carousel image
app.delete('/api/carousel-images/:id', async (req, res) => {
  try {
    const imageId = req.params.id;
    console.log(`📊 DELETE /api/carousel-images/${imageId} - Deleting carousel image`);
    
    // Get image data first to get Cloudinary public ID
    const snapshot = await rtdb.ref(`carouselImages/${imageId}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageData = snapshot.val();
    console.log(`📊 Found image to delete: ${imageData.caption || 'Unnamed image'}`);
    
    // Delete from Cloudinary if public ID is available
    if (imageData.publicId) {
      try {
        await imageService.deleteImage(imageData.publicId);
        console.log(`📊 Deleted image from Cloudinary: ${imageData.publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue anyway to delete the database entry
      }
    }
    
    // Delete from Firebase
    await rtdb.ref(`carouselImages/${imageId}`).remove();
    console.log(`📊 Deleted image from Firebase: ${imageId}`);
    
    // Also delete from local database as backup
    try {
      dataService.carouselImages.delete(imageId);
    } catch (localError) {
      console.log('Local delete failed, may not exist locally:', localError.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Image deleted successfully',
      id: imageId
    });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    res.status(500).json({ error: 'Failed to delete carousel image', details: error.message });
  }
});

// Get carousel settings
app.get('/api/carousel-settings', async (req, res) => {
  try {
    console.log('📊 GET /api/carousel-settings - Fetching carousel settings');
    
    // Try to fetch from Firebase if available
    try {
      const snapshot = await rtdb.ref('carouselSettings').once('value');
      if (snapshot.exists()) {
        console.log('📊 Found carousel settings in Firebase');
        return res.json(snapshot.val());
      }
    } catch (fbError) {
      console.log('Firebase settings fetch failed, falling back to defaults:', fbError);
    }
    
    // Return default settings if none found
    console.log('📊 No carousel settings in Firebase, using defaults');
    return res.json({
      title: 'Magical Journey',
      speed: 5000,
      autoplay: true,
      indicators: true,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('Error fetching carousel settings:', error);
    res.status(500).json({ error: 'Failed to fetch carousel settings' });
  }
});

// Update carousel settings
app.put('/api/carousel-settings', async (req, res) => {
  try {
    console.log('📊 PUT /api/carousel-settings - Updating carousel settings');
    console.log('Request body:', req.body);
    
    // Validate required fields
    const { title, speed, autoplay, indicators } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Create settings object
    const settingsData = {
      title,
      speed: parseInt(speed) || 5000,
      autoplay: autoplay !== false,
      indicators: indicators !== false,
      updatedAt: Date.now()
    };
    
    // Save to Firebase
    try {
      await rtdb.ref('carouselSettings').set(settingsData);
      console.log('📊 Saved carousel settings to Firebase');
    } catch (fbError) {
      console.error('Error saving settings to Firebase:', fbError);
      return res.status(500).json({ error: 'Failed to save carousel settings to Firebase' });
    }
    
    res.json({ 
      success: true, 
      message: 'Carousel settings updated successfully',
      settings: settingsData
    });
  } catch (error) {
    console.error('Error updating carousel settings:', error);
    res.status(500).json({ error: 'Failed to update carousel settings', details: error.message });
  }
});

// Get a single carousel image
app.get('/api/carousel-images/:id', async (req, res) => {
  try {
    const imageId = req.params.id;
    console.log(`📊 GET /api/carousel-images/${imageId} - Fetching carousel image`);
    
    // Get image from Firebase
    const snapshot = await rtdb.ref(`carouselImages/${imageId}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageData = snapshot.val();
    console.log(`📊 Found image: ${imageData.caption || 'Unnamed image'}`);
    
    res.json({ 
      id: imageId,
      ...imageData
    });
  } catch (error) {
    console.error('Error fetching carousel image:', error);
    res.status(500).json({ error: 'Failed to fetch carousel image', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Carousel server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.carouselServer.environment}`);
}); 