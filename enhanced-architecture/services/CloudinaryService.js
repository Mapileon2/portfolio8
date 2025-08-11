const cloudinary = require('cloudinary').v2;
const NodeCache = require('node-cache');
const crypto = require('crypto');

class CloudinaryService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
    this.isConfigured = false;
    
    this.configure();
  }

  configure() {
    try {
      // Configure Cloudinary with environment variables
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });

      // Validate configuration
      if (!process.env.CLOUDINARY_CLOUD_NAME || 
          !process.env.CLOUDINARY_API_KEY || 
          !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Missing Cloudinary configuration');
      }

      this.isConfigured = true;
      console.log('☁️ Cloudinary configured successfully');
    } catch (error) {
      console.error('❌ Cloudinary configuration error:', error);
      throw new Error('Failed to configure Cloudinary');
    }
  }

  // Upload methods
  async uploadImage(filePath, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }

      const defaultOptions = {
        folder: 'portfolio',
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        flags: 'progressive'
      };

      const uploadOptions = { ...defaultOptions, ...options };
      
      console.log(`☁️ Uploading image to Cloudinary: ${filePath}`);
      const result = await cloudinary.uploader.upload(filePath, uploadOptions);
      
      console.log(`✅ Image uploaded successfully: ${result.public_id}`);
      
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        thumbnail: this.generateThumbnailUrl(result.public_id, 300, 200)
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async uploadFromUrl(imageUrl, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }

      const defaultOptions = {
        folder: 'portfolio',
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto'
      };

      const uploadOptions = { ...defaultOptions, ...options };
      
      console.log(`☁️ Uploading image from URL to Cloudinary: ${imageUrl}`);
      const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);
      
      console.log(`✅ Image uploaded successfully: ${result.public_id}`);
      
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        thumbnail: this.generateThumbnailUrl(result.public_id, 300, 200)
      };
    } catch (error) {
      console.error('Cloudinary URL upload error:', error);
      throw new Error(`URL upload failed: ${error.message}`);
    }
  }

  async uploadBase64(base64Data, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }

      const defaultOptions = {
        folder: 'portfolio',
        resource_type: 'image',
        quality: 'auto'
      };

      const uploadOptions = { ...defaultOptions, ...options };
      
      console.log('☁️ Uploading base64 image to Cloudinary');
      const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Data}`, uploadOptions);
      
      console.log(`✅ Base64 image uploaded successfully: ${result.public_id}`);
      
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        thumbnail: this.generateThumbnailUrl(result.public_id, 300, 200)
      };
    } catch (error) {
      console.error('Cloudinary base64 upload error:', error);
      throw new Error(`Base64 upload failed: ${error.message}`);
    }
  }

  // Delete methods
  async deleteImage(publicId) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }

      console.log(`☁️ Deleting image from Cloudinary: ${publicId}`);
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        console.log(`✅ Image deleted successfully: ${publicId}`);
        return true;
      } else {
        console.warn(`⚠️ Image deletion result: ${result.result} for ${publicId}`);
        return false;
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async deleteMultipleImages(publicIds) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }

      console.log(`☁️ Deleting multiple images from Cloudinary: ${publicIds.length} images`);
      const result = await cloudinary.api.delete_resources(publicIds);
      
      console.log(`✅ Bulk delete completed`);
      return result;
    } catch (error) {
      console.error('Cloudinary bulk delete error:', error);
      throw new Error(`Bulk delete failed: ${error.message}`);
    }
  }

  // Transformation methods
  generateThumbnailUrl(publicId, width = 300, height = 200) {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto'
    });
  }

  generateResponsiveUrl(publicId, transformations = {}) {
    const defaultTransformations = {
      quality: 'auto',
      fetch_format: 'auto',
      flags: 'progressive'
    };

    return cloudinary.url(publicId, { ...defaultTransformations, ...transformations });
  }

  generateOptimizedUrl(publicId, options = {}) {
    const optimizations = {
      quality: 'auto:good',
      fetch_format: 'auto',
      flags: 'progressive',
      ...options
    };

    return cloudinary.url(publicId, optimizations);
  }

  // Upload signature for secure client-side uploads
  generateUploadSignature(params = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }

      const timestamp = Math.round(new Date().getTime() / 1000);
      
      const defaultParams = {
        timestamp,
        folder: 'portfolio',
        quality: 'auto',
        fetch_format: 'auto'
      };

      const signatureParams = { ...defaultParams, ...params };
      
      // Generate signature
      const signature = cloudinary.utils.api_sign_request(signatureParams, process.env.CLOUDINARY_API_SECRET);
      
      return {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        ...signatureParams
      };
    } catch (error) {
      console.error('Signature generation error:', error);
      throw new Error(`Signature generation failed: ${error.message}`);
    }
  }

  // Resource management
  async getImageDetails(publicId) {
    try {
      const cacheKey = `cloudinary_details:${publicId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const result = await cloudinary.api.resource(publicId);
      
      const details = {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        tags: result.tags || [],
        folder: result.folder
      };

      this.cache.set(cacheKey, details);
      return details;
    } catch (error) {
      console.error('Get image details error:', error);
      throw new Error(`Failed to get image details: ${error.message}`);
    }
  }

  async listImages(options = {}) {
    try {
      const defaultOptions = {
        type: 'upload',
        prefix: 'portfolio/',
        max_results: 50
      };

      const listOptions = { ...defaultOptions, ...options };
      const result = await cloudinary.api.resources(listOptions);
      
      return {
        images: result.resources.map(resource => ({
          publicId: resource.public_id,
          url: resource.secure_url,
          width: resource.width,
          height: resource.height,
          format: resource.format,
          bytes: resource.bytes,
          createdAt: resource.created_at,
          thumbnail: this.generateThumbnailUrl(resource.public_id)
        })),
        nextCursor: result.next_cursor
      };
    } catch (error) {
      console.error('List images error:', error);
      throw new Error(`Failed to list images: ${error.message}`);
    }
  }

  // Portfolio-specific methods
  async uploadCarouselImage(filePath, caption = '') {
    try {
      const result = await this.uploadImage(filePath, {
        folder: 'portfolio/carousel',
        context: `caption=${caption}`,
        tags: ['carousel', 'portfolio']
      });

      return {
        ...result,
        caption,
        type: 'carousel'
      };
    } catch (error) {
      console.error('Carousel image upload error:', error);
      throw error;
    }
  }

  async uploadCaseStudyImage(filePath, caseStudyId) {
    try {
      const result = await this.uploadImage(filePath, {
        folder: `portfolio/case-studies/${caseStudyId}`,
        tags: ['case-study', 'portfolio', caseStudyId]
      });

      return {
        ...result,
        caseStudyId,
        type: 'case-study'
      };
    } catch (error) {
      console.error('Case study image upload error:', error);
      throw error;
    }
  }

  async uploadProfileImage(filePath) {
    try {
      const result = await this.uploadImage(filePath, {
        folder: 'portfolio/profile',
        tags: ['profile', 'portfolio'],
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return {
        ...result,
        type: 'profile'
      };
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  }

  // Analytics integration
  async getImageAnalytics(publicId) {
    try {
      // This would integrate with Cloudinary's analytics if available
      // For now, return basic info
      const details = await this.getImageDetails(publicId);
      
      return {
        publicId,
        views: 0, // Would come from analytics
        bandwidth: details.bytes,
        lastAccessed: new Date().toISOString()
      };
    } catch (error) {
      console.error('Image analytics error:', error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConfigured) {
        return {
          status: 'not-configured',
          message: 'Cloudinary credentials not set',
          timestamp: new Date().toISOString()
        };
      }

      // Test basic functionality (offline)
      const testUrl = cloudinary.url('sample', { width: 100, height: 100 });
      if (!testUrl) {
        throw new Error('URL generation failed');
      }

      // Try API connection with timeout
      try {
        const pingPromise = cloudinary.api.ping();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        await Promise.race([pingPromise, timeoutPromise]);
        
        return {
          status: 'healthy',
          configured: this.isConfigured,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiConnected: true,
          timestamp: new Date().toISOString()
        };
      } catch (apiError) {
        // API not reachable, but basic functions work
        return {
          status: 'partial',
          configured: this.isConfigured,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiConnected: false,
          message: 'Basic functions working, API connection issues',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Utility methods
  extractPublicIdFromUrl(cloudinaryUrl) {
    try {
      const matches = cloudinaryUrl.match(/\/v\d+\/(.+)\./);
      return matches ? matches[1] : null;
    } catch (error) {
      console.error('Extract public ID error:', error);
      return null;
    }
  }

  isCloudinaryUrl(url) {
    return url && url.includes('res.cloudinary.com');
  }

  // Security methods
  validateUploadParams(params) {
    const allowedFolders = ['portfolio', 'portfolio/carousel', 'portfolio/case-studies', 'portfolio/profile'];
    const folder = params.folder || 'portfolio';
    
    if (!allowedFolders.some(allowed => folder.startsWith(allowed))) {
      throw new Error('Invalid upload folder');
    }

    return true;
  }
}

module.exports = CloudinaryService;