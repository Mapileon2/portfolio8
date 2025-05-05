/**
 * Google Drive Link Converter - ENHANCED VERSION
 * Converts Google Drive shareable links to direct embeddable URLs
 * 
 * This utility helps convert Google Drive shareable links to direct embeddable links
 * that can be used in image tags, specifically for the carousel.
 * 
 * Format: 
 * - Input: https://drive.google.com/file/d/17EHTEIKw0MHoKRkGCm2qIJchx3VndZLJ/view?usp=sharing
 * - Output: https://drive.usercontent.google.com/download?id=17EHTEIKw0MHoKRkGCm2qIJchx3VndZLJ&export=view&authuser=0
 */

// Flag to indicate we prefer local storage
window.PREFER_LOCAL_STORAGE = true;

// Main function to convert a list of Google Drive links
function convertDriveLinks(links) {
  // Handle different input formats
  let linkArray = [];
  
  if (typeof links === 'string') {
    // Check if it's a string with multiple links
    if (links.includes('\n')) {
      linkArray = links.split('\n').filter(link => link.trim() !== '');
    } else if (links.includes(',')) {
      linkArray = links.split(',').map(link => link.trim()).filter(link => link !== '');
    } else {
      // Single link
      linkArray = [links.trim()];
    }
  } else if (Array.isArray(links)) {
    linkArray = links;
  } else {
    console.error('Invalid input format. Please provide a string or array of links.');
    return [];
  }
  
  // Process each link
  const results = linkArray.map(link => {
    return {
      original: link,
      converted: extractAndConvertGoogleDriveLink(link)
    };
  });
  
  return results;
}

// Extract file ID and convert to direct URL - with enhanced error handling
function extractAndConvertGoogleDriveLink(url) {
  if (!url || typeof url !== 'string') {
    return { error: 'Invalid URL format' };
  }
  
  try {
    // Validate if it's a Google Drive URL
    if (!isGoogleDriveUrl(url)) {
      return { error: 'Not a Google Drive URL' };
    }
    
    // Check if it's already a direct URL
    if (url.includes('drive.usercontent.google.com') || 
        url.includes('lh3.googleusercontent.com')) {
      return url;
    }
    
    // Extract file ID using regex
    const fileId = extractGoogleDriveFileId(url);
    
    if (!fileId) {
      return { error: 'Could not extract file ID from URL' };
    }
    
    // Try different URL formats to maximize compatibility
    // We store the preferred format in sessionStorage for the current session
    const preferredFormat = getPreferredUrlFormat();
    
    // Get URL based on preferred format
    return buildDirectUrlFromFormat(fileId, preferredFormat);
  } catch (error) {
    console.error("Error converting Google Drive URL:", error);
    return { error: 'Conversion error: ' + error.message };
  }
}

// Check if a URL is from Google Drive
function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Enhanced detection with more possible Google Drive URL patterns
  return url.includes('drive.google.com') || 
         url.includes('drive.usercontent.google.com') ||
         url.includes('lh3.googleusercontent.com') ||
         url.includes('docs.google.com') ||
         url.includes('googleapis.com/download/storage') ||
         url.includes('drive.google.com/uc?export=view');
}

// Extract file ID from various Google Drive URL formats
function extractGoogleDriveFileId(url) {
  let fileId = null;
  
  try {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/);
    if (fileMatch) fileId = fileMatch[1];
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)(?:&|$)/);
    if (!fileId && openMatch) fileId = openMatch[1];
    
    // Format: https://drive.google.com/uc?export=view&id=FILE_ID
    const ucMatch = url.match(/\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)(?:&|$)/);
    if (!fileId && ucMatch) fileId = ucMatch[1];
    
    // New format: https://drive.google.com/drive/folders/FILE_ID?usp=sharing
    const folderMatch = url.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/);
    if (!fileId && folderMatch) fileId = folderMatch[1];
    
    return fileId;
  } catch (error) {
    console.error("Error extracting file ID:", error);
    return null;
  }
}

