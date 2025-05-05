/**
 * Google Drive Image Utilities
 * Improved functionality for handling Google Drive images
 */

// Check if a URL is a Google Drive URL
function isGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.indexOf('drive.google.com') !== -1 || 
           url.indexOf('docs.google.com') !== -1 ||
           url.indexOf('drive.usercontent.google.com') !== -1;
}

// Extract file ID from Google Drive URL (supports various formats)
function extractGoogleDriveId(url) {
    if (!url || typeof url !== 'string') return null;
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
    if (fileMatch) return fileMatch[1];
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
    if (openMatch) return openMatch[1];
    
    // Format: https://drive.google.com/uc?export=view&id=FILE_ID
    const ucMatch = url.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
    if (ucMatch) return ucMatch[1];
    
    // Format: https://drive.google.com/d/FILE_ID/
    const directMatch = url.match(/\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
    if (directMatch) return directMatch[1];
    
    return null;
}

// Enhanced image processor for Google Drive URLs
function enhancedImageProcessor(url) {
    // If not a valid URL string, return as is
    if (!url || typeof url !== 'string') return url;
    
    // If not a Google Drive URL, return as is
    if (!isGoogleDriveUrl(url)) return url;
    
    // Extract file ID
    const fileId = extractGoogleDriveId(url);
    if (!fileId) return url; // Could not extract ID, return original
    
    // Return object with multiple URL formats for different use cases
    return {
        // Best for direct viewing (preferred)
        directUrl: `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
        
        // Legacy format (backup)
        legacyUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
        
        // Thumbnail version
        thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
        
        // Full resolution
        fullRes: `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
        
        // Download link
        download: `https://drive.google.com/uc?export=download&id=${fileId}`,
        
        // Preview (for documents)
        preview: `https://drive.google.com/file/d/${fileId}/preview`,
        
        // Store the file ID for reference
        fileId: fileId,
        
        // Store original URL
        originalUrl: url
    };
}

// Simple processor that returns just the direct URL (for backwards compatibility)
function processGoogleDriveUrl(url) {
    // Process using enhanced processor
    const processed = enhancedImageProcessor(url);
    
    // If it's an object (processed successfully), return the direct URL
    if (typeof processed === 'object' && processed.directUrl) {
        return processed.directUrl;
    }
    
    // Otherwise return the original or processed result
    return processed;
}

// Add fallback handling for images that fail to load
function setupGoogleDriveImageFallback(imgElement, originalUrl) {
    if (!imgElement || !originalUrl) return;
    
    console.log("Setting up fallback for image:", originalUrl);
    
    // Try to extract file ID
    const fileId = extractGoogleDriveId(originalUrl);
    if (!fileId) return; // Can't proceed without file ID
    
    // Try alternative formats one by one
    const formats = [
        // Primary format (most reliable)
        `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
        
        // Alternative formats as fallbacks
        `https://drive.google.com/uc?export=view&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
        `https://lh3.googleusercontent.com/d/${fileId}`
    ];
    
    // Set up a recursive function to try each format
    let currentIndex = 0;
    
    function tryNextFormat() {
        if (currentIndex >= formats.length) {
            console.error("All Google Drive image formats failed for:", originalUrl);
            return;
        }
        
        const format = formats[currentIndex];
        console.log(`Trying format ${currentIndex + 1}/${formats.length}:`, format);
        
        imgElement.src = format;
        currentIndex++;
    }
    
    // Set up error handler to try next format
    imgElement.onerror = tryNextFormat;
    
    // Start with the first format
    tryNextFormat();
}

// Make functions available globally
window.isGoogleDriveUrl = isGoogleDriveUrl;
window.extractGoogleDriveId = extractGoogleDriveId;
window.enhancedImageProcessor = enhancedImageProcessor;
window.processGoogleDriveUrl = processGoogleDriveUrl;
window.setupGoogleDriveImageFallback = setupGoogleDriveImageFallback; 