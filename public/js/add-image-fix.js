/**
 * Fix for Add Image functionality in admin panel
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the page to fully load
  setTimeout(function() {
    // Check if we're on the admin page
    if (!window.location.pathname.includes('admin.html')) return;
    
    // Fix the Add New Image button
    setupAddImageButton();
    
    // Also add a direct manual form
    addEmergencyImageForm();
    
    // Show locally stored images
    displayLocallyStoredImages();
  }, 1000);
});

// Add Google Drive URL conversion utilities
const googleDriveUtils = {
  /**
   * Extract Google Drive file ID from a URL
   * @param {string} url - The Google Drive URL
   * @return {string|null} The file ID or null if not found
   */
  extractFileId: function(url) {
    if (!url) return null;
    
    // Standard file URL format
    const fileRegex = /\/d\/([a-zA-Z0-9_-]+)/;
    const fileMatch = url.match(fileRegex);
    
    if (fileMatch && fileMatch[1]) {
      return fileMatch[1];
    }
    
    // Alternative format with id parameter
    const idRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
    const idMatch = url.match(idRegex);
    
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
    
    return null;
  },
  
  /**
   * Check if a URL is a Google Drive URL
   * @param {string} url - The URL to check
   * @return {boolean} True if it's a Google Drive URL
   */
  isGoogleDriveUrl: function(url) {
    if (!url) return false;
    return url.includes('drive.google.com');
  },
  
  /**
   * Convert Google Drive URL to direct download URL
   * @param {string} url - The Google Drive URL
   * @return {string} The direct download URL or original URL if not a Google Drive URL
   */
  getDirectUrl: function(url) {
    if (!this.isGoogleDriveUrl(url)) {
      return url; // Not a Google Drive URL
    }
    
    const fileId = this.extractFileId(url);
    if (!fileId) {
      console.error('Could not extract file ID from Google Drive URL:', url);
      return url; // Return original if file ID extraction failed
    }
    
    // Use the recommended format
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
  },
  
  /**
   * Get multiple URL formats for a Google Drive file
   * @param {string} url - The Google Drive URL
   * @return {Object} Object with different URL formats
   */
  getAllFormats: function(url) {
    if (!this.isGoogleDriveUrl(url)) {
      return { direct: url }; // Not a Google Drive URL
    }
    
    const fileId = this.extractFileId(url);
    if (!fileId) {
      return { direct: url }; // Return original if file ID extraction failed
    }
    
    return {
      fileId: fileId,
      direct: `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
      preview: `https://drive.google.com/file/d/${fileId}/preview`,
      legacy: `https://drive.google.com/uc?export=view&id=${fileId}`,
      lh3: `https://lh3.googleusercontent.com/d/${fileId}`
    };
  },
  
  /**
   * Process multiple Google Drive URLs
   * @param {string|Array} input - String with URLs (newline or comma separated) or array of URLs
   * @return {Array} Array of processed direct URLs
   */
  processUrls: function(input) {
    let urls = [];
    
    if (typeof input === 'string') {
      // Check if string contains newlines or commas
      if (input.includes('\n')) {
        urls = input.split('\n');
      } else if (input.includes(',')) {
        urls = input.split(',');
      } else {
        urls = [input];
      }
    } else if (Array.isArray(input)) {
      urls = input;
    } else {
      console.error('Invalid input type for processUrls');
      return [];
    }
    
    // Clean up URLs and convert them
    return urls
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .map(url => {
        if (this.isGoogleDriveUrl(url)) {
          return {
            original: url,
            processed: this.getDirectUrl(url),
            fileId: this.extractFileId(url)
          };
        }
        return {
          original: url,
          processed: url,
          fileId: null
        };
      });
  }
};

function setupAddImageButton() {
  const addBtn = document.getElementById('addCarouselImageBtn');
  if (!addBtn) {
    // If the button doesn't exist yet, try to find the container
    const carouselSection = document.getElementById('carouselSection');
    if (!carouselSection) {
      console.error('Carousel section not found');
      return;
    }
    
    // Look for the add button elsewhere
    const addBtnAlternative = document.querySelector('button.bg-green-600') || 
      document.querySelector('[class*="bg-green"][class*="rounded"]');
    
    if (addBtnAlternative) {
      console.log('Found alternative add button');
      
      // Make sure it has the right click handler
      addBtnAlternative.addEventListener('click', showImageForm);
    } else {
      // Create a new add button if none exists
      console.log('No add button found, creating one');
      
      // Find the heading/title area
      const heading = carouselSection.querySelector('h2') || carouselSection.querySelector('h3');
      if (heading) {
        const newAddBtn = document.createElement('button');
        newAddBtn.id = 'addCarouselImageBtnEmergency';
        newAddBtn.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center';
        newAddBtn.innerHTML = '<i class="fas fa-plus mr-2"></i> Add Image';
        newAddBtn.addEventListener('click', showImageForm);
        
        // Insert after the heading
        heading.parentNode.insertBefore(newAddBtn, heading.nextSibling);
      }
    }
  } else {
    // Make sure the existing button works
    addBtn.addEventListener('click', showImageForm);
  }
}

