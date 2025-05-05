/**
 * Google Drive Image Uploader
 * 
 * This script handles the Google Drive image uploader in the admin panel.
 * It provides functionality to:
 * 1. Convert Google Drive share links to direct URLs
 * 2. Preview images before adding them
 * 3. Save images to localStorage
 * 4. Display existing images from localStorage
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the page to fully load
  setTimeout(function() {
    // Check if we're on the admin page
    if (!window.location.pathname.includes('admin.html')) return;
    
    console.log('Initializing Google Drive image uploader');
    
    // Set up the Google Drive image form
    setupGDriveImageForm();
    
    // Initialize the carousel image list
    loadExistingImages();
  }, 500);
});

// Set up the Google Drive image form
function setupGDriveImageForm() {
  const gdriveForm = document.getElementById('googleDriveImageForm');
  if (!gdriveForm) return;
  
  const gdriveUrlInput = document.getElementById('gdriveImageUrl');
  const gdrivePreview = document.getElementById('gdrivePreview');
  const gdrivePreviewEmpty = document.getElementById('gdrivePreviewEmpty');
  const gdrivePreviewLoading = document.getElementById('gdrivePreviewLoading');
  const gdrivePreviewError = document.getElementById('gdrivePreviewError');
  const gdriveDirectUrlContainer = document.getElementById('gdriveDirectUrlContainer');
  const gdriveDirectUrl = document.getElementById('gdriveDirectUrl');
  const copyDirectUrlBtn = document.getElementById('copyDirectUrlBtn');
  const cancelGdriveBtn = document.getElementById('cancelGdriveBtn');
  
  // Add event listener to the URL input
  gdriveUrlInput.addEventListener('input', function() {
    previewGDriveImage(this.value);
  });
  
  // Add event listener to the copy direct URL button
  if (copyDirectUrlBtn) {
    copyDirectUrlBtn.addEventListener('click', function() {
      if (gdriveDirectUrl && gdriveDirectUrl.value) {
        navigator.clipboard.writeText(gdriveDirectUrl.value).then(
          function() {
            // Success
            copyDirectUrlBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(function() {
              copyDirectUrlBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
          },
          function() {
            // Error
            alert('Failed to copy URL');
          }
        );
      }
    });
  }
  
  // Add event listener to the cancel button
  if (cancelGdriveBtn) {
    cancelGdriveBtn.addEventListener('click', function() {
      resetGDriveForm();
    });
  }
  
  // Handle form submission
  gdriveForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('gdriveImageTitle').value;
    const description = document.getElementById('gdriveImageDescription').value;
    const order = parseInt(document.getElementById('gdriveImageOrder').value) || 0;
    const url = gdriveUrlInput.value;
    
    // Validate URL
    if (!url || !url.includes('drive.google.com')) {
      alert('Please enter a valid Google Drive URL');
      return;
    }
    
    // Add the image to localStorage
    addImageToLocalStorage(title, description, url, order);
    
    // Reset the form
    resetGDriveForm();
    
    // Reload the image list
    loadExistingImages();
    
    // Show success message
    showStatusMessage('Image added successfully! The carousel will now display this image.');
  });
  
  // Add "Check URL" button
  const checkUrlButton = document.createElement('button');
  checkUrlButton.type = 'button';
  checkUrlButton.className = 'mt-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm inline-flex items-center';
  checkUrlButton.innerHTML = '<i class="fas fa-link-slash mr-1"></i> Check URL Accessibility';
  
  // Insert after URL input
  const urlFieldParent = gdriveUrlInput.parentNode;
  urlFieldParent.appendChild(checkUrlButton);
  
  // Add event listener for the check button
  checkUrlButton.addEventListener('click', function() {
    const url = gdriveUrlInput.value;
    if (!url) {
      alert('Please enter a Google Drive URL first');
      return;
    }
    
    checkGoogleDriveUrlAccessibility(url);
  });
}

// Preview Google Drive image
function previewGDriveImage(url) {
  const gdrivePreview = document.getElementById('gdrivePreview');
  const gdrivePreviewEmpty = document.getElementById('gdrivePreviewEmpty');
  const gdrivePreviewLoading = document.getElementById('gdrivePreviewLoading');
  const gdrivePreviewError = document.getElementById('gdrivePreviewError');
  const gdriveDirectUrlContainer = document.getElementById('gdriveDirectUrlContainer');
  const gdriveDirectUrl = document.getElementById('gdriveDirectUrl');
  
  // Reset preview
  gdrivePreview.classList.add('hidden');
  gdrivePreviewEmpty.classList.add('hidden');
  gdrivePreviewError.classList.add('hidden');
  gdriveDirectUrlContainer.classList.add('hidden');
  
  // If URL is empty, show empty state
  if (!url || url.trim() === '') {
    gdrivePreviewEmpty.classList.remove('hidden');
    return;
  }
  
  // Check if it's a Google Drive URL
  if (!url.includes('drive.google.com')) {
    gdrivePreviewError.classList.remove('hidden');
    gdrivePreviewError.querySelector('p').textContent = 'URL is not a Google Drive link. Please enter a Google Drive share link.';
    return;
  }
  
  // Show loading state
  gdrivePreviewLoading.classList.remove('hidden');
  
  // Convert the URL
  const directUrl = convertGoogleDriveUrl(url);
  
  // If conversion failed, show error
  if (!directUrl || typeof directUrl !== 'string') {
    gdrivePreviewLoading.classList.add('hidden');
    gdrivePreviewError.classList.remove('hidden');
    gdrivePreviewError.querySelector('p').textContent = 'Could not convert Google Drive URL. Please check the format.';
    return;
  }
  
  // Show the direct URL
  gdriveDirectUrl.value = directUrl;
  gdriveDirectUrlContainer.classList.remove('hidden');
  
  // Load the image
  const img = new Image();
  img.onload = function() {
    // Hide loading state
    gdrivePreviewLoading.classList.add('hidden');
    
    // Show preview
    gdrivePreview.src = directUrl;
    gdrivePreview.classList.remove('hidden');
  };
  
  img.onerror = function() {
    // Hide loading state
    gdrivePreviewLoading.classList.add('hidden');
    
    // Show error
    gdrivePreviewError.classList.remove('hidden');
    gdrivePreviewError.querySelector('p').innerHTML = 
      '<strong>Error loading image.</strong> Make sure the Google Drive file is publicly accessible. ' +
      'Set sharing to "Anyone with the link can view" and check the "Help" section below for more troubleshooting.';
    
    // Add a help section with tips
    const helpSection = document.createElement('div');
    helpSection.className = 'mt-4 p-4 bg-blue-50 rounded-lg text-sm';
    helpSection.innerHTML = `
      <h4 class="font-bold mb-2">Troubleshooting Tips:</h4>
      <ul class="list-disc pl-5 space-y-1">
        <li>Verify the file is an image (JPG, PNG, etc.)</li>
        <li>Check that sharing is set to "Anyone with the link can view"</li>
        <li>Try downloading and re-uploading the image to Google Drive</li>
        <li>Make sure your Google account doesn't require sign-in for file access</li>
        <li>Use the "Check URL Accessibility" button to test your link</li>
      </ul>
    `;
    
    if (!document.querySelector('.gdrive-help-section')) {
      gdrivePreviewError.appendChild(helpSection);
      helpSection.classList.add('gdrive-help-section');
    }
  };
  
  img.src = directUrl;
}

// Check Google Drive URL accessibility
function checkGoogleDriveUrlAccessibility(url) {
  // First convert to direct URL
  const directUrl = convertGoogleDriveUrl(url);
  if (!directUrl) {
    showStatusMessage('Could not convert Google Drive URL. Please check the format.', 'error');
    return;
  }
  
  // Create loading message
  showStatusMessage('Checking URL accessibility...', 'loading');
  
  // Create a test image
  const testImg = new Image();
  
  // Set timeout for the check (5 seconds)
  const timeout = setTimeout(() => {
    testImg.src = ''; // Cancel loading
    showStatusMessage('Request timed out. Your Google Drive image might be too large or inaccessible.', 'error');
  }, 5000);
  
  // Check if the image loads
  testImg.onload = function() {
    clearTimeout(timeout);
    showStatusMessage('✅ Success! This Google Drive image is accessible and will work in the carousel.', 'success');
  };
  
  testImg.onerror = function() {
    clearTimeout(timeout);
    showStatusMessage('❌ Error! This Google Drive image is not publicly accessible. Please check sharing settings.', 'error');
    
    // Show detailed help
    const helpContent = `
      <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h4 class="font-bold mb-2">How to fix sharing permissions:</h4>
        <ol class="list-decimal pl-5 space-y-2">
          <li>Open your Google Drive</li>
          <li>Right-click on the image</li>
          <li>Select "Share"</li>
          <li>Click "Change to anyone with the link"</li>
          <li>Make sure "Viewer" is selected</li>
          <li>Click "Done"</li>
          <li>Copy the link again and try adding it here</li>
        </ol>
      </div>
    `;
    
    // Add the help content to the status message
    const statusEl = document.getElementById('gdrive-status-message');
    if (statusEl) {
      statusEl.innerHTML += helpContent;
    }
  };
  
  // Start loading the image
  testImg.src = directUrl;
}

// Show status message
function showStatusMessage(message, type = 'info') {
  // Remove any existing messages
  const existingMessage = document.getElementById('gdrive-status-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.id = 'gdrive-status-message';
  
  // Set styles based on message type
  let styles = 'mt-4 p-4 rounded-lg text-sm flex items-start';
  let icon = '';
  
  switch (type) {
    case 'error':
      styles += ' bg-red-100 text-red-800 border border-red-200';
      icon = '<i class="fas fa-exclamation-circle text-red-500 mr-2 mt-0.5"></i>';
      break;
    case 'success':
      styles += ' bg-green-100 text-green-800 border border-green-200';
      icon = '<i class="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>';
      break;
    case 'loading':
      styles += ' bg-blue-100 text-blue-800 border border-blue-200';
      icon = '<i class="fas fa-spinner fa-spin text-blue-500 mr-2 mt-0.5"></i>';
      break;
    default:
      styles += ' bg-gray-100 text-gray-800 border border-gray-200';
      icon = '<i class="fas fa-info-circle text-gray-500 mr-2 mt-0.5"></i>';
  }
  
  messageEl.className = styles;
  messageEl.innerHTML = `
    <div class="flex-shrink-0">${icon}</div>
    <div>${message}</div>
  `;
  
  // Add to form
  const form = document.getElementById('googleDriveImageForm');
  if (form) {
    form.appendChild(messageEl);
    
    // Scroll to message
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto remove success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        messageEl.classList.add('opacity-0', 'transition-opacity', 'duration-1000');
        setTimeout(() => messageEl.remove(), 1000);
      }, 5000);
    }
  }
}

// Reset the Google Drive form
function resetGDriveForm() {
  document.getElementById('gdriveImageTitle').value = '';
  document.getElementById('gdriveImageDescription').value = '';
  document.getElementById('gdriveImageUrl').value = '';
  document.getElementById('gdriveImageOrder').value = '0';
  
  // Reset preview
  const gdrivePreview = document.getElementById('gdrivePreview');
  const gdrivePreviewEmpty = document.getElementById('gdrivePreviewEmpty');
  const gdrivePreviewLoading = document.getElementById('gdrivePreviewLoading');
  const gdrivePreviewError = document.getElementById('gdrivePreviewError');
  const gdriveDirectUrlContainer = document.getElementById('gdriveDirectUrlContainer');
  
  gdrivePreview.classList.add('hidden');
  gdrivePreviewEmpty.classList.remove('hidden');
  gdrivePreviewLoading.classList.add('hidden');
  gdrivePreviewError.classList.add('hidden');
  gdriveDirectUrlContainer.classList.add('hidden');
  
  // Remove any status messages
  const statusMessage = document.getElementById('gdrive-status-message');
  if (statusMessage) {
    statusMessage.remove();
  }
}

// Add image to localStorage
function addImageToLocalStorage(title, description, url, order) {
  // Get existing images
  let images = [];
  try {
    images = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  } catch (e) {
    console.error('Error parsing localStorage images:', e);
  }
  
  // Add new image
  images.push({
    id: Date.now().toString(),
    title: title,
    description: description,
    url: url,
    order: order,
    added: new Date().toISOString() // Add timestamp for tracking
  });
  
  // Sort by order
  images.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Save to localStorage
  localStorage.setItem('carouselImages', JSON.stringify(images));
  
  console.log(`Added image to localStorage: ${title}`);
  
  // Also attempt to cache the image by preloading it
  preloadImage(convertGoogleDriveUrl(url));
}

// Preload image to browser cache
function preloadImage(url) {
  const img = new Image();
  img.src = url;
}

// Load existing images from localStorage
function loadExistingImages() {
  const carouselImageList = document.getElementById('carouselImageList');
  if (!carouselImageList) return;
  
  // Get images from localStorage
  let images = [];
  try {
    images = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  } catch (e) {
    console.error('Error parsing localStorage images:', e);
  }
  
  // Sort by order
  images.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Clear existing list
  carouselImageList.innerHTML = '';
  
  // Add images to list
  if (images.length === 0) {
    carouselImageList.innerHTML = '<div class="col-span-2 text-center py-8 text-gray-500">No carousel images found</div>';
  } else {
    images.forEach((image, index) => {
      const isGDriveImage = image.url.includes('drive.google.com');
      const imageCard = document.createElement('div');
      imageCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm relative';
      
      // Add a badge for Google Drive images
      const badgeClass = isGDriveImage ? 
        'absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full' : 
        'absolute top-2 right-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full';
      
      const badgeText = isGDriveImage ? 'Google Drive' : 'External URL';
      
      imageCard.innerHTML = `
        <div class="${badgeClass}">
          <i class="fas ${isGDriveImage ? 'fa-google-drive' : 'fa-link'} mr-1"></i>
          ${badgeText}
        </div>
        <div class="mb-2 flex items-center">
          <span class="text-gray-500 text-sm mr-2">Order: ${image.order}</span>
          <span class="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">#${index + 1}</span>
        </div>
        <h4 class="font-bold mb-1">${image.title}</h4>
        <p class="text-sm text-gray-600 mb-2">${image.description || 'No description'}</p>
        <div class="mb-2 relative">
          <img src="${isGDriveImage ? convertGoogleDriveUrl(image.url) : image.url}" 
               alt="${image.title}" 
               class="w-full h-32 object-cover rounded border"
               onerror="this.src='https://via.placeholder.com/400x225?text=Image+Error'; this.classList.add('error')">
          <div class="absolute bottom-0 right-0 p-1">
            <a href="${image.url}" target="_blank" class="bg-white text-blue-500 hover:text-blue-700 p-1 rounded shadow">
              <i class="fas fa-external-link-alt"></i>
            </a>
          </div>
        </div>
        <div class="flex justify-between mt-2">
          <button class="delete-image-btn text-red-600 hover:text-red-800" data-id="${image.id}">
            <i class="fas fa-trash-alt"></i> Delete
          </button>
          <button class="edit-image-btn text-blue-600 hover:text-blue-800" data-id="${image.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
        </div>
      `;
      
      carouselImageList.appendChild(imageCard);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-image-btn').forEach(button => {
      button.addEventListener('click', function() {
        const imageId = this.getAttribute('data-id');
        deleteImage(imageId);
      });
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-image-btn').forEach(button => {
      button.addEventListener('click', function() {
        const imageId = this.getAttribute('data-id');
        editImage(imageId);
      });
    });
  }
  
  // Add event listener to clear all images button
  const clearImagesBtn = document.getElementById('clearImagesBtn');
  if (clearImagesBtn) {
    clearImagesBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all carousel images? This cannot be undone.')) {
        localStorage.removeItem('carouselImages');
        loadExistingImages();
        showStatusMessage('All carousel images have been cleared.', 'info');
      }
    });
  }
  
  // Show total count
  if (images.length > 0) {
    const statusContainer = document.createElement('div');
    statusContainer.className = 'mt-4 text-sm text-gray-500';
    statusContainer.innerHTML = `
      <i class="fas fa-info-circle mr-1"></i>
      ${images.length} image${images.length === 1 ? '' : 's'} found in local storage.
      The carousel will display these images in order.
    `;
    carouselImageList.parentNode.appendChild(statusContainer);
  }
}

// Delete image from localStorage
function deleteImage(id) {
  if (!confirm('Are you sure you want to delete this image?')) return;
  
  // Get existing images
  let images = [];
  try {
    images = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  } catch (e) {
    console.error('Error parsing localStorage images:', e);
    return;
  }
  
  // Filter out the image to delete
  images = images.filter(image => image.id !== id);
  
  // Save to localStorage
  localStorage.setItem('carouselImages', JSON.stringify(images));
  
  // Reload the image list
  loadExistingImages();
  
  // Show message
  showStatusMessage('Image deleted successfully', 'info');
}

// Edit image in localStorage
function editImage(id) {
  // Get existing images
  let images = [];
  try {
    images = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  } catch (e) {
    console.error('Error parsing localStorage images:', e);
    return;
  }
  
  // Find the image to edit
  const image = images.find(image => image.id === id);
  if (!image) return;
  
  // Determine which form to use based on the URL
  const isGDriveImage = image.url.includes('drive.google.com');
  
  if (isGDriveImage) {
    // Fill in the Google Drive form
    document.getElementById('gdriveImageTitle').value = image.title;
    document.getElementById('gdriveImageDescription').value = image.description || '';
    document.getElementById('gdriveImageUrl').value = image.url;
    document.getElementById('gdriveImageOrder').value = image.order || 0;
    
    // Trigger preview
    previewGDriveImage(image.url);
    
    // Scroll to form
    document.getElementById('googleDriveImageForm').scrollIntoView({ behavior: 'smooth' });
    
    // Show editing message
    showStatusMessage(`Editing image "${image.title}"`, 'info');
  } else {
    // Fill in the regular form
    document.getElementById('imageTitle').value = image.title;
    document.getElementById('imageDescription').value = image.description || '';
    document.getElementById('imageUrl').value = image.url;
    document.getElementById('imageOrder').value = image.order || 0;
    
    // Trigger preview if the form has a preview function
    if (typeof updateImagePreview === 'function') {
      updateImagePreview(image.url);
    }
    
    // Scroll to form
    document.getElementById('carouselImageForm').scrollIntoView({ behavior: 'smooth' });
  }
  
  // Delete the image (it will be re-added when the form is submitted)
  deleteImage(id);
}

// Convert Google Drive URL to direct URL
function convertGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Check if it's already a direct URL
  if (url.includes('drive.usercontent.google.com') || url.includes('lh3.googleusercontent.com')) {
    return url;
  }
  
  // Extract file ID
  let fileId = null;
  
  // Format: https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/);
  if (fileMatch) fileId = fileMatch[1];
  
  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)(?:&|$)/);
  if (!fileId && openMatch) fileId = openMatch[1];
  
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID  
  const ucMatch = url.match(/\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)(?:&|$)/);
  if (!fileId && ucMatch) fileId = ucMatch[1];
  
  if (!fileId) return null;
  
  // Construct direct URL - this is the most reliable format as of 2024
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
} 