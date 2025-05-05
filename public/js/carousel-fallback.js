/**
 * Carousel Fallback Mechanism
 * This script provides a fallback for saving carousel images when Firebase authentication fails
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the page to fully load
  setTimeout(function() {
    // Check if we're on the admin page
    const isAdminPage = window.location.pathname.includes('admin.html');
    
    // Only apply this on the admin page
    if (isAdminPage) {
      setupCarouselFallback();
    }
  }, 1000); // Wait for other scripts to load
});

function setupCarouselFallback() {
  console.log('Setting up carousel fallback mechanisms');
  
  // Intercept the carousel form submission
  const carouselForm = document.getElementById('carouselImageForm');
  if (!carouselForm) {
    // Form might be added dynamically, so set up a mutation observer
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.id === 'carouselImageForm') {
              setupFormInterception(node);
              observer.disconnect(); // Only need to do this once
              break;
            }
          }
        }
      });
    });
    
    // Start observing the document body for dynamic changes
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    setupFormInterception(carouselForm);
  }
  
  // Also intercept the save button
  document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'saveCarouselImageBtn') {
      interceptSaveAction(event);
    }
  });
  
  // Add a local storage fallback button
  addLocalStorageUI();
}

function setupFormInterception(form) {
  console.log('Intercepting carousel form submission');
  
  // Replace the original submit event
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Try to save to Firebase first
    tryFirebaseSaveThenFallback();
  });
}

function interceptSaveAction(event) {
  console.log('Intercepting save button click');
  
  // Don't prevent default yet - let the original handler try first
  // We'll use a timeout to check if Firebase saving worked
  
  setTimeout(function() {
    // Check if we got Firebase errors in the console
    const errorIndicators = document.querySelectorAll('.firebase-error, .error-message, #notificationPopup:not(.hidden)');
    
    if (errorIndicators.length > 0) {
      console.log('Firebase errors detected, using fallback');
      saveToLocalStorage();
    }
  }, 2000); // Wait 2 seconds to see if Firebase saving worked
}

function tryFirebaseSaveThenFallback() {
  console.log('Attempting to save to Firebase with fallback');
  
  // Get the form data
  const titleInput = document.getElementById('imageTitle');
  const urlInput = document.getElementById('imageUrl');
  const descInput = document.getElementById('imageDescription');
  const orderInput = document.getElementById('imageOrder');
  
  if (!titleInput || !urlInput) {
    console.error('Required form fields not found');
    return;
  }
  
  const imageData = {
    title: titleInput.value,
    url: urlInput.value,
    description: descInput ? descInput.value : '',
    order: orderInput ? parseInt(orderInput.value) || 0 : 0,
    originalUrl: urlInput.value, // Store the original URL too
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  // First try to save to Firebase (let the original save function work)
  if (typeof saveCarouselImage === 'function') {
    try {
      saveCarouselImage();
      
      // Set a timeout to check if it worked or not
      setTimeout(function() {
        // Check for error indicators
        const errorIndicators = document.querySelectorAll('.firebase-error, .error-message, #notificationPopup:not(.hidden)');
        
        if (errorIndicators.length > 0) {
          console.log('Firebase saving failed, using local storage fallback');
          saveToLocalStorage(imageData);
        }
      }, 2000);
    } catch (error) {
      console.error('Error calling original save function:', error);
      saveToLocalStorage(imageData);
    }
  } else {
    // Original function not available, go straight to fallback
    saveToLocalStorage(imageData);
  }
}

function saveToLocalStorage(imageData) {
  if (!imageData) {
    // Get the data from the form if not provided
    const titleInput = document.getElementById('imageTitle');
    const urlInput = document.getElementById('imageUrl');
    const descInput = document.getElementById('imageDescription');
    const orderInput = document.getElementById('imageOrder');
    
    if (!titleInput || !urlInput) {
      showNotification('Error: Required form fields not found', 'error');
      return;
    }
    
    imageData = {
      title: titleInput.value,
      url: urlInput.value,
      description: descInput ? descInput.value : '',
      order: orderInput ? parseInt(orderInput.value) || 0 : 0,
      originalUrl: urlInput.value, // Store the original URL too
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  
  // Generate a unique ID
  const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Get existing carousel items from local storage
  let carouselItems = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  
  // Add the new item
  carouselItems.push({
    id: id,
    ...imageData
  });
  
  // Sort by order
  carouselItems.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Save back to local storage
  localStorage.setItem('carouselImages', JSON.stringify(carouselItems));
  
  // Show a success message
  showNotification('Image saved to local storage (Firebase unavailable)', 'success');
  
  // Update the UI to show locally saved items
  refreshLocalStorageUI();
  
  // Hide the form
  const form = document.getElementById('carouselImageForm');
  if (form) {
    form.classList.add('hidden');
  }
}

function addLocalStorageUI() {
  console.log('Adding local storage UI');
  
  // Create a container for local storage items if it doesn't exist
  let container = document.getElementById('localStorageCarousel');
  
  if (!container) {
    const carouselSection = document.getElementById('carouselSection');
    
    if (!carouselSection) {
      console.error('Carousel section not found');
      return;
    }
    
    // Create the container
    container = document.createElement('div');
    container.id = 'localStorageCarousel';
    container.className = 'mt-8 bg-yellow-50 p-6 rounded-xl shadow-lg dark:bg-yellow-900';
    container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-yellow-800 dark:text-yellow-300">Local Storage Carousel Images</h3>
        <div>
          <button id="refreshLocalStorageBtn" class="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm">
            Refresh
          </button>
          <button id="clearLocalStorageBtn" class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm ml-2">
            Clear
          </button>
        </div>
      </div>
      <p class="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
        These images are saved locally in your browser when Firebase is unavailable. They will appear in your carousel preview but won't be synchronized with the server.
      </p>
      <div id="localStorageItems" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Items will be inserted here -->
      </div>
    `;
    
    // Add it to the page after the carousel images list
    const carouselImagesList = document.getElementById('carouselImagesList');
    if (carouselImagesList) {
      carouselImagesList.parentNode.insertBefore(container, carouselImagesList.nextSibling);
    } else {
      carouselSection.appendChild(container);
    }
    
    // Add event listeners
    document.getElementById('refreshLocalStorageBtn').addEventListener('click', refreshLocalStorageUI);
    document.getElementById('clearLocalStorageBtn').addEventListener('click', clearLocalStorage);
  }
  
  // Initial refresh of the UI
  refreshLocalStorageUI();
}

function refreshLocalStorageUI() {
  const container = document.getElementById('localStorageItems');
  if (!container) return;
  
  // Get items from local storage
  const items = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
        No locally saved carousel images found
      </div>
    `;
    return;
  }
  
  // Clear the container
  container.innerHTML = '';
  
  // Add each item
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800';
    card.dataset.id = item.id;
    
    card.innerHTML = `
      <div class="h-40 bg-gray-200 dark:bg-gray-700 relative">
        <img src="${item.url}" alt="${item.title}" onerror="this.src='https://picsum.photos/300/200?random=${Math.floor(Math.random() * 100)}'; this.classList.add('fallback-image');" class="w-full h-full object-cover">
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p class="text-white text-sm font-bold">${item.title}</p>
        </div>
      </div>
      <div class="p-3">
        <p class="text-gray-500 text-xs dark:text-gray-400">Order: ${item.order || 0}</p>
        <p class="text-gray-600 text-sm mt-1 line-clamp-2 dark:text-gray-300">${item.description || ''}</p>
        <div class="flex justify-between mt-2">
          <button class="test-use-local-btn bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs">
            Test in Preview
          </button>
          <button class="delete-local-btn bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs">
            Delete
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(card);
    
    // Add event listeners
    card.querySelector('.test-use-local-btn').addEventListener('click', function() {
      testLocalItem(item);
    });
    
    card.querySelector('.delete-local-btn').addEventListener('click', function() {
      deleteLocalItem(item.id);
    });
  });
}

function clearLocalStorage() {
  if (confirm('Are you sure you want to clear all locally saved carousel images? This cannot be undone.')) {
    localStorage.removeItem('carouselImages');
    refreshLocalStorageUI();
    showNotification('Local storage cleared', 'success');
  }
}

function deleteLocalItem(id) {
  // Get items from local storage
  let items = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  
  // Filter out the item to delete
  items = items.filter(item => item.id !== id);
  
  // Save back to local storage
  localStorage.setItem('carouselImages', JSON.stringify(items));
  
  // Refresh the UI
  refreshLocalStorageUI();
  
  showNotification('Item deleted from local storage', 'success');
}

function testLocalItem(item) {
  // Open the test carousel with this item
  if (typeof toggleTestMode === 'function') {
    toggleTestMode();
    
    // Wait for the test carousel to initialize
    setTimeout(function() {
      const wrapper = document.getElementById('testSwiperWrapper');
      if (!wrapper) return;
      
      wrapper.innerHTML = '';
      
      // Add the item as a slide
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      slide.innerHTML = `
        <img src="${item.url}" alt="${item.title}" onerror="this.src='https://picsum.photos/800/400?random=${Math.floor(Math.random() * 100)}'; this.classList.add('fallback-image');">
        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <h3 class="text-white text-xl font-bold">${item.title}</h3>
          <p class="text-white/90">${item.description || ''}</p>
        </div>
      `;
      wrapper.appendChild(slide);
      
      // Initialize the test swiper
      if (typeof initializeTestSwiper === 'function') {
        initializeTestSwiper();
      }
    }, 500);
  } else {
    // Create a simple preview if the test mode function isn't available
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-4 max-w-2xl w-full">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-bold">${item.title}</h3>
          <button id="closePreviewBtn" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="relative h-80">
          <img src="${item.url}" alt="${item.title}" class="w-full h-full object-cover" onerror="this.src='https://picsum.photos/800/400?random=${Math.floor(Math.random() * 100)}'; this.classList.add('fallback-image');">
          <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <p class="text-white/90">${item.description || ''}</p>
          </div>
        </div>
        <div class="mt-2 text-sm text-gray-500">
          Order: ${item.order || 0}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close button event listener
    document.getElementById('closePreviewBtn').addEventListener('click', function() {
      modal.remove();
    });
  }
}

function showNotification(message, type = 'info') {
  // Try to use the existing notification system
  if (typeof showNotificationPopup === 'function') {
    showNotificationPopup(message, type);
    return;
  }
  
  // Fall back to a simple notification
  let notification = document.getElementById('fallbackNotification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'fallbackNotification';
    notification.className = 'fixed top-4 right-4 z-50 shadow-lg rounded-lg px-4 py-3 transition-opacity duration-300 opacity-0';
    document.body.appendChild(notification);
  }
  
  // Set the content and style based on type
  notification.textContent = message;
  
  notification.className = 'fixed top-4 right-4 z-50 shadow-lg rounded-lg px-4 py-3 transition-opacity duration-300';
  
  if (type === 'success') {
    notification.className += ' bg-green-500 text-white';
  } else if (type === 'error') {
    notification.className += ' bg-red-500 text-white';
  } else {
    notification.className += ' bg-blue-500 text-white';
  }
  
  // Show the notification
  notification.classList.add('opacity-100');
  
  // Hide after 3 seconds
  setTimeout(function() {
    notification.classList.remove('opacity-100');
    notification.classList.add('opacity-0');
    
    // Remove from DOM after fade out
    setTimeout(function() {
      notification.remove();
    }, 300);
  }, 3000);
}

// Add global functions for test mode if needed
window.loadLocalStorageImagesForTest = function() {
  const items = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  
  const wrapper = document.getElementById('testSwiperWrapper');
  if (!wrapper) return;
  
  if (items.length === 0) {
    wrapper.innerHTML = `
      <div class="swiper-slide">
        <div class="flex items-center justify-center h-full bg-gray-100">
          <div class="text-center">
            <i class="fas fa-info-circle text-4xl text-blue-500 mb-4"></i>
            <p class="text-gray-600">No locally saved carousel images found</p>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  wrapper.innerHTML = '';
  
  // Add each item as a slide
  items.forEach(item => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `
      <img src="${item.url}" alt="${item.title}" onerror="this.src='https://picsum.photos/800/400?random=${Math.floor(Math.random() * 100)}'; this.classList.add('fallback-image');">
      <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
        <h3 class="text-white text-xl font-bold">${item.title}</h3>
        <p class="text-white/90">${item.description || ''}</p>
      </div>
    `;
    wrapper.appendChild(slide);
  });
  
  // Initialize the test swiper
  if (typeof initializeTestSwiper === 'function') {
    initializeTestSwiper();
  }
}; 