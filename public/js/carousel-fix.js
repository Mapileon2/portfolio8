/**
 * Carousel Image Fix Script
 * This script fixes the image loading issues for the magical journeys carousel
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the page to fully load
  setTimeout(function() {
    console.log('Initializing carousel fix');
    
    // Check if we're on the homepage with the carousel
    const magicalCarousel = document.querySelector('.swiper-magical');
    if (!magicalCarousel) {
      console.log('No magical journeys carousel found');
      return;
    }
    
    // Check all carousel images
    checkCarouselImages();
    
    // Ensure images are properly loaded with onerror handlers
    fixCarouselImageLoading();
    
    // Apply Google Drive-only policy
    applyGoogleDriveOnlyPolicy();
  }, 400);
});

// Check carousel image loading status
function checkCarouselImages() {
  const magicalCarousel = document.querySelector('.swiper-magical');
  if (!magicalCarousel) return;
  
  const images = magicalCarousel.querySelectorAll('img');
  images.forEach((img, index) => {
    console.log(`Checking image ${index}:`, img.src);
    
    // Only allow Google Drive images
    if (img.src && !isGoogleDriveUrl(img.src)) {
      console.log(`Image ${index} is not a Google Drive URL, will be hidden`);
      const slide = findParentWithClass(img, 'swiper-slide');
      if (slide) {
        slide.style.display = 'none';
        slide.setAttribute('data-hidden-reason', 'not-google-drive-image');
      }
    }
  });
}

// Ensure each image has proper onerror handler
function fixCarouselImageLoading() {
  const magicalCarousel = document.querySelector('.swiper-magical');
  if (!magicalCarousel) return;
  
  const slides = magicalCarousel.querySelectorAll('.swiper-slide');
  slides.forEach((slide, index) => {
    const img = slide.querySelector('img');
    if (img) {
      // Only show the slide if we have a Google Drive image
      if (isGoogleDriveUrl(img.src)) {
        img.onerror = function() {
          console.log(`Google Drive image ${index} failed to load:`, this.src);
          // Hide slide instead of using fallback
          const slide = findParentWithClass(this, 'swiper-slide');
          if (slide) {
            slide.style.display = 'none';
            slide.setAttribute('data-hidden-reason', 'google-drive-image-failed');
          }
        };
      } else {
        // Hide non-Google Drive slides
        slide.style.display = 'none';
        slide.setAttribute('data-hidden-reason', 'not-google-drive-image');
      }
    }
  });
}

// Apply Google Drive-only policy to carousel
function applyGoogleDriveOnlyPolicy() {
  // Hide any slides with non-Google Drive images
  const magicalCarousel = document.querySelector('.swiper-magical');
  if (!magicalCarousel) return;
  
  const slides = magicalCarousel.querySelectorAll('.swiper-slide');
  let hasVisibleSlides = false;
  
  slides.forEach((slide, index) => {
    const img = slide.querySelector('img');
    if (img && isGoogleDriveUrl(img.src)) {
      hasVisibleSlides = true;
    } else if (!img || !isGoogleDriveUrl(img.src)) {
      slide.style.display = 'none';
      slide.setAttribute('data-hidden-reason', 'not-google-drive-image');
    }
  });
  
  // If no visible slides (no Google Drive images), display a message
  if (!hasVisibleSlides) {
    const swiperContainer = magicalCarousel.closest('.swiper-container, .swiper');
    if (swiperContainer) {
      const message = document.createElement('div');
      message.className = 'text-center p-8 bg-gray-100 rounded-lg dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      message.innerHTML = `
        <div class="mb-4">
          <i class="fas fa-images text-3xl"></i>
        </div>
        <h3 class="text-lg font-bold mb-2">Google Drive Images Only</h3>
        <p>Please add Google Drive images using the admin panel to see content here.</p>
      `;
      swiperContainer.appendChild(message);
    }
  }
  
  // Update Swiper if needed
  updateSwiperAfterChanges();
}

// Helper function to determine if a URL is from Google Drive
function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('drive.google.com') || 
         url.includes('lh3.googleusercontent.com') || 
         url.includes('drive.usercontent.google.com');
}

// Helper to find parent element with a class
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

// Update Swiper after making changes
function updateSwiperAfterChanges() {
  const magicalCarousel = document.querySelector('.swiper-magical');
  if (!magicalCarousel) return;
  
  // Wait for DOM updates to complete
  setTimeout(() => {
    // Try to access the Swiper instance
    if (magicalCarousel.swiper) {
      magicalCarousel.swiper.update();
    } else if (window.Swiper) {
      try {
        new Swiper('.swiper-magical', {
          updateOnImagesReady: true,
          observer: true,
          observeParents: true
        });
      } catch (e) {
        console.log('Error updating Swiper:', e);
      }
    }
  }, 500);
}

// Make sure the magical-journeys directory exists
function ensureMagicalJourneysDirectoryExists() {
  // For browser-side, we can only check if the directory exists by attempting to load a test file
  const testImage = new Image();
  testImage.onload = function() {
    console.log('Magical journeys directory exists');
  };
  
  testImage.onerror = function() {
    console.log('Magical journeys directory may not exist - using fallback images');
    // We'll use fallback images in fixFrontendCarousel
  };
  
  // Try to load a test pixel to check if directory exists
  testImage.src = '/images/magical-journeys/test-pixel.png?nocache=' + new Date().getTime();
}

// Enhance admin panel image preview functionality
function enhanceAdminImagePreview() {
  console.log('Enhancing admin image preview');
  
  // Observer for dynamically added forms
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.id === 'carouselImageForm' || 
              (node.querySelector && node.querySelector('#imageUrl'))) {
            setupImagePreviewHandlers();
          }
        }
      }
    });
  });
  
  // Start observing the document body for dynamic changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Also try to set up handlers for existing elements
  setupImagePreviewHandlers();
  
  // Add a test mode button
  addTestModeButton();
}

// Set up image preview handlers for the admin panel
function setupImagePreviewHandlers() {
  // Find the image URL input
  const imageUrlInput = document.getElementById('imageUrl');
  if (!imageUrlInput) return;
  
  // Override the default preview function
  imageUrlInput.addEventListener('input', function() {
    processImageUrl(this.value);
  });
  
  // Add refresh button if it doesn't exist
  if (!document.getElementById('refreshPreviewBtn')) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
      const refreshButton = document.createElement('button');
      refreshButton.id = 'refreshPreviewBtn';
      refreshButton.textContent = 'Refresh Preview';
      refreshButton.className = 'bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm mt-2';
      refreshButton.onclick = function() {
        processImageUrl(imageUrlInput.value);
      };
      previewContainer.appendChild(refreshButton);
    }
  }
  
  // If the input already has a value, process it
  if (imageUrlInput.value) {
    processImageUrl(imageUrlInput.value);
  }
}

// Process image URL for preview
function processImageUrl(url) {
  console.log('Processing image URL:', url);
  
  // Get preview elements
  const previewImg = document.getElementById('imagePreview');
  const previewEmpty = document.getElementById('imagePreviewEmpty');
  const previewError = document.getElementById('imagePreviewError');
  const previewLoading = document.getElementById('imagePreviewLoading');
  
  if (!previewImg || !previewEmpty || !previewError || !previewLoading) {
    console.error('Preview elements not found');
    return;
  }
  
  // Hide all preview states
  previewImg.classList.add('hidden');
  previewEmpty.classList.add('hidden');
  previewError.classList.add('hidden');
  previewLoading.classList.add('hidden');
  
  // Show empty state if URL is empty
  if (!url || url.trim() === '') {
    previewEmpty.classList.remove('hidden');
    return;
  }
  
  // Show loading state
  previewLoading.classList.remove('hidden');
  
  // Process the URL
  let processedUrl = url;
  
  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1] || fileIdMatch[2];
      processedUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
      console.log('Processed Google Drive URL:', processedUrl);
    }
  }
  
  // Create a new image to test if the URL is valid
  const testImage = new Image();
  
  // Set up error handling for the test image
  testImage.onerror = function() {
    console.error('Error loading image preview:', processedUrl);
    previewLoading.classList.add('hidden');
    previewError.classList.remove('hidden');
    
    // Show the error URL for debugging
    const errorUrlDisplay = document.createElement('div');
    errorUrlDisplay.className = 'text-xs text-red-500 mt-2 break-all';
    errorUrlDisplay.textContent = `Failed URL: ${processedUrl}`;
    previewError.innerHTML = '';
    previewError.appendChild(errorUrlDisplay);
    
    // Add a direct image link for manual checking
    const directLink = document.createElement('a');
    directLink.href = processedUrl;
    directLink.target = '_blank';
    directLink.className = 'text-blue-500 text-xs block mt-2';
    directLink.textContent = 'Open image URL directly';
    previewError.appendChild(directLink);
    
    // Try alternative formats for Google Drive
    if (url.includes('drive.google.com')) {
      tryAlternativeGoogleDriveFormats(url, (workingUrl) => {
        if (workingUrl) {
          // Update the input with the working URL
          const imageUrlInput = document.getElementById('imageUrl');
          if (imageUrlInput) {
            imageUrlInput.value = workingUrl;
            processImageUrl(workingUrl);
          }
        }
      });
    }
  };
  
  // Set up success handling for the test image
  testImage.onload = function() {
    previewLoading.classList.add('hidden');
    previewImg.src = processedUrl;
    previewImg.classList.remove('hidden');
    console.log('Image preview loaded successfully');
  };
  
  // Set the source to start loading
  testImage.src = processedUrl;
}

// Try alternative Google Drive URL formats
function tryAlternativeGoogleDriveFormats(url, callback) {
  const formatTemplates = [
    'https://drive.google.com/uc?export=view&id={fileId}',
    'https://drive.google.com/thumbnail?id={fileId}',
    'https://drive.usercontent.google.com/download?id={fileId}&export=view',
    'https://drive.usercontent.google.com/uc?id={fileId}',
    'https://lh3.googleusercontent.com/d/{fileId}'
  ];
  
  // Extract file ID
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
  if (!fileIdMatch) {
    callback(null);
    return;
  }
  
  const fileId = fileIdMatch[1] || fileIdMatch[2];
  let attemptIndex = 0;
  
  function tryNextFormat() {
    if (attemptIndex >= formatTemplates.length) {
      callback(null);
      return;
    }
    
    const formatUrl = formatTemplates[attemptIndex].replace('{fileId}', fileId);
    attemptIndex++;
    
    const testImage = new Image();
    testImage.onload = function() {
      callback(formatUrl);
    };
    
    testImage.onerror = function() {
      tryNextFormat();
    };
    
    testImage.src = formatUrl;
  }
  
  tryNextFormat();
}

// Fix the frontend carousel to use fallback images if needed
function fixFrontendCarousel() {
  console.log('Fixing frontend carousel');
  
  // Check if we have a magical journeys carousel
  const magicalCarousel = document.querySelector('.swiper-magical');
  if (!magicalCarousel) return;
  
  // Get all slides
  const slides = magicalCarousel.querySelectorAll('.swiper-slide img');
  if (!slides.length) return;
  
  // Check each slide and fix broken images
  slides.forEach((img, index) => {
    // Add error handling to each image
    img.onerror = function() {
      console.log('Image failed to load, using fallback:', img.src);
      
      // Use a placeholder image instead
      this.src = `https://picsum.photos/800/400?random=${index+1}`;
      
      // Add a class so we know this is a fallback
      this.classList.add('fallback-image');
    };
    
    // Force reload the image to trigger error handling if needed
    const originalSrc = img.src;
    img.src = '';
    img.src = originalSrc;
  });
  
  // Ensure Swiper is initialized
  if (typeof Swiper !== 'undefined' && typeof window.initializeSwiperCarousels === 'function') {
    window.initializeSwiperCarousels();
  }
}

// Add a test mode button to the admin panel
function addTestModeButton() {
  // Check if we're on the admin page
  if (!window.location.pathname.includes('admin.html')) return;
  
  const adminHeader = document.querySelector('h1');
  if (!adminHeader) return;
  
  const testModeBtn = document.createElement('button');
  testModeBtn.textContent = 'Test Carousel Mode';
  testModeBtn.className = 'bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded ml-4 text-sm';
  testModeBtn.onclick = function() {
    toggleTestMode();
  };
  
  adminHeader.appendChild(testModeBtn);
}

// Toggle test mode for the carousel
function toggleTestMode() {
  // Create a test carousel in a modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Carousel Preview</h3>
        <button id="closeModalBtn" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-2">This is how your carousel will appear on the frontend:</p>
      </div>
      
      <div class="swiper swiper-test">
        <div class="swiper-wrapper" id="testSwiperWrapper">
          <!-- Will be filled dynamically -->
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
      </div>
      
      <div class="mt-4 text-center">
        <button id="loadFromFirebaseBtn" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mr-2">
          Load from Firebase
        </button>
        <button id="usePlaceholdersBtn" class="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded">
          Use Placeholders
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Style the test swiper
  const style = document.createElement('style');
  style.textContent = `
    .swiper-test {
      height: 400px;
      border-radius: 8px;
      overflow: hidden;
    }
    .swiper-test .swiper-slide img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;
  document.head.appendChild(style);
  
  // Add event listeners
  document.getElementById('closeModalBtn').addEventListener('click', function() {
    modal.remove();
    style.remove();
  });
  
  document.getElementById('loadFromFirebaseBtn').addEventListener('click', function() {
    loadCarouselImagesForTest();
  });
  
  document.getElementById('usePlaceholdersBtn').addEventListener('click', function() {
    loadPlaceholderImagesForTest();
  });
  
  // Initially load placeholders
  loadPlaceholderImagesForTest();
}

// Load placeholder images for test carousel
function loadPlaceholderImagesForTest() {
  const wrapper = document.getElementById('testSwiperWrapper');
  if (!wrapper) return;
  
  wrapper.innerHTML = '';
  
  // Add 5 placeholder slides
  for (let i = 1; i <= 5; i++) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `
      <img src="https://picsum.photos/800/400?random=${i}" alt="Placeholder Image ${i}">
      <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
        <h3 class="text-white text-xl font-bold">Magical Journey ${i}</h3>
        <p class="text-white/90">This is a placeholder image</p>
      </div>
    `;
    wrapper.appendChild(slide);
  }
  
  initializeTestSwiper();
}

// Load carousel images from Firebase for test
function loadCarouselImagesForTest() {
  const wrapper = document.getElementById('testSwiperWrapper');
  if (!wrapper) return;
  
  wrapper.innerHTML = `
    <div class="swiper-slide">
      <div class="flex items-center justify-center h-full bg-gray-100">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
          <p class="text-gray-600">Loading images from Firebase...</p>
        </div>
      </div>
    </div>
  `;
  
  // Check if we have Firebase
  if (typeof firebase === 'undefined' || !firebase.database) {
    wrapper.innerHTML = `
      <div class="swiper-slide">
        <div class="flex items-center justify-center h-full bg-gray-100">
          <div class="text-center">
            <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
            <p class="text-gray-600">Firebase not available</p>
          </div>
        </div>
      </div>
    `;
    initializeTestSwiper();
    return;
  }
  
  // Load images from Firebase
  const db = firebase.database();
  db.ref('carouselImages').orderByChild('order').once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        // Get all images
        const images = [];
        snapshot.forEach(child => {
          images.push({
            id: child.key,
            ...child.val()
          });
        });
        
        // Sort by order
        images.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Clear loading indicator
        wrapper.innerHTML = '';
        
        // Add slides
        images.forEach(image => {
          const slide = document.createElement('div');
          slide.className = 'swiper-slide';
          slide.innerHTML = `
            <img src="${image.url}" alt="${image.title}" onerror="this.src='https://picsum.photos/800/400?random=${Math.floor(Math.random() * 100)}'; this.classList.add('fallback-image');">
            <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
              <h3 class="text-white text-xl font-bold">${image.title}</h3>
              <p class="text-white/90">${image.description || ''}</p>
            </div>
          `;
          wrapper.appendChild(slide);
        });
      } else {
        // No images
        wrapper.innerHTML = `
          <div class="swiper-slide">
            <div class="flex items-center justify-center h-full bg-gray-100">
              <div class="text-center">
                <i class="fas fa-info-circle text-4xl text-blue-500 mb-4"></i>
                <p class="text-gray-600">No carousel images found in Firebase</p>
              </div>
            </div>
          </div>
        `;
      }
      
      initializeTestSwiper();
    })
    .catch(error => {
      console.error('Error loading carousel images:', error);
      wrapper.innerHTML = `
        <div class="swiper-slide">
          <div class="flex items-center justify-center h-full bg-gray-100">
            <div class="text-center">
              <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <p class="text-gray-600">Error loading images: ${error.message}</p>
            </div>
          </div>
        </div>
      `;
      initializeTestSwiper();
    });
}

// Initialize the test swiper
function initializeTestSwiper() {
  if (typeof Swiper !== 'undefined') {
    new Swiper('.swiper-test', {
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  }
} 