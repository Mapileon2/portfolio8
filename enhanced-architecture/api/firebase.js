const express = require('express');
const router = express.Router();

// Authentication middleware
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

// Get case studies
router.get('/case-studies', async (req, res) => {
  try {
    const firebase = req.services.firebase;
    const caseStudies = await firebase.getCaseStudies();
    res.json({ caseStudies });
  } catch (error) {
    console.error('Error getting case studies:', error);
    res.status(500).json({ error: 'Failed to get case studies' });
  }
});

// Get single case study
router.get('/case-studies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const firebase = req.services.firebase;
    const caseStudy = await firebase.getData(`caseStudies/${id}`);
    
    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study not found' });
    }

    res.json(caseStudy);
  } catch (error) {
    console.error('Error getting case study:', error);
    res.status(500).json({ error: 'Failed to get case study' });
  }
});

// Create case study (admin only)
router.post('/case-studies', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firebase = req.services.firebase;
    const caseStudy = await firebase.createCaseStudy(req.body);
    
    // Track analytics
    req.services.analytics.trackEvent('case_study_created', {
      caseStudyId: caseStudy.id,
      title: caseStudy.projectTitle
    });

    res.status(201).json(caseStudy);
  } catch (error) {
    console.error('Error creating case study:', error);
    res.status(500).json({ error: 'Failed to create case study' });
  }
});

// Update case study (admin only)
router.put('/case-studies/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const firebase = req.services.firebase;
    
    await firebase.updateCaseStudy(id, req.body);
    
    // Track analytics
    req.services.analytics.trackEvent('case_study_updated', {
      caseStudyId: id
    });

    res.json({ success: true, message: 'Case study updated successfully' });
  } catch (error) {
    console.error('Error updating case study:', error);
    res.status(500).json({ error: 'Failed to update case study' });
  }
});

// Delete case study (admin only)
router.delete('/case-studies/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const firebase = req.services.firebase;
    
    await firebase.deleteCaseStudy(id);
    
    // Track analytics
    req.services.analytics.trackEvent('case_study_deleted', {
      caseStudyId: id
    });

    res.json({ success: true, message: 'Case study deleted successfully' });
  } catch (error) {
    console.error('Error deleting case study:', error);
    res.status(500).json({ error: 'Failed to delete case study' });
  }
});

// Get carousel images
router.get('/carousel-images', async (req, res) => {
  try {
    const firebase = req.services.firebase;
    const images = await firebase.getCarouselImages();
    res.json({ images });
  } catch (error) {
    console.error('Error getting carousel images:', error);
    res.status(500).json({ error: 'Failed to get carousel images' });
  }
});

// Add carousel image (admin only)
router.post('/carousel-images', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firebase = req.services.firebase;
    const image = await firebase.addCarouselImage(req.body);
    
    // Track analytics
    req.services.analytics.trackEvent('carousel_image_added', {
      imageId: image.id,
      caption: image.caption
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('Error adding carousel image:', error);
    res.status(500).json({ error: 'Failed to add carousel image' });
  }
});

// Delete carousel image (admin only)
router.delete('/carousel-images/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const firebase = req.services.firebase;
    
    // Get image data first to delete from Cloudinary
    const imageData = await firebase.getData(`carouselImages/${id}`);
    
    if (imageData && imageData.publicId) {
      const cloudinary = req.services.cloudinary;
      try {
        await cloudinary.deleteImage(imageData.publicId);
      } catch (cloudinaryError) {
        console.warn('Failed to delete image from Cloudinary:', cloudinaryError);
      }
    }
    
    await firebase.deleteCarouselImage(id);
    
    // Track analytics
    req.services.analytics.trackEvent('carousel_image_deleted', {
      imageId: id
    });

    res.json({ success: true, message: 'Carousel image deleted successfully' });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    res.status(500).json({ error: 'Failed to delete carousel image' });
  }
});

// Get site sections
router.get('/sections', async (req, res) => {
  try {
    const firebase = req.services.firebase;
    const sections = await firebase.getData('sections');
    res.json(sections || {});
  } catch (error) {
    console.error('Error getting sections:', error);
    res.status(500).json({ error: 'Failed to get sections' });
  }
});

// Update site sections (admin only)
router.put('/sections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firebase = req.services.firebase;
    await firebase.setData('sections', req.body);
    
    // Track analytics
    req.services.analytics.trackEvent('sections_updated', {
      sections: Object.keys(req.body)
    });

    res.json({ success: true, message: 'Sections updated successfully' });
  } catch (error) {
    console.error('Error updating sections:', error);
    res.status(500).json({ error: 'Failed to update sections' });
  }
});

// Verify admin access
router.get('/verify-admin', authenticateToken, (req, res) => {
  try {
    const isAdmin = req.user.customClaims?.admin === true;
    
    res.json({
      isAdmin,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        emailVerified: req.user.emailVerified
      }
    });
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
});

// Create admin user (development only)
router.post('/create-admin', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const firebase = req.services.firebase;
    const user = await firebase.createUser({
      email,
      password,
      displayName: displayName || 'Admin User',
      isAdmin: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: error.message || 'Failed to create admin user' });
  }
});

module.exports = router;