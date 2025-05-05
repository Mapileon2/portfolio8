/**
 * Enhanced Image Preview Handler
 * This script improves image preview functionality in the admin panel
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the DOM to be fully loaded
  setTimeout(function() {
    // Get the image URL input field
    const imageUrlInput = document.getElementById('imageUrl');
    if (!imageUrlInput) return;

    // Override the default preview function with a more robust version
    imageUrlInput.addEventListener('input', function() {
      enhancedImagePreview(this.value);
    });
    
    // Also add a button for manual preview refresh
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
      const refreshButton = document.createElement('button');
      refreshButton.textContent = 'Refresh Preview';
      refreshButton.className = 'bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm mt-2';
      refreshButton.onclick = function() {
        enhancedImagePreview(imageUrlInput.value);
      };
      previewContainer.appendChild(refreshButton);
    }
  }, 1000); // Short delay to ensure all elements are loaded
  
  // Enhanced image preview function
  function enhancedImagePreview(url) {
    console.log('Previewing image URL:', url);
    
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
        // Try all possible formats
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
}); 