function showImageForm() {
  console.log('Showing image form');
  
  // Try to find the existing form
  let form = document.getElementById('carouselImageForm');
  
  if (!form) {
    // Create a new form if it doesn't exist
    form = document.createElement('div');
    form.id = 'carouselImageForm';
    form.className = 'bg-white p-8 rounded-xl shadow-lg mb-8 dark:bg-gray-800';
    
    // Create the form HTML
    form.innerHTML = `
      <h3 class="text-xl font-bold mb-4 dark:text-gray-200">Add Carousel Image</h3>
      
      <div class="mb-4">
        <label for="imageTitle" class="block text-gray-700 dark:text-gray-300 mb-2">Image Title</label>
        <input type="text" id="imageTitle" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
      </div>
      
      <div class="mb-4">
        <label for="imageUrl" class="block text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
        <input type="url" id="imageUrl" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">Direct link to image (Google Drive, Imgur, etc.)</p>
      </div>
      
      <div id="imagePreviewContainer" class="mb-4">
        <label class="block text-gray-700 dark:text-gray-300 mb-2">Image Preview</label>
        <div id="imagePreviewEmpty" class="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
          <i class="fas fa-image text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-500 dark:text-gray-400">Enter a URL above to preview the image</p>
        </div>
        <div id="imagePreviewLoading" class="hidden border-2 border-gray-300 rounded-md p-8 text-center">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-2"></i>
          <p class="text-gray-600 dark:text-gray-400">Loading preview...</p>
        </div>
        <div id="imagePreviewError" class="hidden border-2 border-red-300 rounded-md p-8 text-center">
          <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-2"></i>
          <p class="text-red-500">Failed to load image from URL</p>
        </div>
        <img id="imagePreview" class="hidden max-h-80 mx-auto rounded-md border border-gray-300" alt="Image Preview">
      </div>
      
      <div class="mb-4">
        <label for="imageDescription" class="block text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
        <textarea id="imageDescription" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3"></textarea>
      </div>
      
      <div class="mb-6">
        <label for="imageOrder" class="block text-gray-700 dark:text-gray-300 mb-2">Display Order</label>
        <input type="number" id="imageOrder" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="0" min="0">
        <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">Lower numbers appear first</p>
      </div>
      
      <div class="flex justify-end space-x-4">
        <button id="cancelCarouselImageBtn" class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg">
          Cancel
        </button>
        <button id="saveCarouselImageBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          Save Image
        </button>
      </div>
    `;
    
    // Find the right place to insert the form
    const carouselSection = document.getElementById('carouselSection');
    if (carouselSection) {
      // Insert at the beginning of the carousel section
      carouselSection.insertBefore(form, carouselSection.firstChild);
    } else {
      // Fallback - try to find a container with the right content
      const container = document.querySelector('.container') || document.body;
      container.appendChild(form);
    }
    
    // Set up event listeners for the form
    setupFormEventHandlers(form);
  } else {
    // Show the existing form
    form.classList.remove('hidden');
  }
}

function setupFormEventHandlers(form) {
  // Image URL preview
  const imageUrlInput = form.querySelector('#imageUrl');
  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', function() {
      updateImagePreview(this.value);
    });
  }
  
  // Cancel button
  const cancelBtn = form.querySelector('#cancelCarouselImageBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      form.classList.add('hidden');
    });
  }
  
  // Save button
  const saveBtn = form.querySelector('#saveCarouselImageBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      saveImageToLocalStorage();
    });
  }
}

