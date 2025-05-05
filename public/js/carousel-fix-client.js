/**
 * Client-side Carousel Fix
 * Makes carousel images more user-friendly by prioritizing localStorage
 * when Firebase auth fails
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the page to fully load
  setTimeout(function() {
    console.log('Initializing client-side carousel fix - Firebase Hosting Version');
    
    // Check if we're on the homepage with the magical journeys carousel
    const magicalJourneysCarousel = document.querySelector('.swiper-magical');
    if (!magicalJourneysCarousel) {
      console.log('No magical journeys carousel found on this page');
      return;
    }
    
    // Get images from localStorage
    const localImages = JSON.parse(localStorage.getItem('carouselImages') || '[]');
    console.log(`Checking localStorage for images: Found ${localImages.length} images`);
    
    if (localImages.length > 0) {
      console.log(`Using ${localImages.length} images from localStorage`);
      updateCarouselWithLocalImages(localImages, magicalJourneysCarousel);
    } else {
      console.log('No images found in localStorage');
      
      // Set up Firebase authentication and error monitoring
      monitorFirebaseErrors();
      
      // Apply fallback to existing images
      applyFallbackToExistingImages(magicalJourneysCarousel);
    }

    // Apply PowerPoint-like display settings to all images
    applyPowerPointStyleToImages(magicalJourneysCarousel);
    
    // Pre-load images to minimize flickering
    preloadCarouselImages(magicalJourneysCarousel);
    
    // Handle window resize events to adjust slide heights
    window.addEventListener('resize', function() {
      // Throttle resize calculations for better performance
      if (window.resizeTimeout) clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(function() {
        adjustSlideHeights(magicalJourneysCarousel);
      }, 200);
    });
    
    // Initial height adjustment after images load
    setTimeout(function() {
      adjustSlideHeights(magicalJourneysCarousel);
    }, 1000);
  }, 300);
});

// Pre-load all carousel images to minimize flickering during transitions
function preloadCarouselImages(carousel) {
  const slides = carousel.querySelectorAll('.swiper-slide');
  const imagesToPreload = [];
  
  slides.forEach(slide => {
    const img = slide.querySelector('img');
    if (img && img.src && !img.complete) {
      imagesToPreload.push(img.src);
    }
  });
  
  if (imagesToPreload.length > 0) {
    console.log(`Preloading ${imagesToPreload.length} carousel images`);
    imagesToPreload.forEach(src => {
      const preloadImg = new Image();
      preloadImg.src = src;
    });
  }
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
      
      // Use a meaningful fallback with index
      this.src = `https://picsum.photos/800/400?random=${index+1}`;
      
      // Add a better caption when using placeholder
      const caption = slide.querySelector('.absolute');
      if (caption) {
        // Add a note about local setup
        const currentTitle = caption.querySelector('h3');
        const currentDesc = caption.querySelector('p');
        if (currentTitle) currentTitle.textContent = `Journey Image ${index+1}`;
        if (currentDesc) currentDesc.textContent = 'Add your own images in Admin Panel';
      }
    };
    
    // Prevent flickering during image load
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.5s ease-in-out';
    
    // Trigger src reload to apply our handler
    const currentSrc = img.getAttribute('src');
    img.setAttribute('src', currentSrc);
    
    // Add load event to adjust heights and fade in image smoothly
    img.addEventListener('load', function() {
      adjustSlideHeights(carousel);
      // Fade in the image smoothly after it's loaded
      setTimeout(() => {
        img.style.opacity = '1';
      }, 50);
    });
  });
}

// New function to apply PowerPoint-like display to all carousel images
function applyPowerPointStyleToImages(carousel) {
  // Find all slides and images in the carousel
  const slides = carousel.querySelectorAll('.swiper-slide');
  
  slides.forEach((slide, index) => {
    // Add PowerPoint-like style classes
    slide.classList.add('powerpoint-slide');
    
    // Find the image in this slide
    const img = slide.querySelector('img');
    if (!img) return;
    
    // Apply PowerPoint-like styling to image
    img.classList.add('adaptive-carousel-image');
    img.style.objectFit = 'contain';
    img.style.maxHeight = '100%';
    img.style.maxWidth = '100%';
    img.style.margin = '0 auto';
    
    // Create/modify background container for better PowerPoint-like look
    if (!slide.classList.contains('powerpoint-container')) {
      // Only create a background container if one doesn't exist
      slide.style.backgroundColor = 'rgba(0, 0, 0, 0.03)'; // Subtle background
      slide.style.display = 'flex';
      slide.style.alignItems = 'center';
      slide.style.justifyContent = 'center';
      slide.style.overflow = 'hidden';
      slide.classList.add('powerpoint-container');
    }
    
    // Improve captions
    const caption = slide.querySelector('.absolute');
    if (caption) {
      caption.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%)';
      caption.style.padding = '15px 10px 10px';
    }
    
    // Add load event to adjust heights when this image loads
    img.addEventListener('load', function() {
      adjustSlideHeights(carousel);
    });
  });
  
  // Update Swiper initialization if needed
  if (carousel.swiper) {
    // Override some Swiper settings
    const swiper = carousel.swiper;
    
    // Update effect to be more PowerPoint-like (smoother transitions)
    if (swiper.params) {
      // Modify effect for smoother transitions with no flickering
      console.log('Updating swiper presentation style');
      
      // Don't change the effect - keep the current one (likely "slide")
      // swiper.params.effect = 'fade';
      
      // Don't add crossFade which prevents sliding
      // swiper.params.fadeEffect = {
      //   crossFade: true
      // };
      
      // Keep a responsive speed
      // swiper.params.speed = 1000;
      
      // Disable CSS mode which can cause flickering
      swiper.params.cssMode = false;
      
      // Improve virtual slides rendering
      swiper.params.virtual = {
        enabled: false
      };
      
      // Ensure loop is enabled for continuous scrolling
      swiper.params.loop = true;
      
      // Enable grabCursor for better UX
      swiper.params.grabCursor = true;
      
      // Make sure preventInteractionOnTransition is false to allow dragging
      swiper.params.preventInteractionOnTransition = false;
      
      // Apply changes
      swiper.update();
    }
  } else {
    console.log('Swiper instance not found, will apply styles only');
  }
}

// New function to adjust slide heights to prevent empty spaces
function adjustSlideHeights(carousel) {
  console.log('Adjusting slide heights for PowerPoint-like display');
  
  // Find all slides
  const slides = carousel.querySelectorAll('.swiper-slide');
  if (!slides.length) return;
  
  // Calculate optimal height based on viewport and available space
  const viewportHeight = window.innerHeight;
  const carouselRect = carousel.getBoundingClientRect();
  const availableHeight = Math.min(viewportHeight * 0.7, 500); // 70% of viewport height, max 500px
  
  // Find any fully loaded images to determine best aspect ratio
  let maxImageHeight = 0;
  let maxImageWidth = 0;
  let loadedImagesCount = 0;
  
  slides.forEach(slide => {
    const img = slide.querySelector('img');
    if (img && img.complete && img.naturalHeight > 0) {
      loadedImagesCount++;
      maxImageHeight = Math.max(maxImageHeight, img.naturalHeight);
      maxImageWidth = Math.max(maxImageWidth, img.naturalWidth);
    }
  });
  
  // If we have loaded images, calculate optimal container size
  let optimalHeight = availableHeight;
  
  if (loadedImagesCount > 0) {
    // Use the aspect ratio from loaded images
    const containerWidth = carousel.clientWidth;
    const aspectRatio = maxImageWidth / maxImageHeight || 16/9; // Use 16:9 as fallback ratio
    
    // Calculate height based on width and aspect ratio
    const calculatedHeight = containerWidth / aspectRatio;
    
    // Use the calculated height, but within reasonable bounds
    optimalHeight = Math.min(Math.max(calculatedHeight, 300), availableHeight);
    console.log(`Calculated optimal height: ${optimalHeight}px based on ${loadedImagesCount} loaded images`);
  } else {
    console.log('No loaded images found, using default height');
    // Use a reasonable default height when no images are loaded yet
    optimalHeight = Math.min(carousel.clientWidth * 0.5, availableHeight);
  }
  
  // Apply fixed height to carousel container to prevent jumping
  carousel.style.height = `${optimalHeight}px`;
  
  // Apply the calculated height to all slides for consistency
  slides.forEach(slide => {
    slide.style.height = `${optimalHeight}px`;
  });
  
  // Update Swiper instance to reflect the new heights
  if (carousel.swiper) {
    // Important: Prevent layout shifts during update
    const scrollY = window.scrollY;
    carousel.swiper.update();
    window.scrollTo(window.scrollX, scrollY);
  }
  
  // Also update the carousel container height if needed
  const swiperWrapper = carousel.querySelector('.swiper-wrapper');
  if (swiperWrapper) {
    swiperWrapper.style.height = `${optimalHeight}px`;
  }
  
  return optimalHeight;
}

// Monitor for Firebase auth errors and show warning
function monitorFirebaseErrors() {
  if (typeof firebase !== 'undefined') {
    // Check if Firebase has already errored
    const originalConsoleError = console.error;
    console.error = function(msg) {
      originalConsoleError.apply(console, arguments);
      
      // Look for Firebase auth errors
      if (typeof msg === 'string' && 
         (msg.includes('Firebase') || msg.includes('invalid_grant'))) {
        displayFirebaseWarning();
      }
    };
    
    // Also listen for auth state changes
    try {
      firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
          console.log('Firebase user not authenticated');
        }
      });
    } catch (e) {
      console.log('Firebase auth monitoring error:', e);
    }
  }
}

// Display a user-friendly warning when Firebase fails
function displayFirebaseWarning() {
  // Only show this once
  if (document.getElementById('firebase-warning')) return;
  
  const warningEl = document.createElement('div');
  warningEl.id = 'firebase-warning';
  warningEl.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-amber-50 text-amber-800 px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
  warningEl.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-exclamation-triangle mr-2"></i>
      <span>Using locally saved images. Visit admin panel to add more.</span>
      <button class="ml-3 text-amber-700 hover:text-amber-900 focus:outline-none" id="close-firebase-warning">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(warningEl);
  
  // Add close button handler
  document.getElementById('close-firebase-warning').addEventListener('click', function() {
    warningEl.remove();
  });
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (warningEl.parentNode) {
      warningEl.classList.add('opacity-0');
      warningEl.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => warningEl.remove(), 500);
    }
  }, 5000);
}

// Update the carousel with images from localStorage
function updateCarouselWithLocalImages(localImages, carousel) {
  // Sort the images by order
  localImages.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Get all slides
  const slides = carousel.querySelectorAll('.swiper-slide');
  
  // Update slides with local images
  localImages.forEach((image, index) => {
    if (index < slides.length) {
      const slide = slides[index];
      const img = slide.querySelector('img');
      const caption = slide.querySelector('.absolute');
      
      if (img) {
        // Add PowerPoint-style adaptive classes
        img.classList.add('adaptive-carousel-image');
        
        // Set the image source and add a fallback
        img.src = image.url;
        img.setAttribute('alt', image.title);
        img.onerror = function() {
          console.log(`Local image #${index} failed to load:`, image.url);
          this.src = `https://picsum.photos/800/400?random=${index+1}`;
          // Apply PowerPoint style after fallback loads
          this.onload = function() {
            this.style.objectFit = 'contain';
            adjustSlideHeights(carousel);
          };
        };
        
        // On image load, adjust heights
        img.onload = function() {
          adjustSlideHeights(carousel);
        };
        
        // Ensure PowerPoint-like display
        img.style.objectFit = 'contain';
      }
      
      if (caption) {
        // Update caption with data from localStorage
        const titleEl = caption.querySelector('h3');
        const descEl = caption.querySelector('p');
        
        if (titleEl) titleEl.textContent = image.title || `Journey Image ${index+1}`;
        if (descEl) descEl.textContent = image.description || 'Description not available';
        
        // Ensure caption has PowerPoint-like styling
        caption.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%)';
      }
    }
  });
  
  // For any remaining slides (if any), update them with better placeholders
  for (let i = localImages.length; i < slides.length; i++) {
    const slide = slides[i];
    const img = slide.querySelector('img');
    const caption = slide.querySelector('.absolute');
    
    if (img) {
      img.classList.add('adaptive-carousel-image');
      img.src = `https://picsum.photos/800/400?random=${i+100}`;
      img.setAttribute('alt', `Journey Image ${i+1}`);
      img.style.objectFit = 'contain';
      
      // Add load event to adjust heights when placeholder loads
      img.onload = function() {
        adjustSlideHeights(carousel);
      };
    }
    
    if (caption) {
      const titleEl = caption.querySelector('h3');
      const descEl = caption.querySelector('p');
      
      if (titleEl) titleEl.textContent = `Journey Image ${i+1}`;
      if (descEl) descEl.textContent = 'Add more images in Admin Panel';
      
      caption.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%)';
    }
  }
  
  // Apply PowerPoint styling after updating images
  applyPowerPointStyleToImages(carousel);
  
  // Initial height adjustment
  setTimeout(() => {
    adjustSlideHeights(carousel);
  }, 200);
} 