const cloudinary = require('cloudinary').v2;
const ImageKit = require('imagekit');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from backend.env
dotenv.config({ path: './backend.env' });

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Helper function to determine which service to use
function getServiceForImageType(imageType) {
  // Use Cloudinary for main assets including case studies
  const cloudServices = ['carousel', 'portfolio', 'hero', 'case-studies', 'caseStudies', 'casestudy', 'case-study'];
  return cloudServices.includes(imageType) ? 'cloudinary' : 'imagekit';
}

// Main image operations
const imageService = {
  // Upload an image file to the appropriate service
  uploadImage: async (imageFile, imageType = 'project', folder = '', metadata = {}, forceService = null) => {
    // Allow service to be forced for specific uploads
    const service = forceService || getServiceForImageType(imageType);
    
    if (service === 'cloudinary') {
      // Upload to Cloudinary
      const uploadOptions = {
        folder: folder || `portfolio/${imageType}`,
        resource_type: 'auto',
        overwrite: true
      };
      
      // Add any custom metadata
      if (metadata) {
        uploadOptions.context = metadata;
      }
      
      try {
        const result = await cloudinary.uploader.upload(imageFile, uploadOptions);
        return {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          service: 'cloudinary'
        };
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
      }
    } else {
      // Upload to ImageKit
      const fileName = path.basename(imageFile);
      const fileBuffer = fs.readFileSync(imageFile);
      
      try {
        const result = await imagekit.upload({
          file: fileBuffer,
          fileName: fileName,
          folder: folder || `portfolio/${imageType}`,
          tags: Object.values(metadata || {}).join(',')
        });
        
        return {
          url: result.url,
          publicId: result.fileId,
          width: result.width,
          height: result.height,
          format: path.extname(fileName).substring(1),
          service: 'imagekit'
        };
      } catch (error) {
        console.error('ImageKit upload error:', error);
        throw error;
      }
    }
  },
  
  // Upload an image directly from buffer (for serverless environments like Vercel)
  uploadBuffer: async (buffer, fileName, imageType = 'project', folder = '', metadata = {}, forceService = null) => {
    // Allow service to be forced for specific uploads
    const service = forceService || getServiceForImageType(imageType);
    
    if (service === 'cloudinary') {
      // Prepare a stream from the buffer
      const streamifier = require('streamifier');
      const stream = streamifier.createReadStream(buffer);
      
      // Create a promise to handle the stream upload
      return new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: folder || `portfolio/${imageType}`,
          resource_type: 'auto',
          overwrite: true
        };
        
        // Add any custom metadata
        if (metadata) {
          uploadOptions.context = metadata;
        }
        
        // Upload stream to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error('Cloudinary stream upload error:', error);
            return reject(error);
          }
          
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            service: 'cloudinary'
          });
        });
        
        stream.pipe(uploadStream);
      });
    } else {
      // Upload to ImageKit directly from buffer
      try {
        const result = await imagekit.upload({
          file: buffer,
          fileName: fileName,
          folder: folder || `portfolio/${imageType}`,
          tags: Object.values(metadata || {}).join(',')
        });
        
        return {
          url: result.url,
          publicId: result.fileId,
          width: result.width,
          height: result.height,
          format: path.extname(fileName).substring(1),
          service: 'imagekit'
        };
      } catch (error) {
        console.error('ImageKit buffer upload error:', error);
        throw error;
      }
    }
  },
  
  // Delete an image from the appropriate service
  deleteImage: async (publicId, service) => {
    try {
      if (service === 'cloudinary') {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
      } else {
        const result = await imagekit.deleteFile(publicId);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting image from ${service}:`, error);
      throw error;
    }
  },
  
  // Get a list of images from a specific folder
  getImagesFromFolder: async (folder, service = 'cloudinary') => {
    try {
      if (service === 'cloudinary') {
        const result = await cloudinary.search
          .expression(`folder:${folder}`)
          .sort_by('created_at', 'desc')
          .execute();
          
        return result.resources.map(resource => ({
          url: resource.secure_url,
          publicId: resource.public_id,
          width: resource.width,
          height: resource.height,
          format: resource.format,
          createdAt: resource.created_at,
          service: 'cloudinary'
        }));
      } else {
        const result = await imagekit.listFiles({
          path: folder
        });
        
        return result.map(file => ({
          url: file.url,
          publicId: file.fileId,
          width: file.width,
          height: file.height,
          format: file.fileType,
          createdAt: file.createdAt,
          service: 'imagekit'
        }));
      }
    } catch (error) {
      console.error(`Error listing images from ${service}:`, error);
      throw error;
    }
  },
  
  // Generate secure URLs for manipulated images (resizing, cropping, etc.)
  getResizedImageUrl: (url, width, height, options = {}) => {
    // Check if the URL is from Cloudinary or ImageKit
    if (url.includes('cloudinary')) {
      // Extract the base URL and the image path
      const urlParts = url.split('/upload/');
      if (urlParts.length !== 2) return url;
      
      let transformations = `c_${options.crop || 'fill'},w_${width},h_${height}`;
      
      if (options.quality) {
        transformations += `,q_${options.quality}`;
      }
      
      if (options.format) {
        transformations += `,f_${options.format}`;
      }
      
      // Combine the base URL, transformations, and image path
      return `${urlParts[0]}/upload/${transformations}/${urlParts[1]}`;
    } else if (url.includes('imagekit')) {
      // Generate ImageKit transformation URL
      const transformations = [];
      
      if (width) transformations.push(`w-${width}`);
      if (height) transformations.push(`h-${height}`);
      if (options.crop) transformations.push(`c-${options.crop}`);
      if (options.quality) transformations.push(`q-${options.quality}`);
      if (options.format) transformations.push(`f-${options.format}`);
      
      // URL-encoded transformation parameters
      const paramsString = transformations.join(',');
      
      // Modify the URL to include transformations
      if (url.includes('?')) {
        return `${url}&tr=${paramsString}`;
      } else {
        return `${url}?tr=${paramsString}`;
      }
    }
    
    // Return the original URL if it doesn't match any service
    return url;
  },
  
  // Utility to get authenticated upload signature for client-side direct uploads
  getUploadSignature: (folder, service = 'cloudinary') => {
    if (service === 'cloudinary') {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = cloudinary.utils.api_sign_request({
        timestamp,
        folder
      }, process.env.CLOUDINARY_API_SECRET);
      
      return {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY
      };
    } else {
      const token = imagekit.getAuthenticationParameters();
      return {
        ...token,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY
      };
    }
  }
};

module.exports = imageService; 