function updateImagePreview(url) {
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
  
  // Process the URL using the new Google Drive utilities
  let processedUrl = url;
  
  // Check if it's a Google Drive URL and process it
  if (googleDriveUtils.isGoogleDriveUrl(url)) {
    console.log('Google Drive URL detected:', url);
    
    const formats = googleDriveUtils.getAllFormats(url);
    console.log('Generated URL formats:', formats);
    
    // Use the direct format as primary
    processedUrl = formats.direct;
  }
  
  // Create a new image to test if the URL is valid
  const testImage = new Image();
  
  // Set up error handling for the test image
  testImage.onerror = function() {
    console.error('Error loading image preview:', processedUrl);
    
    // Try fallbacks for Google Drive
    if (googleDriveUtils.isGoogleDriveUrl(url)) {
      console.log('Primary format failed, trying alternatives');
      tryGoogleDriveFallbacks(url);
    } else {
      previewLoading.classList.add('hidden');
      previewError.classList.remove('hidden');
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
  
  // Function to try fallback formats for Google Drive
  function tryGoogleDriveFallbacks(originalUrl) {
    const fileId = googleDriveUtils.extractFileId(originalUrl);
    
    if (!fileId) {
      previewLoading.classList.add('hidden');
      previewError.classList.remove('hidden');
      return;
    }
    
    // Try thumbnail format first (most reliable)
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    console.log('Trying thumbnail format:', thumbnailUrl);
    
    const thumbnailImage = new Image();
    
    thumbnailImage.onload = function() {
      previewLoading.classList.add('hidden');
      previewImg.src = thumbnailUrl;
      previewImg.classList.remove('hidden');
      console.log('Thumbnail preview loaded successfully');
      
      // Update the input with a working URL format
      const urlInput = document.getElementById('imageUrl');
      if (urlInput) {
        const formats = googleDriveUtils.getAllFormats(originalUrl);
        urlInput.value = formats.direct;
      }
    };
    
    thumbnailImage.onerror = function() {
      console.error('Thumbnail preview failed, trying more formats');
      
      // Try a sequence of different formats
      const formats = [
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/uc?export=view&id=${fileId}`,
        `https://drive.usercontent.google.com/uc?id=${fileId}`,
        `https://drive.google.com/uc?id=${fileId}`
      ];
      
      tryFormatSequence(formats, 0);
    };
    
    thumbnailImage.src = thumbnailUrl;
    
    // Try formats in sequence
    function tryFormatSequence(formatUrls, index) {
      if (index >= formatUrls.length) {
        // All formats failed
        previewLoading.classList.add('hidden');
        previewError.classList.remove('hidden');
        console.error('All Google Drive formats failed');
        return;
      }
      
      const formatUrl = formatUrls[index];
      console.log(`Trying format ${index + 1}/${formatUrls.length}: ${formatUrl}`);
      
      const formatImage = new Image();
      
      formatImage.onload = function() {
        previewLoading.classList.add('hidden');
        previewImg.src = formatUrl;
        previewImg.classList.remove('hidden');
        console.log(`Format ${index + 1} loaded successfully`);
        
        // Update the input
        const urlInput = document.getElementById('imageUrl');
        if (urlInput) {
          urlInput.value = formatUrl;
        }
      };
      
      formatImage.onerror = function() {
        console.log(`Format ${index + 1} failed, trying next`);
        tryFormatSequence(formatUrls, index + 1);
      };
      
      formatImage.src = formatUrl;
    }
  }
}

function saveImageToLocalStorage() {
  // Get the form data
  const titleInput = document.getElementById('imageTitle');
  const urlInput = document.getElementById('imageUrl');
  const descInput = document.getElementById('imageDescription');
  const orderInput = document.getElementById('imageOrder');
  
  // Validate required fields
  if (!titleInput || !titleInput.value || !urlInput || !urlInput.value) {
    alert('Title and URL are required');
    return;
  }
  
  // Create image data object
  const imageData = {
    title: titleInput.value,
    url: urlInput.value,
    description: descInput ? descInput.value : '',
    order: orderInput ? parseInt(orderInput.value) || 0 : 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
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
  alert('Image saved to local storage successfully!');
  
  // Hide the form
  const form = document.getElementById('carouselImageForm');
  if (form) {
    form.classList.add('hidden');
  }
  
  // Update the UI to show locally saved items
  if (typeof refreshLocalStorageUI === 'function') {
    refreshLocalStorageUI();
  } else {
    location.reload(); // Fallback - reload the page to see the changes
  }
}

function addEmergencyImageForm() {
  // Create a container for the emergency form
  const emergencySection = document.createElement('div');
  emergencySection.id = 'emergencyImageForm';
  emergencySection.className = 'bg-purple-100 p-6 rounded-xl shadow-lg mt-8 mb-8 dark:bg-purple-900';
  emergencySection.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold text-purple-800 dark:text-purple-300">Emergency Image Upload</h3>
      <button id="toggleEmergencyFormBtn" class="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-sm">
        Show Form
      </button>
    </div>
    <div id="emergencyFormContainer" class="hidden">
      <p class="text-sm text-purple-700 dark:text-purple-400 mb-4">
        Use this form if the normal Add Image button doesn't work. This will directly save to local storage.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="mb-4">
          <label class="block text-purple-700 dark:text-purple-300 mb-2">Image Title</label>
          <input type="text" id="emergencyImageTitle" class="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-purple-600 dark:text-white">
        </div>
        <div class="mb-4">
          <label class="block text-purple-700 dark:text-purple-300 mb-2">Image URL</label>
          <input type="url" id="emergencyImageUrl" class="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-purple-600 dark:text-white">
        </div>
        <div class="mb-4">
          <label class="block text-purple-700 dark:text-purple-300 mb-2">Description (Optional)</label>
          <input type="text" id="emergencyImageDesc" class="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-purple-600 dark:text-white">
        </div>
        <div class="mb-4">
          <label class="block text-purple-700 dark:text-purple-300 mb-2">Order</label>
          <input type="number" id="emergencyImageOrder" class="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-purple-600 dark:text-white" value="0" min="0">
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div id="emergencyImagePreview" class="bg-white p-4 rounded-lg shadow-inner flex items-center justify-center min-h-[150px] dark:bg-gray-800">
          <p class="text-gray-500 dark:text-gray-400">Preview will appear here</p>
        </div>
        <div class="flex flex-col justify-between">
          <p class="text-sm text-purple-700 dark:text-purple-400 mb-4">
            For Google Drive images, make sure to get the "Share" link, not the URL from your browser address bar.
          </p>
          <div class="flex justify-end space-x-4 mt-4">
            <button id="saveEmergencyImageBtn" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
              Save to Local Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add the emergency form to the page
  const carouselSection = document.getElementById('carouselSection');
  if (carouselSection) {
    carouselSection.appendChild(emergencySection);
  } else {
    // Fallback - add to the end of the body
    document.body.appendChild(emergencySection);
  }
  
  // Add event listeners for the emergency form
  const toggleBtn = document.getElementById('toggleEmergencyFormBtn');
  const formContainer = document.getElementById('emergencyFormContainer');
  
  if (toggleBtn && formContainer) {
    toggleBtn.addEventListener('click', function() {
      formContainer.classList.toggle('hidden');
      toggleBtn.textContent = formContainer.classList.contains('hidden') ? 'Show Form' : 'Hide Form';
    });
  }
  
  // Preview image when URL changes
  const urlInput = document.getElementById('emergencyImageUrl');
  const preview = document.getElementById('emergencyImagePreview');
  
  if (urlInput && preview) {
    urlInput.addEventListener('input', function() {
      const url = this.value;
      if (url && url.trim() !== '') {
        preview.innerHTML = `
          <img src="${url}" onerror="this.onerror=null; this.src='https://picsum.photos/300/200?random=1'; this.classList.add('fallback-image');" alt="Preview" class="max-h-[150px] max-w-full">
        `;
      } else {
        preview.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Preview will appear here</p>`;
      }
    });
  }
  
  // Save button handler
  const saveBtn = document.getElementById('saveEmergencyImageBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      const title = document.getElementById('emergencyImageTitle').value;
      const url = document.getElementById('emergencyImageUrl').value;
      const desc = document.getElementById('emergencyImageDesc').value;
      const order = parseInt(document.getElementById('emergencyImageOrder').value) || 0;
      
      if (!title || !url) {
        alert('Title and URL are required');
        return;
      }
      
      // Generate a unique ID
      const id = 'emergency_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Get existing carousel items
      let items = JSON.parse(localStorage.getItem('carouselImages') || '[]');
      
      // Add the new item
      items.push({
        id: id,
        title: title,
        url: url,
        description: desc,
        order: order,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      // Sort by order
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Save back to local storage
      localStorage.setItem('carouselImages', JSON.stringify(items));
      
      // Show success message
      alert('Image saved to local storage successfully!');
      
      // Clear the form
      document.getElementById('emergencyImageTitle').value = '';
      document.getElementById('emergencyImageUrl').value = '';
      document.getElementById('emergencyImageDesc').value = '';
      document.getElementById('emergencyImageOrder').value = '0';
      preview.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Preview will appear here</p>`;
      
      // Update the UI
      if (typeof refreshLocalStorageUI === 'function') {
        refreshLocalStorageUI();
      } else {
        location.reload(); // Fallback - reload the page to see the changes
      }
    });
  }
}

// Add this function to display the locally stored images
function displayLocallyStoredImages() {
  // Get images from localStorage
  const localImages = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  
  if (!localImages.length) {
    console.log('No locally stored images found');
    return;
  }
  
  console.log(`Found ${localImages.length} locally stored images`);
  
  // Find the container for local images
  let localContainer = document.getElementById('localStorageImagesContainer');
  
  if (!localContainer) {
    // Create a container for local images if it doesn't exist
    localContainer = document.createElement('div');
    localContainer.id = 'localStorageImagesContainer';
    localContainer.className = 'bg-purple-50 p-6 rounded-xl shadow-lg mb-8 dark:bg-purple-900';
    
    localContainer.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-purple-800 dark:text-purple-300">
          Locally Stored Images (${localImages.length})
        </h3>
        <button id="refreshLocalImagesBtn" class="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-sm">
          Refresh
        </button>
      </div>
      <p class="mb-4 text-sm text-purple-700 dark:text-purple-400">
        These images are stored in your browser and will be available even if Firebase is offline.
      </p>
      <div id="localImagesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Local images will be added here -->
      </div>
    `;
    
    // Add to the carousel section if it exists
    const carouselSection = document.getElementById('carouselSection');
    if (carouselSection) {
      // Add after the emergency form
      const emergencyForm = document.getElementById('emergencyImageForm');
      if (emergencyForm) {
        carouselSection.insertBefore(localContainer, emergencyForm.nextSibling);
      } else {
        carouselSection.appendChild(localContainer);
      }
    }
  }
  
  // Get the list container
  const listContainer = localContainer.querySelector('#localImagesList');
  if (!listContainer) return;
  
  // Clear the list
  listContainer.innerHTML = '';
  
  // Sort images by order
  localImages.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Add each image
  localImages.forEach(image => {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden';
    
    // Format date
    const date = new Date(image.createdAt);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    card.innerHTML = `
      <div class="relative" style="height: 140px;">
        <img 
          src="${image.url}" 
          alt="${image.title}" 
          class="w-full h-full object-cover"
          onerror="this.onerror=null; this.src='https://picsum.photos/300/200?random=1'; this.classList.add('fallback-image');"
        >
        <div class="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white py-1 px-2 rounded text-sm">
          #${image.order || 0}
        </div>
      </div>
      <div class="p-3">
        <h4 class="font-bold text-gray-800 dark:text-white">${image.title}</h4>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">${formattedDate}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">${image.description || 'No description'}</p>
        <div class="flex justify-between">
          <button class="use-local-image-btn text-blue-600 hover:text-blue-800 text-xs" data-id="${image.id}">
            <i class="fas fa-check mr-1"></i> Use This
          </button>
          <button class="delete-local-image-btn text-red-600 hover:text-red-800 text-xs" data-id="${image.id}">
            <i class="fas fa-trash-alt mr-1"></i> Remove
          </button>
        </div>
      </div>
    `;
    
    listContainer.appendChild(card);
  });
  
  // Add event listeners for buttons
  document.querySelectorAll('.use-local-image-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const imageId = this.getAttribute('data-id');
      const image = localImages.find(img => img.id === imageId);
      
      if (image) {
        // Fill in the form with this image
        const titleInput = document.getElementById('imageTitle');
        const urlInput = document.getElementById('imageUrl');
        const descInput = document.getElementById('imageDescription');
        const orderInput = document.getElementById('imageOrder');
        
        if (titleInput) titleInput.value = image.title;
        if (urlInput) urlInput.value = image.url;
        if (descInput) descInput.value = image.description || '';
        if (orderInput) orderInput.value = image.order || 0;
        
        // Show the form
        showImageForm();
        
        // Update the preview
        if (urlInput) {
          updateImagePreview(image.url);
        }
      }
    });
  });
  
  document.querySelectorAll('.delete-local-image-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const imageId = this.getAttribute('data-id');
      
      if (confirm('Are you sure you want to remove this image from local storage?')) {
        // Remove from localStorage
        const updatedImages = localImages.filter(img => img.id !== imageId);
        localStorage.setItem('carouselImages', JSON.stringify(updatedImages));
        
        // Update the UI
        displayLocallyStoredImages();
      }
    });
  });
  
  // Add refresh button handler
  const refreshBtn = document.getElementById('refreshLocalImagesBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      displayLocallyStoredImages();
    });
  }
}

// Update the refreshLocalStorageUI function to call our display function
function refreshLocalStorageUI() {
  displayLocallyStoredImages();
} 