/**
 * Firebase Authentication Fix and Google Drive Image Handler
 * Improves handling of JWT authentication issues and Google Drive images
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the page to fully load
  setTimeout(function() {
    console.log('Initializing Firebase auth fix');
    
    // Monitor for Firebase authentication errors
    setupFirebaseErrorMonitoring();
    
    // Setup Google Drive image handling
    enhanceGoogleDriveImageHandling();
    
    // Check all images and optimize formats for Google Drive
    processPendingGoogleDriveImages();
  }, 800);
});

// Monitor for Firebase auth errors and provide alternatives
function setupFirebaseErrorMonitoring() {
  // Look for authentication errors in the console
  const originalConsoleError = console.error;
  console.error = function() {
    originalConsoleError.apply(console, arguments);
    
    // Check if this is a Firebase auth error
    const errorMsg = arguments[0] && arguments[0].toString ? arguments[0].toString() : '';
    
    if (errorMsg.includes('Firebase') && 
        (errorMsg.includes('auth') || errorMsg.includes('token') || 
         errorMsg.includes('credential') || errorMsg.includes('JWT'))) {
      
      console.log('Firebase auth error detected, activating fallback systems');
      
      // Attempt time synchronization
      synchronizeWithGoogleTime()
        .then(adjusted => {
          if (adjusted) {
            console.log('Time adjusted, retrying Firebase operations');
            // Reconnect Firebase if possible
            if (typeof firebase !== 'undefined' && firebase.app) {
              try {
                firebase.database().goOnline();
              } catch (e) {
                console.log('Could not reconnect Firebase database');
              }
            }
          } else {
            console.log('Time synchronization did not require adjustment');
            activateFallbackSystems();
          }
        })
        .catch(err => {
          console.error('Time synchronization failed:', err);
          activateFallbackSystems();
        });
    }
  };
}

// Synchronize with Google's servers to fix time-based JWT issues
async function synchronizeWithGoogleTime() {
  try {
    console.log('Attempting to synchronize with Google server time...');
    
    // Add cache-busting parameter to avoid cached responses
    const timestamp = new Date().getTime();
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?dummy=${timestamp}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const serverDate = new Date(response.headers.get('date'));
    const localDate = new Date();
    
    // Calculate time difference
    const timeDiff = serverDate.getTime() - localDate.getTime();
    console.log(`Client-server time difference: ${timeDiff}ms`);
    
    // Store time difference for future reference
    localStorage.setItem('googleTimeDiff', timeDiff.toString());
    
    // Return true if adjustment was significant
    return Math.abs(timeDiff) > 1000;
  } catch (error) {
    console.error('Error synchronizing with Google time:', error);
    return false;
  }
}

// Activate fallback systems when Firebase fails
function activateFallbackSystems() {
  console.log('Activating fallback systems for Firebase');
  
  // Check if we have locally stored images
  const localImages = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  if (localImages.length > 0) {
    console.log(`Found ${localImages.length} images in localStorage, using as fallback`);
    
    // Update any carousels with these images
    updateCarouselsWithLocalImages(localImages);
  } else {
    console.log('No locally stored images found');
  }
  
  // Show a user-friendly notification about the issue
  showFirebaseIssueNotification();
}

// Show a user-friendly notification about Firebase issues
function showFirebaseIssueNotification() {
  // Avoid showing multiple notifications
  if (document.getElementById('firebase-issue-notification')) return;
  
  const notification = document.createElement('div');
  notification.id = 'firebase-issue-notification';
  notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-amber-50 text-amber-800 px-4 py-2 rounded-md shadow-lg z-50 flex items-center space-x-2 text-sm';
  notification.innerHTML = `
    <i class="fas fa-exclamation-circle text-amber-600"></i>
    <span>Using locally saved content due to connection issues</span>
    <button class="ml-2 text-amber-600 hover:text-amber-800 focus:outline-none" aria-label="Close notification">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // Add close button handler
  notification.querySelector('button').addEventListener('click', function() {
    notification.remove();
  });
  
  // Auto-hide after 8 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => notification.remove(), 500);
    }
  }, 8000);
}

// Update carousels with locally stored images
function updateCarouselsWithLocalImages(images) {
  // Check for magical journeys carousel
  const magicalCarousel = document.querySelector('.swiper-magical');
  if (magicalCarousel) {
    const slides = magicalCarousel.querySelectorAll('.swiper-slide');
    
    // Update slides with local images
    images.forEach((image, index) => {
      if (index < slides.length) {
        const slide = slides[index];
        const img = slide.querySelector('img');
        if (img) {
          console.log(`Updating carousel image ${index} with local data`);
          
          // Only use the image if it's from Google Drive
          if (window.isGoogleDriveUrl && window.isGoogleDriveUrl(image.url)) {
            img.src = image.url;
            img.onerror = function() {
              console.log(`Google Drive image failed to load: ${image.url}`);
              // Instead of using fallback, hide the slide
              hideInvalidSlide(this);
            };
            
            // Update caption
            const caption = slide.querySelector('.absolute');
            if (caption) {
              const title = caption.querySelector('h3');
              const desc = caption.querySelector('p');
              
              if (title) title.textContent = image.title || `Journey ${index + 1}`;
              if (desc) desc.textContent = image.description || 'Google Drive image';
            }
          } else {
            // If not a Google Drive image, hide the slide
            console.log(`Hiding non-Google Drive image at index ${index}`);
            hideInvalidSlide(img);
          }
        }
      }
    });
    
    // For any remaining slides, hide them completely
    for (let i = images.length; i < slides.length; i++) {
      const slide = slides[i];
      if (slide) {
        slide.style.display = 'none';
        slide.setAttribute('data-hidden-reason', 'no-google-drive-image-available');
      }
    }
    
    // Initialize Swiper if needed to reflect these changes
    updateSwiperAfterImageChanges(magicalCarousel);
  }
}

// Get a fallback image URL for a specific index - 
// Note: Only for debug purposes, not used for display anymore
function getFallbackImageUrl(index) {
  // This function is kept for diagnostic purposes but we won't use it for display
  return null;
}

// Apply better fallbacks to existing slide images
function applyFallbackToExistingImages(carousel) {
  const slides = carousel.querySelectorAll('.swiper-slide');
  
  slides.forEach((slide, index) => {
    const img = slide.querySelector('img');
    if (!img) return;
    
    // Enhanced onerror handler for images
    img.onerror = function() {
      console.log(`Image #${index} failed to load:`, this.src);
      
      // Check if this is a Google Drive URL
      if (window.isGoogleDriveUrl && window.isGoogleDriveUrl(this.getAttribute('data-original-url') || this.src)) {
        // For Google Drive images, try alternative formats
        tryAlternativeGoogleDriveFormats(this);
      } else {
        // For non-Google Drive images, hide the slide
        hideInvalidSlide(this);
      }
    };
    
    // Check if it's not a Google Drive URL
    const src = img.getAttribute('src') || '';
    if (!(window.isGoogleDriveUrl && window.isGoogleDriveUrl(src))) {
      // Hide non-Google Drive images
      hideInvalidSlide(img);
    } else {
      // Otherwise, trigger reload to apply our error handler
      const currentSrc = img.getAttribute('src');
      img.setAttribute('src', currentSrc);
    }
  });
  
  // Update Swiper to reflect these changes
  updateSwiperAfterImageChanges(carousel);
}

// Update Swiper after making image changes
function updateSwiperAfterImageChanges(carousel) {
  // Wait a moment for changes to take effect
  setTimeout(() => {
    if (carousel && carousel.swiper) {
      carousel.swiper.update();
    } else if (window.Swiper) {
      // If swiper instance not directly accessible
      try {
        const swiper = new Swiper('.swiper-magical', {
          // Reuse existing configuration
          updateOnImagesReady: true,
          observer: true,
          observeParents: true
        });
        console.log('Re-initialized swiper after image changes');
      } catch (e) {
        console.log('Could not re-initialize swiper:', e);
      }
    }
  }, 500);
}

// Enhance Google Drive image handling
function enhanceGoogleDriveImageHandling() {
  // Register a global helper function
  window.processGoogleDriveUrl = function(url) {
    if (!url) return null;
    
    // Try to extract the file ID
    let fileId = null;
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/);
    if (fileMatch) fileId = fileMatch[1];
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)(?:&|$)/);
    if (!fileId && openMatch) fileId = openMatch[1];
    
    if (!fileId) return url; // Not a recognized Google Drive URL
    
    // The most reliable format as of 2024
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
  };
  
  // Add convenience method to window
  window.isGoogleDriveUrl = function(url) {
    return url && typeof url === 'string' && url.includes('drive.google.com');
  };
}

// Process all images that might be Google Drive URLs
function processPendingGoogleDriveImages() {
  // Find all images on the page
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    const src = img.getAttribute('src') || '';
    
    // Check if this is a Google Drive URL
    if (window.isGoogleDriveUrl && window.isGoogleDriveUrl(src) && window.processGoogleDriveUrl) {
      console.log('Processing Google Drive image:', src);
      const processedUrl = window.processGoogleDriveUrl(src);
      
      if (processedUrl && processedUrl !== src) {
        console.log('Optimized Google Drive URL:', processedUrl);
        img.setAttribute('data-original-url', src);
        img.src = processedUrl;
      }
    }
    
    // Add enhanced error handler for all images
    if (!img.hasAttribute('data-error-handler-added')) {
      const originalOnError = img.onerror;
      
      img.onerror = function(e) {
        console.log('Image load error:', this.src);
        
        // Check if this is a Google Drive URL
        if (window.isGoogleDriveUrl && window.isGoogleDriveUrl(this.src)) {
          console.log('Trying alternative Google Drive format');
          tryAlternativeGoogleDriveFormats(this);
        } else if (originalOnError) {
          // Call original handler
          return originalOnError.call(this, e);
        }
      };
      
      img.setAttribute('data-error-handler-added', 'true');
    }
  });
}

// Try alternative Google Drive URL formats when image fails to load
function tryAlternativeGoogleDriveFormats(imgElement) {
  const originalUrl = imgElement.getAttribute('data-original-url') || imgElement.src;
  let fileId = null;
  
  // Extract file ID from Google Drive URL
  const fileMatch = originalUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/);
  if (fileMatch) fileId = fileMatch[1];
  
  const openMatch = originalUrl.match(/[?&]id=([a-zA-Z0-9_-]+)(?:&|$)/);
  if (!fileId && openMatch) fileId = openMatch[1];
  
  if (!fileId) {
    // Cannot extract file ID - hide this slide
    hideInvalidSlide(imgElement);
    return;
  }
  
  console.log('Extracted Google Drive file ID:', fileId);
  
  // Try these formats in sequence
  const formats = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    `https://drive.google.com/uc?export=view&id=${fileId}`
  ];
  
  let currentFormatIndex = 0;
  
  // Try the next format
  function tryNextFormat() {
    if (currentFormatIndex >= formats.length) {
      console.error('All Google Drive formats failed for:', originalUrl);
      // Instead of using a random fallback image, hide this slide
      hideInvalidSlide(imgElement);
      return;
    }
    
    const nextFormat = formats[currentFormatIndex++];
    console.log(`Trying Google Drive format ${currentFormatIndex}:`, nextFormat);
    
    imgElement.onerror = tryNextFormat;
    imgElement.src = nextFormat;
  }
  
  // Start trying formats
  tryNextFormat();
}

// Hide a slide that contains an invalid/failed image
function hideInvalidSlide(imgElement) {
  // Find the parent slide
  const slide = findParentWithClass(imgElement, 'swiper-slide');
  if (slide) {
    console.log('Hiding invalid slide with failed Google Drive image');
    slide.style.display = 'none';
    
    // Add data attribute to mark it as hidden due to failed Google Drive image
    slide.setAttribute('data-hidden-reason', 'invalid-google-drive-image');
  }
}

// Helper to find parent element with specific class
function findParentWithClass(element, className) {
  let parent = element.parentElement;
  while (parent) {
    if (parent.classList.contains(className)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
} 