// Get preferred URL format from session storage
function getPreferredUrlFormat() {
  const cachedFormat = sessionStorage.getItem('gdriveUrlFormat');
  return cachedFormat ? parseInt(cachedFormat) : 0; // Default to 0
}

// Set preferred URL format in session storage
function setPreferredUrlFormat(formatIndex) {
  sessionStorage.setItem('gdriveUrlFormat', formatIndex.toString());
}

// Build direct URL from format and file ID
function buildDirectUrlFromFormat(fileId, formatIndex = 0) {
  const urlFormats = [
    // The most reliable format as of 2024
    `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
    // Older format that might work in some cases
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    // Another format for thumbnails
    `https://lh3.googleusercontent.com/d/${fileId}`,
    // Yet another format that sometimes works
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
  ];
  
  // Make sure format index is valid
  const safeIndex = (formatIndex >= 0 && formatIndex < urlFormats.length) ? 
                    formatIndex : 0;
  
  return urlFormats[safeIndex];
}

// Try loading image with different URL formats until one works
function tryLoadingWithDifferentFormats(fileId, imageElement, currentFormat = 0, maxAttempts = 3) {
  if (currentFormat >= maxAttempts) {
    console.error(`Failed to load image after ${maxAttempts} attempts`);
    return false;
  }
  
  // Set the image source to the current format
  const directUrl = buildDirectUrlFromFormat(fileId, currentFormat);
  imageElement.src = directUrl;
  
  // Set up event handlers
  imageElement.onload = function() {
    console.log(`Successfully loaded image with format ${currentFormat}`);
    setPreferredUrlFormat(currentFormat);
    return true;
  };
  
  imageElement.onerror = function() {
    console.log(`Failed to load with format ${currentFormat}, trying next format`);
    // Try the next format
    return tryLoadingWithDifferentFormats(fileId, imageElement, currentFormat + 1, maxAttempts);
  };
  
  return true;
}

// Function to process a batch of links from textarea input
function processLinks(linkText) {
  const results = convertDriveLinks(linkText);
  
  // Log results to console (for debugging)
  console.log('Converted Google Drive Links:');
  results.forEach(result => {
    if (result.converted && typeof result.converted === 'string') {
      console.log(`Original: ${result.original}`);
      console.log(`Converted: ${result.converted}`);
      console.log('---');
    } else {
      console.log(`Error converting: ${result.original}`);
      console.log(`Error: ${result.converted?.error || 'Unknown error'}`);
      console.log('---');
    }
  });
  
  return results;
}

