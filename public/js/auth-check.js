/**
 * Authentication Check Script
 * This script checks if user is authenticated before displaying admin content
 * It should be included on any page that might contain admin content
 */

(function() {
  // Run when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on an admin page
    const isAdminPage = window.location.pathname.includes('admin.html');
    
    // Function to hide admin content
    function hideAdminContent() {
      // Hide any admin-specific content
      const adminOnlyElements = document.querySelectorAll(
        '.admin-only, #caseStudyManager, #directCaseStudyList, ' +
        '[id*="carousel"], [id*="gdrive"], [id*="Carousel"], [id*="carousel-management"], [id*="gdrive-uploader"], ' +
        '[class*="carousel-management"], [class*="gdrive-uploader"], ' +
        '#carouselSection, #googleDriveImageForm, #carouselImageForm, ' +
        '#addCarouselImageBtn, #carouselImages, #carouselImageList'
      );
      adminOnlyElements.forEach(el => {
        el.style.display = 'none';
      });
      
      // Remove admin section headings that might have leaked
      document.querySelectorAll('h2, h3, h4').forEach(heading => {
        const text = heading.textContent || '';
        if (text.includes('Direct Case Study Management') || 
            text.includes('Delete Case Studies') ||
            text.includes('Carousel') ||
            text.includes('carousel') ||
            text.includes('Google Drive') ||
            text.includes('Image Management') ||
            text.includes('Image Upload')) {
          const parent = heading.closest('div');
          if (parent) {
            parent.style.display = 'none';
          }
        }
      });

      // Hide any buttons that trigger carousel management or uploader features
      document.querySelectorAll('button, a').forEach(el => {
        const text = (el.textContent || '').toLowerCase();
        if (text.includes('carousel') || 
            text.includes('upload') || 
            text.includes('manage images') ||
            text.includes('uploader') ||
            text.includes('add image') ||
            text.includes('clear all') ||
            text.includes('add new image')) {
          const parent = el.closest('div');
          if (parent) {
            el.style.display = 'none';
          }
        }
      });
      
      // Hide any entire forms related to image management
      document.querySelectorAll('form').forEach(form => {
        const id = form.id || '';
        if (id.includes('carousel') || 
            id.includes('image') || 
            id.includes('gdrive') || 
            id.includes('upload')) {
          form.style.display = 'none';
          
          // Also hide parent containers
          const parent = form.closest('div');
          if (parent) {
            parent.style.display = 'none';
          }
        }
      });
      
      // Remove direct script loading for gdrive-uploader and carousel management 
      if (!isAdminPage || !isLoggedIn) {
        document.querySelectorAll('script').forEach(script => {
          const src = script.getAttribute('src') || '';
          if (src.includes('gdrive-uploader') || 
              src.includes('carousel-management') ||
              src.includes('carousel-fix')) {
            // Don't remove completely to avoid page errors, just nullify it
            script.innerHTML = '/* Script disabled for non-admin users */';
          }
        });
      }
    }
    
    // Track login state
    let isLoggedIn = false;
    
    // Check auth state if Firebase is available
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(user => {
        isLoggedIn = !!user;
        
        if (!isLoggedIn) {
          // If not logged in, hide admin content
          hideAdminContent();
        }
      });
    } else {
      // If Firebase auth isn't available, hide admin content by default
      isLoggedIn = false;
      hideAdminContent();
    }
    
    // Initial hide for faster response before auth check completes
    hideAdminContent();
  });
})(); 