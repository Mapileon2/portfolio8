/**
 * AdminAuth.js - Production-ready authentication module
 * 
 * This module handles authentication state management for the admin interface
 * with proper error handling, logging, and DOM manipulation.
 */

(function(window, document) {
  'use strict';

  // Configuration
  const CONFIG = {
    loginSectionId: 'loginSection',
    adminNavSectionId: 'adminNavSection',
    adminContentSelectors: [
      '#carouselSection', '#carouselImageForm', '#carouselImagesLoading',
      '#carouselImagesEmpty', '#carouselImagesList', '#addEditImageForm',
      '#googleDriveImageForm', '#gdrivePreviewContainer', '#imagePreviewContainer',
      '#carouselImages', '#carouselImageList', '#addCarouselImageBtn',
      'div[id*="carousel"]', 'div[id*="Carousel"]',
      'div[id*="gdrive"]', 'div[id*="Gdrive"]',
      '.carousel-related', '.gdrive-related', '.admin-only',
      '#logoutBtn'
    ],
    sectionsToRemoveCompletely: [
      'Carousel Image Management',
      'Google Drive Image Uploader',
      'Magical Journeys'
    ],
    authBodyClass: 'auth-admin-content-visible',
    nonAuthBodyClass: 'auth-admin-content-hidden',
    hiddenElementClass: 'admin-hidden-section',
    visibleLoginClass: 'login-visible',
    logPrefix: '[AdminAuth]',
    checkInterval: 750, // ms
    loginReappearDelay: 250 // ms
  };

  // Logging utility
  const Logger = {
    log: (message, ...args) => console.log(`${CONFIG.logPrefix} ${message}`, ...args),
    warn: (message, ...args) => console.warn(`${CONFIG.logPrefix} ${message}`, ...args),
    error: (message, ...args) => console.error(`${CONFIG.logPrefix} ${message}`, ...args),
    info: (message, ...args) => console.info(`${CONFIG.logPrefix} ${message}`, ...args)
  };

  // DOM Manipulation Utility
  const DomUtil = {
    getElement: id => document.getElementById(id),
    getAllElements: selector => document.querySelectorAll(selector),
    hideElement: element => {
      if (!element) return;
      element.style.setProperty('display', 'none', 'important');
      element.classList.add(CONFIG.hiddenElementClass);
    },
    showElement: element => {
      if (!element) return;
      element.style.display = '';
      element.classList.remove(CONFIG.hiddenElementClass);
    },
    ensureElementVisible: element => {
      if (!element) return;
      element.style.setProperty('display', 'block', 'important');
      element.style.setProperty('opacity', '1', 'important');
      element.style.setProperty('visibility', 'visible', 'important');
      element.style.setProperty('height', 'auto', 'important');
      element.style.setProperty('overflow', 'visible', 'important');
      element.style.setProperty('pointer-events', 'auto', 'important');
      element.classList.add(CONFIG.visibleLoginClass);
    },
    removeElementsByText: (text) => {
      // Find all headings or divs containing the specified text
      const elements = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, div')].filter(el => 
        el.innerText && el.innerText.includes(text)
      );
      
      elements.forEach(element => {
        // First hide the element itself
        DomUtil.hideElement(element);
        
        // Also hide its parent container
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          // If this is a major container, hide it
          if (parent.tagName === 'SECTION' || 
              (parent.classList && 
               (parent.classList.contains('bg-white') || 
                parent.classList.contains('p-8') || 
                parent.classList.contains('mb-8') || 
                parent.classList.contains('rounded-xl')))) {
            DomUtil.hideElement(parent);
            break;
          }
          parent = parent.parentElement;
        }
        
        // Also hide any following elements until we hit another heading
        let next = element.nextElementSibling;
        while (next && !(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(next.tagName))) {
          DomUtil.hideElement(next);
          next = next.nextElementSibling;
        }
      });
    }
  };

  // Auth State Management
  const AuthStateManager = {
    // Check if user is logged in
    isUserLoggedIn: () => {
      try {
        return window.firebase && 
               window.firebase.auth && 
               window.firebase.auth().currentUser;
      } catch (err) {
        Logger.error('Error checking authentication state:', err);
        return false;
      }
    },

    // Update UI based on authentication state
    updateUI: function(isAuthenticated) {
      try {
        if (isAuthenticated) {
          this.showAdminContent();
        } else {
          this.hideAdminContent();
        }
      } catch (err) {
        Logger.error('Error updating UI based on authentication:', err);
        // In case of error, default to hiding admin content for security
        this.hideAdminContent();
      }
    },

    // Hide admin content and show login
    hideAdminContent: function() {
      Logger.info('Hiding admin content - user not authenticated');
      
      // Update body classes
      document.body.classList.remove(CONFIG.authBodyClass);
      document.body.classList.add(CONFIG.nonAuthBodyClass);
      
      // Get login section
      const loginSection = DomUtil.getElement(CONFIG.loginSectionId);
      
      // Hide admin nav
      const adminNav = DomUtil.getElement(CONFIG.adminNavSectionId);
      if (adminNav) DomUtil.hideElement(adminNav);
      
      // Hide all admin content
      CONFIG.adminContentSelectors.forEach(selector => {
        DomUtil.getAllElements(selector).forEach(element => {
          DomUtil.hideElement(element);
        });
      });
      
      // Remove sections completely by text content
      CONFIG.sectionsToRemoveCompletely.forEach(text => {
        DomUtil.removeElementsByText(text);
      });
      
      // Show login section with proper styling
      if (loginSection) {
        DomUtil.ensureElementVisible(loginSection);
        
        // Make sure form inputs are visible
        const loginInputs = loginSection.querySelectorAll('input, button');
        loginInputs.forEach(input => {
          input.style.setProperty('display', 'block', 'important');
          input.style.setProperty('width', '100%', 'important');
          input.style.removeProperty('visibility');
          input.style.removeProperty('opacity');
        });
      }
    },

    // Show admin content and hide login
    showAdminContent: function() {
      Logger.info('Showing admin content - user authenticated');
      
      // Update body classes
      document.body.classList.remove(CONFIG.nonAuthBodyClass);
      document.body.classList.add(CONFIG.authBodyClass);
      
      // Hide login section
      const loginSection = DomUtil.getElement(CONFIG.loginSectionId);
      if (loginSection) DomUtil.hideElement(loginSection);
      
      // Show admin nav
      const adminNav = DomUtil.getElement(CONFIG.adminNavSectionId);
      if (adminNav) DomUtil.showElement(adminNav);
      
      // Show all previously hidden admin content
      document.querySelectorAll(`.${CONFIG.hiddenElementClass}`).forEach(element => {
        DomUtil.showElement(element);
      });
      
      // Show specific admin content
      CONFIG.adminContentSelectors.forEach(selector => {
        DomUtil.getAllElements(selector).forEach(element => {
          DomUtil.showElement(element);
        });
      });
    }
  };

  // Auth event listeners
  const AuthEvents = {
    setupAuthListeners: function() {
      // Firebase auth state change listener
      if (window.firebase && window.firebase.auth) {
        window.firebase.auth().onAuthStateChanged(user => {
          AuthStateManager.updateUI(!!user);
        });
      }
      
      // Login button click handler
      document.addEventListener('DOMContentLoaded', () => {
        const loginBtn = DomUtil.getElement('loginBtn');
        if (loginBtn) {
          loginBtn.addEventListener('click', this.handleLoginClick);
        }
        
        // Logout button click handler
        const logoutBtn = DomUtil.getElement('logoutBtn');
        if (logoutBtn && window.firebase && window.firebase.auth) {
          logoutBtn.addEventListener('click', () => {
            window.firebase.auth().signOut()
              .then(() => {
                Logger.info('User signed out');
                AuthStateManager.hideAdminContent();
              })
              .catch(err => Logger.error('Sign out error:', err));
          });
        }
      });
    },
    
    handleLoginClick: function(event) {
      event.preventDefault();
      const emailInput = DomUtil.getElement('email');
      const passwordInput = DomUtil.getElement('password');
      
      if (!emailInput || !passwordInput) {
        Logger.error('Email or password input not found');
        return;
      }
      
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      if (!email || !password) {
        alert('Please enter both email and password.');
        return;
      }
      
      if (window.firebase && window.firebase.auth) {
        // Show loading state
        const loginBtn = event.target;
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginBtn.disabled = true;
        
        window.firebase.auth().signInWithEmailAndPassword(email, password)
          .then(userCredential => {
            Logger.info('Login successful');
            AuthStateManager.showAdminContent();
          })
          .catch(error => {
            Logger.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
          })
          .finally(() => {
            // Restore button state
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
          });
      } else {
        Logger.error('Firebase auth not available');
        alert('Authentication service is not available. Please try again later.');
      }
    }
  };

  // DOM observer to catch dynamically added content
  const DomObserver = {
    setupObserver: function() {
      // Create a mutation observer to watch for DOM changes
      const observer = new MutationObserver(mutations => {
        if (!AuthStateManager.isUserLoggedIn()) {
          AuthStateManager.hideAdminContent();
          
          // Re-ensure login is visible after a short delay
          setTimeout(() => {
            const loginSection = DomUtil.getElement(CONFIG.loginSectionId);
            if (loginSection) DomUtil.ensureElementVisible(loginSection);
          }, CONFIG.loginReappearDelay);
        }
      });
      
      // Observe the body for changes
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      Logger.info('DOM observer initialized');
    }
  };

  // Periodic check for auth state and UI consistency
  const PeriodicCheck = {
    startChecking: function() {
      setInterval(() => {
        const isLoggedIn = AuthStateManager.isUserLoggedIn();
        
        // Check if the UI state matches the authentication state
        const loginVisible = DomUtil.getElement(CONFIG.loginSectionId)?.style.display !== 'none';
        const adminNavVisible = DomUtil.getElement(CONFIG.adminNavSectionId)?.style.display !== 'none';
        
        // If there's a mismatch, update the UI
        if ((isLoggedIn && loginVisible) || (!isLoggedIn && adminNavVisible)) {
          Logger.warn('UI state mismatch detected, correcting...');
          AuthStateManager.updateUI(isLoggedIn);
        }
      }, CONFIG.checkInterval);
      
      Logger.info('Periodic auth check initialized');
    }
  };

  // Initialize the module
  const init = function() {
    try {
      Logger.info('Initializing admin authentication module');
      
      // Initial UI update based on current auth state
      const isLoggedIn = AuthStateManager.isUserLoggedIn();
      AuthStateManager.updateUI(isLoggedIn);
      
      // Setup event listeners
      AuthEvents.setupAuthListeners();
      
      // Setup DOM observer
      DomObserver.setupObserver();
      
      // Start periodic checks
      PeriodicCheck.startChecking();
      
      Logger.info('Admin authentication module initialized successfully');
    } catch (err) {
      Logger.error('Failed to initialize admin authentication module:', err);
      
      // In case of initialization failure, ensure admin content is hidden
      try {
        AuthStateManager.hideAdminContent();
      } catch (e) {
        Logger.error('Critical failure in fallback security measure:', e);
      }
    }
  };

  // Run initialization as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded, run immediately
    init();
  }

  // Also run immediately as a backup
  init();

})(window, document); 