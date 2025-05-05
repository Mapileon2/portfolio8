/**
 * CarouselManager - Production-ready carousel implementation
 * 
 * This module handles image loading, storage, and display for the portfolio carousel
 * with proper error handling, performance optimization, and fallbacks.
 */

(function(window, document) {
  'use strict';

  // Configuration
  const CONFIG = {
    carouselSelector: '.swiper-magical',
    slideContainer: '.swiper-wrapper',
    localStorageKey: 'portfolioCarouselImages',
    maxLocalStorageImages: 20,
    logPrefix: '[CarouselManager]',
    imagePath: 'images/Image carousel/',
    defaultImages: [
      { title: "", description: "", url: "IMG_20220904_104615.jpg", order: 1 },
      { title: "", description: "", url: "IMG_1078.jpg", order: 2 },
      { title: "", description: "", url: "1.jpg", order: 3 },
      { title: "", description: "", url: "2.jpg", order: 4 },
      { title: "", description: "", url: "3.jpg", order: 5 },
      { title: "", description: "", url: "4.jpg", order: 6 },
      { title: "", description: "", url: "5.jpg", order: 7 },
      { title: "", description: "", url: "6.jpg", order: 8 }
    ],
    placeholderService: 'https://picsum.photos/800/400?random=',
    textCaptionClass: 'carousel-caption',
    prefetchCount: 3,
    retryAttempts: 2,
    initialDelay: 100
  };

  // Logging utility
  const Logger = {
    log: (message, ...args) => console.log(`${CONFIG.logPrefix} ${message}`, ...args),
    warn: (message, ...args) => console.warn(`${CONFIG.logPrefix} ${message}`, ...args),
    error: (message, ...args) => console.error(`${CONFIG.logPrefix} ${message}`, ...args),
    info: (message, ...args) => console.info(`${CONFIG.logPrefix} ${message}`, ...args)
  };

  // DOM helper functions
  const DomUtil = {
    findElement: selector => document.querySelector(selector),
    findElements: selector => document.querySelectorAll(selector),
    createElement: (tag, className, content) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (content) element.innerHTML = content;
      return element;
    },
    appendToParent: (parent, element) => {
      if (parent && element) {
        parent.appendChild(element);
        return element;
      }
      return null;
    },
    removeElement: element => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
        return true;
      }
      return false;
    },
    hideElement: element => {
      if (element) element.style.display = 'none';
    }
  };

  // Storage utilities
  const StorageUtil = {
    saveImagesToLocalStorage: images => {
      try {
        // Limit storage to prevent exceeding quota
        const trimmedImages = images.slice(0, CONFIG.maxLocalStorageImages);
        localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(trimmedImages));
        return true;
      } catch (err) {
        Logger.error('Failed to save images to localStorage:', err);
        return false;
      }
    },
    getImagesFromLocalStorage: () => {
      try {
        const data = localStorage.getItem(CONFIG.localStorageKey);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        Logger.error('Failed to retrieve images from localStorage:', err);
        return null;
      }
    },
    clearImageStorage: () => {
      try {
        localStorage.removeItem(CONFIG.localStorageKey);
        return true;
      } catch (err) {
        Logger.error('Failed to clear localStorage:', err);
        return false;
      }
    }
  };

  // Image loading utilities
  const ImageUtil = {
    preloadImage: (src, onSuccess, onError) => {
      const img = new Image();
      img.onload = () => onSuccess && onSuccess(img);
      img.onerror = error => onError && onError(error);
      img.src = src;
    },
    generateFallbackUrl: index => `${CONFIG.placeholderService}${index}`,
    getFullImagePath: imageUrl => {
      // Check if the URL already has the path prefix
      if (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
        return imageUrl;
      }
      
      // Check if it already has the image path
      if (imageUrl.startsWith(CONFIG.imagePath)) {
        return imageUrl;
      }
      
      // Add the image path
      return CONFIG.imagePath + imageUrl;
    },
    batchPreload: (images, onComplete) => {
      let loaded = 0;
      const total = Math.min(images.length, CONFIG.prefetchCount);
      const results = [];
      
      if (total === 0) {
        onComplete && onComplete(results);
        return;
      }
      
      images.slice(0, CONFIG.prefetchCount).forEach((image, index) => {
        const fullPath = ImageUtil.getFullImagePath(image.url);
        
        ImageUtil.preloadImage(
          fullPath,
          img => {
            results.push({ success: true, index, image, img });
            checkComplete();
          },
          err => {
            results.push({ success: false, index, image, error: err });
            checkComplete();
          }
        );
      });
      
      function checkComplete() {
        loaded++;
        if (loaded >= total) {
          onComplete && onComplete(results);
        }
      }
    }
  };

  // Carousel manager
  const CarouselManager = {
    /**
     * Initialize the carousel with local images
     */
    init: function() {
      try {
        Logger.info('Initializing carousel manager');
        
        setTimeout(() => this.loadCarousel(), CONFIG.initialDelay);
      } catch (err) {
        Logger.error('Failed to initialize carousel:', err);
        this.handleInitError();
      }
    },
    
    /**
     * Main method to load the carousel with images
     */
    loadCarousel: function() {
      // Find the carousel element
      const carousel = DomUtil.findElement(CONFIG.carouselSelector);
      
      if (!carousel) {
        Logger.warn('Carousel element not found, exiting');
        return;
      }
      
      Logger.info('Found carousel, loading images');
      
      // Try to get images from localStorage first
      let images = StorageUtil.getImagesFromLocalStorage();
      
      // If no stored images, use default set
      if (!images || !Array.isArray(images) || images.length === 0) {
        Logger.info('No images in localStorage, using default set');
        images = CONFIG.defaultImages;
        
        // Store default images
        StorageUtil.saveImagesToLocalStorage(images);
      }
      
      // Sort images by order field
      images.sort((a, b) => (a.order || 99) - (b.order || 99));
      
      // Clear existing slides if any
      this.clearCarousel(carousel);
      
      // Create slides
      this.createSlides(carousel, images);
      
      // Optionally preload remaining images in background
      if (images.length > CONFIG.prefetchCount) {
        setTimeout(() => {
          ImageUtil.batchPreload(
            images.slice(CONFIG.prefetchCount),
            results => Logger.info(`Background preload complete: ${results.filter(r => r.success).length}/${results.length} successful`)
          );
        }, 1000);
      }
    },
    
    /**
     * Clear existing slides from carousel
     */
    clearCarousel: function(carousel) {
      const slideContainer = carousel.querySelector(CONFIG.slideContainer);
      
      if (slideContainer) {
        // Reset the wrapper
        slideContainer.innerHTML = '';
      }
    },
    
    /**
     * Create and append slides to the carousel
     */
    createSlides: function(carousel, images) {
      const slideContainer = carousel.querySelector(CONFIG.slideContainer);
      
      if (!slideContainer) {
        Logger.error('Slide container not found');
        return;
      }
      
      // Create each slide
      images.forEach((image, index) => {
        const slide = this.createSlide(image, index);
        DomUtil.appendToParent(slideContainer, slide);
      });
      
      Logger.info(`Added ${images.length} slides to carousel`);
      
      // Re-initialize Swiper if available
      this.reinitializeSwiper(carousel);
    },
    
    /**
     * Create a single slide element
     */
    createSlide: function(image, index) {
      // Create the main slide div
      const slide = DomUtil.createElement('div', 'swiper-slide');
      
      // Create and append image
      const imgSrc = ImageUtil.getFullImagePath(image.url);
      const img = DomUtil.createElement('img');
      img.src = imgSrc;
      img.alt = image.title || `Portfolio Image ${index + 1}`;
      
      // Set up error handling for image
      img.onerror = function() {
        // Apply fallback image if loading fails
        const fallbackUrl = ImageUtil.generateFallbackUrl(index + 1);
        Logger.warn(`Image load failed for "${imgSrc}", using fallback: ${fallbackUrl}`);
        this.src = fallbackUrl;
        this.classList.add('fallback-image');
      };
      
      DomUtil.appendToParent(slide, img);
      
      // Skip caption if no title or description
      if (image.title || image.description) {
        // Create caption container
        const caption = DomUtil.createElement('div', 'absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent');
        caption.classList.add(CONFIG.textCaptionClass);
        
        // Add title if available
        if (image.title) {
          const title = DomUtil.createElement('h3', 'text-white text-2xl font-bold ghibli-font', image.title);
          DomUtil.appendToParent(caption, title);
        }
        
        // Add description if available
        if (image.description) {
          const desc = DomUtil.createElement('p', 'text-white/90', image.description);
          DomUtil.appendToParent(caption, desc);
        }
        
        DomUtil.appendToParent(slide, caption);
      }
      
      return slide;
    },
    
    /**
     * Re-initialize Swiper if it's available
     */
    reinitializeSwiper: function(carousel) {
      // Check if Swiper is available in the global scope
      if (typeof Swiper !== 'undefined' && carousel.swiper) {
        try {
          // Update Swiper instance
          carousel.swiper.update();
          Logger.info('Swiper instance updated');
        } catch (err) {
          Logger.warn('Failed to update Swiper instance:', err);
          
          // Try to re-initialize
          try {
            new Swiper(carousel, carousel.swiperOptions || {});
            Logger.info('Swiper re-initialized');
          } catch (err2) {
            Logger.error('Failed to re-initialize Swiper:', err2);
          }
        }
      } else {
        Logger.info('Swiper not available or not initialized on this carousel');
      }
    },
    
    /**
     * Hide all text captions from carousel slides
     */
    hideAllCaptions: function() {
      const captions = DomUtil.findElements(`.${CONFIG.textCaptionClass}`);
      
      captions.forEach(caption => {
        DomUtil.hideElement(caption);
      });
      
      Logger.info(`Hidden ${captions.length} captions`);
    },
    
    /**
     * Handle initialization errors
     */
    handleInitError: function() {
      // Try to recover by clearing storage and reloading with defaults
      StorageUtil.clearImageStorage();
      
      // Wait for next frame and try again
      setTimeout(() => {
        try {
          this.loadCarousel();
        } catch (err) {
          Logger.error('Recovery failed, carousel may not function properly:', err);
        }
      }, 500);
    }
  };

  // Public API
  window.PortfolioCarousel = {
    init: () => CarouselManager.init(),
    reload: () => CarouselManager.loadCarousel(),
    hideCaptions: () => CarouselManager.hideAllCaptions(),
    clearStorage: () => StorageUtil.clearImageStorage()
  };

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      CarouselManager.init();
      // Hide captions by default
      CarouselManager.hideAllCaptions();
    });
  } else {
    // DOM already loaded
    CarouselManager.init();
    // Hide captions by default
    CarouselManager.hideAllCaptions();
  }

})(window, document);

// Legacy function name for backward compatibility
function fixCarouselDirectly() {
  if (window.PortfolioCarousel) {
    window.PortfolioCarousel.reload();
  }
} 