const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Authentication middleware (simplified for portfolio)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const firebase = req.services.firebase;
    const decodedToken = await firebase.verifyIdToken(token);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.customClaims?.admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Upload image to Cloudinary
router.post('/upload', upload.single('image'), authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const cloudinary = req.services.cloudinary;
    const { folder = 'portfolio', caption = '', type = 'general' } = req.body;

    // Validate folder
    cloudinary.validateUploadParams({ folder });

    let uploadResult;
    
    switch (type) {
      case 'carousel':
        uploadResult = await cloudinary.uploadCarouselImage(req.file.path, caption);
        break;
      case 'case-study':
        const caseStudyId = req.body.caseStudyId || 'general';
        uploadResult = await cloudinary.uploadCaseStudyImage(req.file.path, caseStudyId);
        break;
      case 'profile':
        uploadResult = await cloudinary.uploadProfileImage(req.file.path);
        break;
      default:
        uploadResult = await cloudinary.uploadImage(req.file.path, { folder });
    }

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    // Track analytics
    req.services.analytics.trackEvent('image_uploaded', {
      type,
      publicId: uploadResult.publicId,
      folder,
      size: uploadResult.bytes
    });

    res.json({
      success: true,
      image: uploadResult
    });
  } catch (error) {
    // Clean up temporary file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

// Upload image from URL
router.post('/upload-url', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { imageUrl, folder = 'portfolio', caption = '', type = 'general' } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const cloudinary = req.services.cloudinary;
    
    // Validate folder
    cloudinary.validateUploadParams({ folder });

    let uploadResult;
    
    switch (type) {
      case 'carousel':
        // For URL uploads, we need to upload first then process
        uploadResult = await cloudinary.uploadFromUrl(imageUrl, { folder: 'portfolio/carousel' });
        uploadResult.caption = caption;
        uploadResult.type = 'carousel';
        break;
      case 'case-study':
        const caseStudyId = req.body.caseStudyId || 'general';
        uploadResult = await cloudinary.uploadFromUrl(imageUrl, { folder: `portfolio/case-studies/${caseStudyId}` });
        uploadResult.caseStudyId = caseStudyId;
        uploadResult.type = 'case-study';
        break;
      default:
        uploadResult = await cloudinary.uploadFromUrl(imageUrl, { folder });
    }

    // Track analytics
    req.services.analytics.trackEvent('image_uploaded_from_url', {
      type,
      publicId: uploadResult.publicId,
      folder,
      size: uploadResult.bytes
    });

    res.json({
      success: true,
      image: uploadResult
    });
  } catch (error) {
    console.error('Image URL upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image from URL' });
  }
});

// Get upload signature for client-side uploads
router.get('/upload-signature', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { folder = 'portfolio', timestamp } = req.query;
    const cloudinary = req.services.cloudinary;

    // Validate folder
    cloudinary.validateUploadParams({ folder });

    const params = {
      folder,
      quality: 'auto',
      fetch_format: 'auto'
    };

    if (timestamp) {
      params.timestamp = parseInt(timestamp);
    }

    const signature = cloudinary.generateUploadSignature(params);

    res.json(signature);
  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate upload signature' });
  }
});

// Delete image
router.delete('/:publicId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { publicId } = req.params;
    const cloudinary = req.services.cloudinary;

    // Decode public ID (it might be URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    const result = await cloudinary.deleteImage(decodedPublicId);

    if (result) {
      // Track analytics
      req.services.analytics.trackEvent('image_deleted', {
        publicId: decodedPublicId
      });

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({ error: 'Image not found or already deleted' });
    }
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete image' });
  }
});

// Get image details
router.get('/details/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const cloudinary = req.services.cloudinary;

    const decodedPublicId = decodeURIComponent(publicId);
    const details = await cloudinary.getImageDetails(decodedPublicId);

    res.json(details);
  } catch (error) {
    console.error('Get image details error:', error);
    res.status(500).json({ error: error.message || 'Failed to get image details' });
  }
});

// List images
router.get('/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { folder = 'portfolio', limit = 50, nextCursor } = req.query;
    const cloudinary = req.services.cloudinary;

    const options = {
      prefix: folder + '/',
      max_results: Math.min(parseInt(limit), 100)
    };

    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    const result = await cloudinary.listImages(options);

    res.json(result);
  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({ error: error.message || 'Failed to list images' });
  }
});

// Generate optimized URL
router.post('/optimize-url', (req, res) => {
  try {
    const { publicId, transformations = {} } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    const cloudinary = req.services.cloudinary;
    const optimizedUrl = cloudinary.generateOptimizedUrl(publicId, transformations);

    res.json({
      originalPublicId: publicId,
      optimizedUrl,
      transformations
    });
  } catch (error) {
    console.error('URL optimization error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate optimized URL' });
  }
});

// Generate responsive URLs
router.post('/responsive-urls', (req, res) => {
  try {
    const { publicId, breakpoints = [320, 768, 1024, 1920] } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    const cloudinary = req.services.cloudinary;
    const responsiveUrls = {};

    breakpoints.forEach(width => {
      responsiveUrls[`w_${width}`] = cloudinary.generateResponsiveUrl(publicId, {
        width,
        crop: 'scale',
        quality: 'auto',
        fetch_format: 'auto'
      });
    });

    res.json({
      publicId,
      responsiveUrls,
      breakpoints
    });
  } catch (error) {
    console.error('Responsive URLs error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate responsive URLs' });
  }
});

// Get image analytics
router.get('/analytics/:publicId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { publicId } = req.params;
    const cloudinary = req.services.cloudinary;

    const decodedPublicId = decodeURIComponent(publicId);
    const analytics = await cloudinary.getImageAnalytics(decodedPublicId);

    res.json(analytics || { publicId: decodedPublicId, views: 0, bandwidth: 0 });
  } catch (error) {
    console.error('Image analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get image analytics' });
  }
});

module.exports = router;