/**
 * Magical Journeys Carousel Management Module
 * Handles carousel image management in the admin panel
 */

// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Magical Journeys module loaded');
    initCarouselManagement();
});

// Initialize the carousel management functionality
function initCarouselManagement() {
    // Find the add image button
    const addBtn = document.getElementById('add-new-image-btn') || document.querySelector('.add-new-image');
    if (addBtn) {
        console.log('Found Add New Image button, attaching event listener');
        
        // Attach click event handler
        addBtn.addEventListener('click', showUploadForm);
        
        // Also handle any existing onclick handler
        const originalOnClick = addBtn.onclick;
        addBtn.onclick = function(e) {
            if (originalOnClick) originalOnClick(e);
            showUploadForm(e);
        };
    } else {
        console.error('Add New Image button not found in DOM');
    }

    // Load existing carousel images
    loadCarouselImages();
}

// Show the carousel image upload form
function showUploadForm(e) {
    if (e) e.preventDefault();
    console.log('Show upload form triggered');
    
    // Create the upload form if it doesn't exist
    let formContainer = document.getElementById('carousel-upload-form');
    
    if (!formContainer) {
        console.log('Creating upload form container');
        formContainer = document.createElement('div');
        formContainer.id = 'carousel-upload-form';
        formContainer.className = 'card mt-4';
        formContainer.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Add Carousel Image</h5>
            </div>
            <div class="card-body">
                <form id="carousel-image-form">
                    <div class="mb-3">
                        <label for="carousel-caption" class="form-label">Caption</label>
                        <input type="text" class="form-control" id="carousel-caption" placeholder="Enter image caption">
                    </div>
                    <div class="mb-3">
                        <label for="carousel-order" class="form-label">Display Order</label>
                        <input type="number" class="form-control" id="carousel-order" value="1">
                    </div>
                    <div class="mb-3">
                        <label for="carousel-file" class="form-label">Select Image</label>
                        <input type="file" class="form-control" id="carousel-file" accept="image/*" required>
                    </div>
                    <div class="progress mb-3" style="display:none;">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
                    </div>
                    <div class="preview-container mb-3" style="display:none;">
                        <label class="form-label">Preview</label>
                        <img id="image-preview" class="img-fluid img-thumbnail" style="max-height: 200px;">
                    </div>
                    <div class="d-flex justify-content-end">
                        <button type="button" class="btn btn-secondary me-2" onclick="cancelUpload()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Upload Image</button>
                    </div>
                </form>
            </div>
        `;
        
        // Add the form to the page
        const carousel = document.querySelector('.tab-pane.active') || document.body;
        carousel.appendChild(formContainer);
        
        // Add event handlers to the new form
        document.getElementById('carousel-image-form').addEventListener('submit', uploadCarouselImage);
        document.getElementById('carousel-file').addEventListener('change', previewImage);
    } else {
        // Reset the form if it already exists
        document.getElementById('carousel-image-form').reset();
        document.getElementById('image-preview').src = '';
        document.querySelector('.preview-container').style.display = 'none';
        
        // Show the form
        formContainer.style.display = 'block';
    }
    
    // Ensure form is visible (redundant but ensures display works)
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

// Show image preview when file is selected
function previewImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('image-preview');
        preview.src = e.target.result;
        document.querySelector('.preview-container').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Upload a carousel image
async function uploadCarouselImage(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('carousel-file');
    const captionInput = document.getElementById('carousel-caption');
    const orderInput = document.getElementById('carousel-order');
    const idInput = document.getElementById('carousel-image-id');
    
    // Check if this is an update operation (id exists)
    const isUpdate = idInput && idInput.value;
    
    // If updating but no new file selected, the edit function handles it
    if (isUpdate && (!fileInput.files || fileInput.files.length === 0)) {
        return;
    }
    
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select an image file');
        return;
    }
    
    const file = fileInput.files[0];
    const caption = captionInput.value || 'Carousel Image';
    const order = orderInput.value || '1';
    
    // Create FormData object
    const formData = new FormData();
    formData.append('image', file);
    formData.append('caption', caption);
    formData.append('order', order);
    formData.append('folder', 'portfolio/carousel');
    
    // Show progress bar
    const progressBar = document.querySelector('#carousel-upload-form .progress');
    const progressBarInner = document.querySelector('#carousel-upload-form .progress-bar');
    progressBar.style.display = 'block';
    progressBarInner.style.width = '0%';
    
    try {
        // Use XMLHttpRequest for better progress tracking
        const xhr = new XMLHttpRequest();
        
        // Track progress
        xhr.upload.addEventListener('progress', function(event) {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                progressBarInner.style.width = percentComplete + '%';
                progressBarInner.textContent = percentComplete + '%';
            }
        });
        
        // Create upload promise
        const uploadPromise = new Promise((resolve, reject) => {
            // Use main server instead of the specialized server
            // Determine if this is a create or update operation
            let url = '/api/carousel-images';
            if (isUpdate) {
                url = `/api/carousel-images/${idInput.value}`;
                // For update with file, we use PUT not POST
                xhr.open('PUT', url);
            } else {
                xhr.open('POST', url);
            }
            
            // Get the authentication token if available
            const token = localStorage.getItem('firebase_token') || 
                        localStorage.getItem('jwt_token') ||
                        sessionStorage.getItem('jwtToken');
            
            // Add the token to the request headers if available
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        reject(new Error('Invalid JSON response from server'));
                    }
                } else {
                    reject(new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error occurred'));
            };
            
            xhr.send(formData);
        });
        
        // Show processing message
        progressBarInner.style.width = '100%';
        progressBarInner.textContent = 'Processing...';
        
        // Wait for upload to complete
        const response = await uploadPromise;
        
        // Hide form and show success message
        document.getElementById('carousel-upload-form').style.display = 'none';
        
        // Show success alert
        showAlert('success', isUpdate ? 'Image updated successfully!' : 'Image uploaded successfully!');
        
        // Reload images
        loadCarouselImages();
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('danger', 'Error uploading image: ' + error.message);
    } finally {
        // Hide progress bar after a delay
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 1000);
    }
}

// Cancel the upload form
function cancelUpload() {
    const form = document.getElementById('carousel-upload-form');
    if (form) {
        form.style.display = 'none';
    }
}

// Load carousel images from the server
async function loadCarouselImages() {
    const container = document.getElementById('carousel-images-container') || document.querySelector('.carousel-images');
    if (!container) {
        console.error('Carousel images container not found');
        return;
    }
    
    // Show loading indicator
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading carousel images...</p></div>';
    
    try {
        // Fetch carousel images
        const response = await fetch('/api/carousel-images');
        const images = await response.json();
        
        if (images.length === 0) {
            // No images found
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="no-images">
                        <i class="fas fa-images fa-4x text-muted mb-3"></i>
                        <p>No images have been added yet</p>
                        <p>Click "Add New Image" to get started</p>
                    </div>
                </div>
            `;
        } else {
            // Generate HTML for images
            let html = '<div class="row">';
            
            images.forEach(image => {
                html += `
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <img src="${image.url}" class="card-img-top" alt="${image.caption || 'Carousel image'}">
                            <div class="card-body">
                                <h5 class="card-title">${image.caption || 'No caption'}</h5>
                                <p class="card-text">Order: ${image.order || 0}</p>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-sm btn-primary edit-carousel-image" data-id="${image.id}">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger delete-carousel-image" data-id="${image.id}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
            
            // Add event handlers for edit/delete buttons
            document.querySelectorAll('.edit-carousel-image').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    editCarouselImage(id);
                });
            });
            
            document.querySelectorAll('.delete-carousel-image').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    deleteCarouselImage(id);
                });
            });
        }
    } catch (error) {
        console.error('Error loading carousel images:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Error loading carousel images. Please try again later.
            </div>
        `;
    }
}

// Edit a carousel image
async function editCarouselImage(id) {
    try {
        // Fetch image data
        const response = await fetch(`/api/carousel-images/${id}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch image data');
        }
        
        const image = await response.json();
        
        // Show the form
        showUploadForm();
        
        // Fill form with image data
        document.getElementById('carousel-caption').value = image.caption || '';
        document.getElementById('carousel-order').value = image.order || 1;
        
        // Show image preview
        const preview = document.getElementById('image-preview');
        preview.src = image.url;
        document.querySelector('.preview-container').style.display = 'block';
        
        // Modify form submission to handle update
        const form = document.getElementById('carousel-image-form');
        const originalSubmitHandler = form.onsubmit;
        
        // Create hidden input for ID if it doesn't exist
        if (!document.getElementById('carousel-image-id')) {
            const idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.id = 'carousel-image-id';
            form.appendChild(idInput);
        }
        
        document.getElementById('carousel-image-id').value = id;
        
        // Override form submission to handle update
        form.onsubmit = async function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('carousel-file');
            const captionInput = document.getElementById('carousel-caption');
            const orderInput = document.getElementById('carousel-order');
            
            // If no new file is selected, send an update request
            if (!fileInput.files || fileInput.files.length === 0) {
                try {
                    // Get authentication token if available
                    const token = localStorage.getItem('firebase_token') || 
                                localStorage.getItem('jwt_token') ||
                                sessionStorage.getItem('jwtToken');
                    
                    // Set headers including auth if available
                    const headers = { 
                        'Content-Type': 'application/json' 
                    };
                    
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    const response = await fetch(`/api/carousel-images/${id}`, {
                        method: 'PUT',
                        headers: headers,
                        body: JSON.stringify({
                            caption: captionInput.value || 'Carousel Image',
                            order: parseInt(orderInput.value) || 1
                        })
                    });
                    
                    if (response.ok) {
                        showAlert('success', 'Image updated successfully');
                        document.getElementById('carousel-upload-form').style.display = 'none';
                        loadCarouselImages();
                    } else {
                        const result = await response.json();
                        throw new Error(result.error || 'Failed to update image');
                    }
                } catch (error) {
                    console.error('Error updating carousel image:', error);
                    showAlert('danger', 'Error updating image: ' + error.message);
                }
            } else {
                // If a new file is selected, use the regular upload function with the ID
                uploadCarouselImage(e);
            }
        };
    } catch (error) {
        console.error('Error editing carousel image:', error);
        showAlert('danger', 'Error loading image details: ' + error.message);
    }
}

// Delete a carousel image
async function deleteCarouselImage(id) {
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) {
        return;
    }
    
    try {
        // Get authentication token if available
        const token = localStorage.getItem('firebase_token') || 
                    localStorage.getItem('jwt_token') ||
                    sessionStorage.getItem('jwtToken');
        
        // Set headers including auth if available
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/carousel-images/${id}`, {
            method: 'DELETE',
            headers: headers
        });
        
        if (response.ok) {
            showAlert('success', 'Image deleted successfully');
            loadCarouselImages();
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to delete image');
        }
    } catch (error) {
        console.error('Error deleting carousel image:', error);
        showAlert('danger', 'Error deleting image: ' + error.message);
    }
}

// Show alert message
function showAlert(type, message) {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert-message');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show alert-message`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.tab-pane.active') || document.body;
    container.insertBefore(alert, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 5000);
} 