// Setup the link converter UI in the admin panel
function setupLinkConverter() {
  // Check if we're on the admin page
  if (!window.location.pathname.includes('admin.html')) return;
  
  // Create the converter UI if it doesn't exist
  if (!document.getElementById('gdrive-converter')) {
    const container = document.createElement('div');
    container.id = 'gdrive-converter';
    container.className = 'mt-8 p-6 bg-white rounded-lg shadow-md';
    container.innerHTML = `
      <h2 class="text-xl font-bold mb-4">Google Drive Link Converter</h2>
      <p class="text-gray-600 mb-4">Paste Google Drive shareable links below (one per line) to convert them to direct image URLs.</p>
      
      <div class="mb-4">
        <textarea id="drive-links-input" rows="5" class="w-full p-2 border rounded"
          placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"></textarea>
      </div>
      
      <button id="convert-links-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
        Convert Links
      </button>
      
      <div id="conversion-results" class="mt-4 hidden">
        <h3 class="font-bold mb-2">Converted Links:</h3>
        <div id="results-container" class="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto"></div>
      </div>
    `;
    
    // Find a good spot to add the converter UI
    const contentArea = document.querySelector('.container') || document.body;
    contentArea.appendChild(container);
    
    // Add event listener for the convert button
    document.getElementById('convert-links-btn').addEventListener('click', function() {
      const linkText = document.getElementById('drive-links-input').value;
      const results = processLinks(linkText);
      
      // Display results
      const resultsContainer = document.getElementById('results-container');
      resultsContainer.innerHTML = '';
      
      results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'mb-4 p-3 bg-white rounded shadow-sm';
        
        if (result.converted && typeof result.converted === 'string') {
          resultItem.innerHTML = `
            <div class="text-sm text-gray-600 mb-1">Original:</div>
            <div class="text-xs break-all mb-2">${result.original}</div>
            <div class="text-sm text-gray-600 mb-1">Converted:</div>
            <div class="text-xs break-all mb-2 font-mono bg-gray-100 p-1 rounded">${result.converted}</div>
            <button class="copy-btn text-blue-500 text-xs hover:text-blue-700" data-url="${result.converted}">
              Copy URL
            </button>
            <a href="${result.converted}" target="_blank" class="ml-3 text-blue-500 text-xs hover:text-blue-700">
              Test Link
            </a>
          `;
        } else {
          resultItem.innerHTML = `
            <div class="text-sm text-gray-600 mb-1">Original:</div>
            <div class="text-xs break-all mb-2">${result.original}</div>
            <div class="text-sm text-red-500 mb-1">Error:</div>
            <div class="text-xs break-all">${result.converted?.error || 'Unknown error'}</div>
          `;
        }
        
        resultsContainer.appendChild(resultItem);
      });
      
      // Add copy button functionality
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const url = this.getAttribute('data-url');
          navigator.clipboard.writeText(url).then(
            () => {
              const originalText = this.textContent;
              this.textContent = 'Copied!';
              setTimeout(() => {
                this.textContent = originalText;
              }, 2000);
            },
            () => {
              alert('Failed to copy URL');
            }
          );
        });
      });
      
      // Show results section
      document.getElementById('conversion-results').classList.remove('hidden');
    });
  }
}

// Enhance the carousel on index page with Google Drive support
function enhanceCarouselWithGoogleDriveSupport() {
  // Wait for the page to load
  window.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the index page
    if (!document.querySelector('.swiper-magical')) return;
    
    console.log('Enhancing carousel with Google Drive support');
    
    // Process all carousel images
    const carouselImages = document.querySelectorAll('.swiper-magical .swiper-slide img');
    
    carouselImages.forEach((img, index) => {
      const originalSrc = img.getAttribute('src');
      
      // Check if this is a Google Drive URL
      if (originalSrc && isGoogleDriveUrl(originalSrc)) {
        // Extract file ID
        const fileId = extractGoogleDriveFileId(originalSrc);
        
        if (fileId) {
          console.log(`Converting carousel image ${index} to direct URL`);
          img.setAttribute('data-original-url', originalSrc);
          img.setAttribute('data-file-id', fileId);
          
          // Try loading with different formats if needed
          tryLoadingWithDifferentFormats(fileId, img);
        } else {
          console.error(`Could not extract file ID from URL: ${originalSrc}`);
        }
      } else if (originalSrc && !isGoogleDriveUrl(originalSrc)) {
        // This is not a Google Drive image - hide it
        console.log(`Image ${index} is not a Google Drive URL, hiding slide`);
        const slide = img.closest('.swiper-slide');
        if (slide) {
          slide.style.display = 'none';
          slide.setAttribute('data-hidden-reason', 'not-google-drive-image');
        }
      }
    });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Set up converter UI if on admin page
  setupLinkConverter();
  
  // Enhance carousel on index page
  enhanceCarouselWithGoogleDriveSupport();
  
  // For global access - make these functions available globally
  window.convertGoogleDriveLink = extractAndConvertGoogleDriveLink;
  window.processGoogleDriveLinks = processLinks;
  window.isGoogleDriveUrl = isGoogleDriveUrl;
  window.extractGoogleDriveFileId = extractGoogleDriveFileId;
  window.tryLoadingWithDifferentFormats = tryLoadingWithDifferentFormats;
});

// Add a utility function to get all images from localStorage
function getCarouselImagesFromLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem('carouselImages') || '[]');
  } catch (e) {
    console.error('Error parsing carousel images from localStorage:', e);
    return [];
  }
} 