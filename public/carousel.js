/**
 * Simple Carousel - A lightweight, responsive carousel implementation
 * 
 * This carousel provides smooth left-to-right sliding animations for image galleries
 * with responsive design and touch support.
 */

// Initialize carousels on the page
function initializeCarousels() {
    // Check if enhanced Swiper implementation is available
    if (typeof window.initializeSwiperCarousels === 'function') {
        console.log("Using enhanced Swiper implementation");
        window.initializeSwiperCarousels();
        return;
    }
    
    // Otherwise, fallback to original implementation
    console.log("Using original carousel implementation");
    
    // Find all carousels on the page
    const carousels = document.querySelectorAll('.simple-carousel');
    
    // Initialize each carousel
    carousels.forEach(carousel => {
        initCarousel(carousel);
    });
}

// Initialize a single carousel
function initCarousel(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = carousel.querySelector('.prev-btn');
    const nextBtn = carousel.querySelector('.next-btn');
    
    if (!track || !slides.length) return;
    
    let currentIndex = 0;
    let slideWidth = slides[0].clientWidth;
    let slidesPerView = 1;
    
    // Add animation delay based on index for staggered entrance
    slides.forEach((slide, index) => {
        slide.style.setProperty('--slide-index', index);
    });
    
    // Determine slides per view based on screen width
    if (window.innerWidth >= 1024) {
        slidesPerView = 3;
    } else if (window.innerWidth >= 640) {
        slidesPerView = 2;
    }
    
    // Update slide width on window resize
    const resizeObserver = new ResizeObserver(() => {
        slideWidth = slides[0].clientWidth;
        updateCarousel();
        
        // Update slides per view
        if (window.innerWidth >= 1024) {
            slidesPerView = 3;
        } else if (window.innerWidth >= 640) {
            slidesPerView = 2;
        } else {
            slidesPerView = 1;
        }
    });
    
    // Observe the carousel element for size changes
    resizeObserver.observe(carousel);
    
    // Function to update carousel position
    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        
        // Update active slide and dot
        slides.forEach((slide, i) => {
            // Add or remove active class based on visibility
            const isVisible = i >= currentIndex && i < currentIndex + slidesPerView;
            slide.classList.toggle('active', isVisible);
            
            // Add extra visual prominence to center slide when 3+ visible
            if (slidesPerView >= 3) {
                slide.classList.toggle('center-active', i === currentIndex + 1);
            }
        });
        
        // Update active dot
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }
    
    // Event listeners for buttons
    prevBtn.addEventListener('click', () => {
        currentIndex = Math.max(0, currentIndex - 1);
        updateCarousel();
    });
    
    nextBtn.addEventListener('click', () => {
        currentIndex = Math.min(slides.length - slidesPerView, currentIndex + 1);
        updateCarousel();
    });
    
    // Event listeners for dots
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            currentIndex = Math.min(i, slides.length - slidesPerView);
            updateCarousel();
        });
    });
    
    // Add touch support
    let startX, moveX;
    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });
    
    track.addEventListener('touchmove', (e) => {
        if (!startX) return;
        moveX = e.touches[0].clientX;
        const diff = moveX - startX;
        // Add a subtle movement while dragging
        if (Math.abs(diff) > 10) {
            track.style.transform = `translateX(${-currentIndex * slideWidth + diff * 0.5}px)`;
        }
    }, { passive: true });
    
    track.addEventListener('touchend', (e) => {
        if (!startX || !moveX) return;
        const diff = moveX - startX;
        if (diff > 50 && currentIndex > 0) {
            // Swipe right -> go to previous slide
            currentIndex--;
        } else if (diff < -50 && currentIndex < slides.length - slidesPerView) {
            // Swipe left -> go to next slide
            currentIndex++;
        }
        updateCarousel();
        startX = null;
        moveX = null;
    }, { passive: true });
    
    // Auto advance (optional)
    let autoplayInterval = setInterval(() => {
        if (currentIndex >= slides.length - slidesPerView) {
            currentIndex = 0;
        } else {
            currentIndex++;
        }
        updateCarousel();
    }, 5000);
    
    // Pause autoplay on mouse enter or touch
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoplayInterval);
    });
    
    carousel.addEventListener('touchstart', () => {
        clearInterval(autoplayInterval);
    }, { passive: true });
    
    // Resume autoplay on mouse leave
    carousel.addEventListener('mouseleave', () => {
        clearInterval(autoplayInterval);
        autoplayInterval = setInterval(() => {
            if (currentIndex >= slides.length - slidesPerView) {
                currentIndex = 0;
            } else {
                currentIndex++;
            }
            updateCarousel();
        }, 5000);
    });
    
    // Initialize carousel
    updateCarousel();
}

// Enhanced image URL processor with debugging
function enhancedImageProcessor(url) {
    // Check if URL is defined
    if (!url || typeof url !== 'string') {
        console.error("Invalid image URL:", url);
        return {
            thumbnail: 'https://via.placeholder.com/800x450?text=Invalid+URL',
            fullRes: 'https://via.placeholder.com/800x450?text=Invalid+URL'
        };
    }
    
    // Normalize URL by trimming
    const trimmedUrl = url.trim();
    
    // Different URL source handlers
    
    // 1. Google Drive Handlers
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = trimmedUrl.match(/\/file\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = trimmedUrl.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
    // Format: https://drive.google.com/uc?export=view&id=FILE_ID
    const ucMatch = trimmedUrl.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
    // Format: https://drive.google.com/d/FILE_ID/
    const directMatch = trimmedUrl.match(/\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
    
    // Check for any Google Drive match
    let fileId = null;
    if (fileMatch) fileId = fileMatch[1];
    else if (openMatch) fileId = openMatch[1];
    else if (ucMatch) fileId = ucMatch[1];
    else if (directMatch) fileId = directMatch[1];
    
    if (fileId) {
        console.log("Detected Google Drive image with ID:", fileId);
        // Use multiple URL formats for better compatibility
        return {
            // Primary format (new recommended URL structure)
            thumbnail: `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
            fullRes: `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
            // Keep alternative formats as backup
            directUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
            previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
            // Add lh3 format that works in some cases
            lhFormat: `https://lh3.googleusercontent.com/d/${fileId}`,
            // Store the file ID for further processing if needed
            fileId: fileId
        };
    }
    
    // 2. Google Photos Handler
    const googlePhotosMatch = trimmedUrl.match(/photos\.app\.goo\.gl|photos\.google\.com/);
    if (googlePhotosMatch) {
        console.log("Detected Google Photos link - these links may not work directly due to authentication:", trimmedUrl);
        return {
            thumbnail: trimmedUrl,
            fullRes: trimmedUrl,
            note: "Google Photos links may require authentication"
        };
    }
    
    // 3. Dropbox Handler
    const dropboxMatch = trimmedUrl.match(/dropbox\.com/);
    if (dropboxMatch) {
        // Convert dropbox share links to direct links
        let directUrl = trimmedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        directUrl = directUrl.replace('?dl=0', '');
        console.log("Converted Dropbox URL:", directUrl);
        return {
            thumbnail: directUrl,
            fullRes: directUrl
        };
    }
    
    // 4. OneDrive Handler
    const onedriveMatch = trimmedUrl.match(/1drv\.ms|onedrive\.live\.com/);
    if (onedriveMatch) {
        console.log("Detected OneDrive link - these may need special handling:", trimmedUrl);
        return {
            thumbnail: trimmedUrl,
            fullRes: trimmedUrl,
            note: "OneDrive links may need embed parameters"
        };
    }
    
    // 5. Default for direct image URLs
    console.log("Using direct image URL:", trimmedUrl);
    return {
        thumbnail: trimmedUrl,
        fullRes: trimmedUrl
    };
}

// Helper function to extract Google Drive file ID
function extractGoogleDriveId(url) {
    if (!url || typeof url !== 'string') return null;
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
    if (fileMatch) return fileMatch[1];
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
    if (openMatch) return openMatch[1];
    
    // Format: https://drive.google.com/uc?export=view&id=FILE_ID
    const ucMatch = url.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
    if (ucMatch) return ucMatch[1];
    
    // Format: https://drive.google.com/d/FILE_ID/
    const directMatch = url.match(/\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
    if (directMatch) return directMatch[1];
    
    return null;
}

// Progressive fallback handler for Google Drive images
function setupGoogleDriveImageFallback(imgElement, originalUrl) {
    const fileId = extractGoogleDriveId(originalUrl);
    if (!fileId) return;
    
    // Set up the error handler with progressive fallback options
    imgElement.onerror = function() {
        const currentSrc = this.src;
        console.log(`Image failed to load: ${currentSrc}`);
        
        // Try different formats in sequence
        if (currentSrc.includes('drive.usercontent.google.com')) {
            // New format failed, try lh3 format
            console.log('New usercontent format failed, trying lh3 format');
            this.src = `https://lh3.googleusercontent.com/d/${fileId}`;
        }
        else if (currentSrc.includes('lh3.googleusercontent.com')) {
            console.log('lh3 format failed, trying thumbnail format');
            this.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
        } 
        else if (currentSrc.includes('thumbnail')) {
            console.log('thumbnail format failed, trying direct export format');
            this.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
        else if (currentSrc.includes('uc?export=view')) {
            console.log('direct export format failed, using custom error image');
            // Use a more helpful error message with the file ID
            const errorUrl = `https://via.placeholder.com/800x450/f8f9fa/dc3545?text=Image+Access+Error:%20${fileId.substring(0, 10)}...`;
            this.src = errorUrl;
            this.onerror = null; // Stop trying
            this.classList.add('error-image');
            
            // Add a title tooltip with troubleshooting info
            this.title = "Image failed to load. Please verify: 1) Image is shared with 'Anyone with the link', 2) File ID is correct, 3) File exists";
            
            // Create and display a help icon/button
            const parent = this.parentElement;
            if (parent) {
                const helpButton = document.createElement('button');
                helpButton.innerHTML = 'Image Loading Help';
                helpButton.className = 'image-error-help';
                helpButton.title = "Click for troubleshooting tips";
                helpButton.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showImageLoadingHelp(fileId, originalUrl);
                };
                parent.appendChild(helpButton);
            }
        }
        else {
            // If we're not using a recognized format, start with the new usercontent format
            this.src = `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
        }
    };
    
    // Start with the recommended new format
    imgElement.src = `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
}

// Function to show a helpful modal with troubleshooting information
function showImageLoadingHelp(fileId, originalUrl) {
    // Create a modal dialog
    const modal = document.createElement('div');
    modal.className = 'image-help-modal';
    modal.innerHTML = `
        <div class="image-help-content">
            <h3>Image Loading Troubleshooting</h3>
            <p>An image failed to load correctly. Here's how to fix it:</p>
            
            <h4>Google Drive Sharing Settings</h4>
            <ol>
                <li>Open Google Drive and locate your image</li>
                <li>Right-click the file and select "Share"</li>
                <li>Change access to "Anyone with the link"</li>
                <li>Copy the link and use it in your carousel</li>
            </ol>
            
            <div class="image-details">
                <p><strong>File ID:</strong> ${fileId}</p>
                <p><strong>Original URL:</strong> ${originalUrl}</p>
                <p><strong>Recommended URL format:</strong> https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0</p>
            </div>
            
            <div class="help-tools">
                <button id="test-image-btn">Test Image</button>
                <button id="drive-url-btn">Open URL Tool</button>
                <button id="close-help-modal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('#close-help-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#test-image-btn').addEventListener('click', () => {
        window.open(`image-debugger.html?url=${encodeURIComponent(originalUrl)}`, '_blank');
    });
    
    modal.querySelector('#drive-url-btn').addEventListener('click', () => {
        window.open('drive-url-tool.html', '_blank');
    });
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Generate carousel HTML from an array of images
function generateCarouselHtml(images) {
    if (!images || !images.length) {
        return '<div class="alert alert-info">No carousel images have been added yet.</div>';
    }
    
    let html = `
        <div class="simple-carousel">
            <div class="carousel-container">
                <div class="carousel-track">
    `;
    
    // Generate slide HTML for each image
    images.forEach((image, i) => {
        const isActive = i === 0 ? 'active' : '';
        
        // Get appropriate image source sizes for responsive display
        const imgSrc = image.url;
        const thumbnailSrc = image.responsive ? image.responsive.small : image.thumbnail || image.url;
        const largeSrc = image.responsive ? image.responsive.large : image.url;
        
        html += `
            <div class="carousel-slide ${isActive}">
                <div class="image-container bg-white rounded-lg shadow-md overflow-hidden">
                    <img src="${thumbnailSrc}" 
                         alt="${image.altText || image.caption || 'Carousel image'}" 
                         data-fullsize="${largeSrc}" 
                         class="adaptive-carousel-image loading"
                         srcset="${image.responsive ? `
                            ${image.responsive.thumbnail} 300w, 
                            ${image.responsive.small} 640w, 
                            ${image.responsive.medium} 800w, 
                            ${image.responsive.large} 1200w
                         ` : ''}"
                         sizes="(max-width: 640px) 100vw, (max-width: 1023px) 50vw, 33vw"
                         onload="this.classList.remove('loading'); this.classList.add('loaded')">
                    <div class="p-3">
                        <h4 class="text-lg font-bold">${image.title || image.caption || 'Image ' + (i+1)}</h4>
                        <p class="text-sm text-gray-600">${image.description || ''}</p>
                        <div class="mt-2 flex justify-between">
                            <div>
                                <span class="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">Order: ${image.order || i+1}</span>
                            </div>
                            <div class="flex space-x-1">
                                <button class="edit-image-btn bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center" 
                                        data-id="${image.id}" onclick="editCarouselImage('${image.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-image-btn bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center" 
                                        data-id="${image.id}" onclick="deleteCarouselImage('${image.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Complete the carousel structure
    html += `
                </div>
                <button class="carousel-btn prev-btn">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-btn next-btn">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="carousel-dots">
    `;
    
    // Add dots for pagination
    images.forEach((_, i) => {
        const isActive = i === 0 ? 'active' : '';
        html += `<div class="carousel-dot ${isActive}" data-index="${i}"></div>`;
    });
    
    html += `
            </div>
        </div>
        <div id="lightbox" class="lightbox">
            <img id="lightbox-img" class="lightbox-img">
            <span class="lightbox-close">&times;</span>
        </div>
    `;
    
    return html;
}

// Initialize lightbox functionality
function initLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.style.display = 'none';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <span class="close-btn">&times;</span>
            <img id="lightbox-img" src="" alt="Enlarged image">
            <button id="test-image-btn" style="position:absolute; bottom:10px; right:10px; background:#007bff; color:white; border:none; padding:5px 10px; cursor:pointer;">Debug Image</button>
        </div>
    `;
    document.body.appendChild(lightbox);

    // Close lightbox when clicking the close button or outside the image
    lightbox.querySelector('.close-btn').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Add event listener for the test image button
    document.getElementById('test-image-btn').addEventListener('click', function() {
        window.testCurrentImage();
    });
}

// Test image URL function for debugging
function testImageUrl(url) {
    const result = enhancedImageProcessor(url);
    console.log("==== Image URL Test ====");
    console.log("Original URL:", url);
    console.log("Processed result:", result);
    
    // Create test elements to verify loading
    const testContainer = document.createElement('div');
    testContainer.style.position = 'fixed';
    testContainer.style.bottom = '10px';
    testContainer.style.right = '10px';
    testContainer.style.backgroundColor = 'white';
    testContainer.style.padding = '10px';
    testContainer.style.border = '1px solid black';
    testContainer.style.zIndex = '9999';
    testContainer.style.maxWidth = '300px';
    testContainer.style.maxHeight = '300px';
    testContainer.style.overflow = 'auto';
    
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.style.marginBottom = '10px';
    close.onclick = () => testContainer.remove();
    testContainer.appendChild(close);
    
    const title = document.createElement('div');
    title.textContent = 'Image URL Test';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    testContainer.appendChild(title);
    
    const originalUrlDisplay = document.createElement('div');
    originalUrlDisplay.textContent = `Original: ${url}`;
    originalUrlDisplay.style.marginBottom = '5px';
    originalUrlDisplay.style.wordBreak = 'break-all';
    testContainer.appendChild(originalUrlDisplay);
    
    // Test each URL format
    const formats = {
        'Thumbnail': result.thumbnail,
        'Full Res': result.fullRes,
        'Direct URL': result.directUrl,
        'Preview': result.previewUrl
    };
    
    Object.entries(formats).forEach(([label, testUrl]) => {
        if (!testUrl) return;
        
        const formatContainer = document.createElement('div');
        formatContainer.style.marginBottom = '15px';
        formatContainer.style.borderTop = '1px solid #ccc';
        formatContainer.style.paddingTop = '5px';
        
        const formatLabel = document.createElement('div');
        formatLabel.textContent = label;
        formatLabel.style.fontWeight = 'bold';
        formatContainer.appendChild(formatLabel);
        
        const formatUrl = document.createElement('div');
        formatUrl.textContent = testUrl;
        formatUrl.style.fontSize = '10px';
        formatUrl.style.wordBreak = 'break-all';
        formatUrl.style.marginBottom = '5px';
        formatContainer.appendChild(formatUrl);
        
        const testImg = document.createElement('img');
        testImg.src = testUrl;
        testImg.style.maxWidth = '100%';
        testImg.style.height = 'auto';
        testImg.style.border = '1px solid #ccc';
        testImg.onerror = () => {
            testImg.style.display = 'none';
            const error = document.createElement('div');
            error.textContent = 'Failed to load image';
            error.style.color = 'red';
            formatContainer.appendChild(error);
        };
        formatContainer.appendChild(testImg);
        
        testContainer.appendChild(formatContainer);
    });
    
    document.body.appendChild(testContainer);
    return result;
}

// Add to window object for console access
window.testImageUrl = testImageUrl;

// Add this to global scope
window.initializeCarousels = initializeCarousels;
window.generateCarouselHtml = generateCarouselHtml;
window.initLightbox = initLightbox;
window.processImageUrl = enhancedImageProcessor;
window.extractGoogleDriveId = extractGoogleDriveId;
window.setupGoogleDriveImageFallback = setupGoogleDriveImageFallback;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeCarousels();
    initLightbox();
});

// Add global function to test image URLs
window.testImageUrl = function(url) {
    console.log("Testing image URL:", url);
    
    // Create a test image element
    const testImg = new Image();
    
    testImg.onload = function() {
        console.log("✓ Image loaded successfully:", url);
        console.log("Image dimensions:", testImg.width, "x", testImg.height);
        alert("Image loaded successfully! Dimensions: " + testImg.width + "x" + testImg.height);
    };
    
    testImg.onerror = function() {
        console.error("✗ Failed to load image:", url);
        alert("Failed to load image. Check console for details.");
        
        // Try to diagnose the issue
        if (url.includes("drive.google.com")) {
            console.log("Google Drive URL detected. Checking if it's in the correct format...");
            
            if (url.includes("id=")) {
                const fileId = url.split("id=")[1].split("&")[0];
                console.log("File ID:", fileId);
                console.log("Proper format should be: https://drive.google.com/uc?export=view&id=" + fileId);
            } else if (url.includes("/d/")) {
                const fileId = url.split("/d/")[1].split("/")[0];
                console.log("File ID:", fileId);
                console.log("Proper format should be: https://drive.google.com/uc?export=view&id=" + fileId);
            }
            
            console.log("Make sure the file is publicly accessible in Google Drive.");
        }
    };
    
    // Start loading the image
    testImg.src = url;
    
    // Attempt to fetch the image to check for CORS or other HTTP errors
    fetch(url, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status}`);
            } else {
                console.log("HTTP request successful:", response.status);
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
        
    return "Testing image: " + url;
};

// Function to test the current image in the lightbox
window.testCurrentImage = function() {
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightboxImg) {
        console.error("Lightbox image element not found");
        return;
    }

    // Get both the current src and the original URL if available
    const currentSrc = lightboxImg.src;
    const originalUrl = lightboxImg.getAttribute('data-original-url') || currentSrc;
    
    console.log("==== Testing Lightbox Image ====");
    console.log("Current src:", currentSrc);
    console.log("Original URL:", originalUrl);
    
    // Create a debug panel
    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.top = '20px';
    debugPanel.style.right = '20px';
    debugPanel.style.backgroundColor = 'white';
    debugPanel.style.border = '2px solid #007bff';
    debugPanel.style.borderRadius = '8px';
    debugPanel.style.padding = '15px';
    debugPanel.style.zIndex = '10000';
    debugPanel.style.maxWidth = '500px';
    debugPanel.style.maxHeight = '80vh';
    debugPanel.style.overflow = 'auto';
    debugPanel.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
    
    // Add a close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '5px';
    closeBtn.style.right = '5px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => debugPanel.remove();
    debugPanel.appendChild(closeBtn);
    
    // Add header
    const header = document.createElement('h3');
    header.textContent = 'Image Debug Info';
    header.style.margin = '0 0 15px 0';
    header.style.borderBottom = '1px solid #ccc';
    header.style.paddingBottom = '5px';
    debugPanel.appendChild(header);
    
    // Add image info
    const addInfoRow = (label, value) => {
        const row = document.createElement('div');
        row.style.marginBottom = '10px';
        
        const labelEl = document.createElement('strong');
        labelEl.textContent = label + ': ';
        row.appendChild(labelEl);
        
        const valueEl = document.createElement('span');
        valueEl.textContent = value;
        valueEl.style.wordBreak = 'break-all';
        row.appendChild(valueEl);
        
        debugPanel.appendChild(row);
        return valueEl;
    };
    
    addInfoRow('Current src', currentSrc);
    addInfoRow('Original URL', originalUrl);
    
    // Process the image URL
    const processedUrls = enhancedImageProcessor(originalUrl);
    
    // Add processed URLs section
    const processedSection = document.createElement('div');
    processedSection.style.marginTop = '15px';
    processedSection.style.borderTop = '1px solid #ccc';
    processedSection.style.paddingTop = '10px';
    
    const processedTitle = document.createElement('h4');
    processedTitle.textContent = 'Processed URLs';
    processedTitle.style.margin = '0 0 10px 0';
    processedSection.appendChild(processedTitle);
    
    debugPanel.appendChild(processedSection);
    
    // Add each processed URL type
    for (const [type, url] of Object.entries(processedUrls)) {
        if (!url || type === 'note') continue;
        
        const urlContainer = document.createElement('div');
        urlContainer.style.marginBottom = '15px';
        
        const urlLabel = document.createElement('div');
        urlLabel.innerHTML = `<strong>${type}:</strong> <span style="font-size: 12px; word-break: break-all;">${url}</span>`;
        urlContainer.appendChild(urlLabel);
        
        // Create test image
        const imgContainer = document.createElement('div');
        imgContainer.style.marginTop = '5px';
        imgContainer.style.border = '1px solid #ccc';
        imgContainer.style.borderRadius = '4px';
        imgContainer.style.padding = '5px';
        imgContainer.style.position = 'relative';
        
        const statusEl = document.createElement('div');
        statusEl.textContent = 'Loading...';
        statusEl.style.textAlign = 'center';
        statusEl.style.padding = '10px';
        imgContainer.appendChild(statusEl);
        
        const testImg = new Image();
        testImg.style.maxWidth = '100%';
        testImg.style.maxHeight = '200px';
        testImg.style.display = 'block';
        testImg.style.margin = '10px auto';
        testImg.style.display = 'none'; // Hide until loaded
        
        testImg.onload = function() {
            statusEl.textContent = `✓ Loaded (${this.naturalWidth}x${this.naturalHeight})`;
            statusEl.style.color = 'green';
            testImg.style.display = 'block';
        };
        
        testImg.onerror = function() {
            statusEl.textContent = '✗ Failed to load';
            statusEl.style.color = 'red';
            
            // Add "Test direct" button
            const testBtn = document.createElement('button');
            testBtn.textContent = 'Open in new tab';
            testBtn.style.padding = '5px 10px';
            testBtn.style.marginTop = '5px';
            testBtn.style.backgroundColor = '#007bff';
            testBtn.style.color = 'white';
            testBtn.style.border = 'none';
            testBtn.style.borderRadius = '4px';
            testBtn.style.cursor = 'pointer';
            testBtn.onclick = () => window.open(url, '_blank');
            imgContainer.appendChild(testBtn);
        };
        
        // Start loading image
        testImg.src = url;
        imgContainer.appendChild(testImg);
        urlContainer.appendChild(imgContainer);
        
        // Try fetch request to check headers
        fetch(url, { method: 'HEAD' })
            .then(response => {
                const status = document.createElement('div');
                if (response.ok) {
                    status.textContent = `✓ HTTP request successful (${response.status})`;
                    status.style.color = 'green';
                } else {
                    status.textContent = `✗ HTTP error (${response.status})`;
                    status.style.color = 'red';
                }
                status.style.fontSize = '12px';
                status.style.marginTop = '5px';
                imgContainer.appendChild(status);
                
                // Try to show content type if available
                response.headers.forEach((value, key) => {
                    if (key.toLowerCase() === 'content-type') {
                        const typeInfo = document.createElement('div');
                        typeInfo.textContent = `Content-Type: ${value}`;
                        typeInfo.style.fontSize = '12px';
                        imgContainer.appendChild(typeInfo);
                    }
                });
            })
            .catch(error => {
                const status = document.createElement('div');
                status.textContent = `✗ Fetch error: ${error.message}`;
                status.style.color = 'red';
                status.style.fontSize = '12px';
                status.style.marginTop = '5px';
                imgContainer.appendChild(status);
            });
        
        processedSection.appendChild(urlContainer);
    }
    
    // Recommendations section
    if (originalUrl.includes('drive.google.com')) {
        const recSection = document.createElement('div');
        recSection.style.marginTop = '15px';
        recSection.style.borderTop = '1px solid #ccc';
        recSection.style.paddingTop = '10px';
        
        const recTitle = document.createElement('h4');
        recTitle.textContent = 'Google Drive Recommendations';
        recTitle.style.margin = '0 0 10px 0';
        recSection.appendChild(recTitle);
        
        const recText = document.createElement('ul');
        recText.innerHTML = `
            <li>Make sure the file is publicly accessible (Anyone with the link can view)</li>
            <li>For best results, use the format: https://drive.google.com/uc?export=view&id=FILE_ID</li>
            <li>For thumbnails, use: https://drive.google.com/thumbnail?id=FILE_ID&sz=w800</li>
            <li>If you recently shared the file, wait a few minutes for Google to process permissions</li>
        `;
        recText.style.paddingLeft = '20px';
        recText.style.fontSize = '14px';
        recSection.appendChild(recText);
        
        debugPanel.appendChild(recSection);
    }
    
    // Add to document
    document.body.appendChild(debugPanel);
    
    // Return processed results
    return processedUrls;
};

// Carousel functionality
function setupCarousels() {
    console.log("Setting up carousels...");
    
    // Global tracking for failed images
    window.failedImages = window.failedImages || [];
    window.successfulImages = window.successfulImages || [];
    
    // Debug info for troubleshooting
    console.log("Current page URL:", window.location.href);

    // Log all carousel containers on the page
    const allCarousels = document.querySelectorAll('.carousel-container, .swiper-wrapper, .swiper');
    console.log(`Found ${allCarousels.length} possible carousel containers:`, 
        Array.from(allCarousels).map(el => ({
            className: el.className,
            id: el.id,
            childCount: el.children.length
        }))
    );

    // Process Google Drive URLs for all images
    processGoogleDriveImages();
}

// Function to process all Google Drive images on the page
function processGoogleDriveImages() {
    // Get all images
    const images = document.querySelectorAll('img');
    console.log(`Found ${images.length} images on the page`);
    
    // Track progress
    let processed = 0;
    let googleDriveImages = 0;
    
    // Process each image
    images.forEach((img, index) => {
        const originalSrc = img.getAttribute('src') || '';
        const dataSrc = img.getAttribute('data-src') || '';
        
        // Use data-src if available (for lazy loading), otherwise use src
        const currentSrc = dataSrc || originalSrc;
        
        // Check if it's a Google Drive URL
        if (isGoogleDriveUrl(currentSrc)) {
            googleDriveImages++;
            
            console.log(`Image ${index}: Processing Google Drive image:`, {
                originalSrc: originalSrc,
                dataSrc: dataSrc,
                element: img,
                parent: img.parentElement ? img.parentElement.className : 'none'
            });
            
            // Get the processed URL
            const newSrc = processGoogleDriveUrl(currentSrc);
            
            // Update both src and data-src attributes
            if (dataSrc) {
                img.setAttribute('data-src', newSrc);
                // Also set src for immediate display if needed
                img.setAttribute('src', newSrc);
            } else {
                img.setAttribute('src', newSrc);
            }
            
            // Add event listeners to track loading success/failure
            img.addEventListener('load', () => {
                console.log(`✅ Image loaded successfully:`, newSrc);
                window.successfulImages.push({ originalSrc, newSrc });
            });
            
            img.addEventListener('error', () => {
                console.log(`❌ Image failed to load:`, newSrc);
                window.failedImages.push({ originalSrc, newSrc });
                
                // Try alternative formats
                tryAlternativeFormats(img, currentSrc);
            });
        }
        
        processed++;
    });
    
    console.log(`Processed ${processed} total images, found ${googleDriveImages} Google Drive images`);
}

// Try alternative formats for failed images
function tryAlternativeFormats(imgElement, originalSrc) {
    // Extract file ID
    const fileId = extractGoogleDriveFileId(originalSrc);
    if (!fileId) return;
    
    console.log(`Trying alternative formats for file ID: ${fileId}`);
    
    // Define alternative formats to try
    const alternativeFormats = [
        `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`,
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
    ];
    
    // Try each format
    let currentIndex = 0;
    
    function tryNextFormat() {
        if (currentIndex >= alternativeFormats.length) {
            console.log(`All alternative formats failed for: ${originalSrc}`);
            return;
        }
        
        const formatUrl = alternativeFormats[currentIndex];
        console.log(`Trying format ${currentIndex + 1}/${alternativeFormats.length}: ${formatUrl}`);
        
        // Update image src
        imgElement.src = formatUrl;
        
        // Move to next format if this one fails
        currentIndex++;
    }
    
    // Set up event listeners
    imgElement.addEventListener('error', tryNextFormat, { once: true });
    
    // Start trying formats
    tryNextFormat();
}

// Check if URL is a Google Drive URL
function isGoogleDriveUrl(url) {
    if (!url) return false;
    return url.includes('drive.google.com') || 
           url.includes('googleusercontent.com') ||
           url.includes('docs.google.com');
}

// Extract file ID from Google Drive URL
function extractGoogleDriveFileId(url) {
    if (!url) return null;
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
    if (fileMatch) return fileMatch[1];
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
    if (openMatch) return openMatch[1];
    
    // Format: https://drive.google.com/uc?export=view&id=FILE_ID
    const ucMatch = url.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
    if (ucMatch) return ucMatch[1];
    
    // Format: https://drive.google.com/d/FILE_ID/
    const directMatch = url.match(/\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
    if (directMatch) return directMatch[1];
    
    return null;
}

// Process Google Drive URL to make it viewable
function processGoogleDriveUrl(url) {
    // If not a Google Drive URL, return as is
    if (!isGoogleDriveUrl(url)) {
        return url;
    }
    
    console.log("Processing Google Drive URL:", url);
    
    // If already using the usercontent format, return as is
    if (url.includes('drive.usercontent.google.com')) {
        return url;
    }
    
    // Extract file ID
    const fileId = extractGoogleDriveFileId(url);
    
    if (!fileId) {
        console.warn("Could not extract file ID from URL:", url);
        return url;
    }
    
    console.log("Extracted file ID:", fileId);
    
    // Use the most reliable format: drive.usercontent.google.com
    const newUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
    
    console.log("Converted URL:", newUrl);
    return newUrl;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', setupCarousels);

// Also expose for direct calling
window.setupCarousels = setupCarousels;
window.processGoogleDriveImages = processGoogleDriveImages;

// Make these functions available globally
window.setupCarousels = function() {
    const currentUrl = window.location.href;
    console.log("Setting up carousels on page:", currentUrl);
    
    // Check if we're on a case study page
    const isOnCaseStudyPage = currentUrl.includes('case_study.html');
    console.log("Is on case study page:", isOnCaseStudyPage);
    
    const carouselContainers = document.querySelectorAll('.carousel-container');
    console.log(`Found ${carouselContainers.length} carousel containers on the page`);
    
    if (carouselContainers.length === 0) {
        console.log("No carousel containers found on this page");
        return;
    }
    
    carouselContainers.forEach((container, index) => {
        console.log(`Setting up carousel #${index + 1}`);
        const slides = container.querySelectorAll('.carousel-slide');
        console.log(`Carousel #${index + 1} has ${slides.length} slides`);
        
        // Log image sources in this carousel
        const carouselImages = container.querySelectorAll('img');
        console.log(`Carousel #${index + 1} has ${carouselImages.length} images`);
        carouselImages.forEach((img, imgIndex) => {
            console.log(`Carousel #${index + 1}, Image #${imgIndex + 1}:`, {
                src: img.getAttribute('src'),
                dataSrc: img.getAttribute('data-src'),
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            });
            
            // Add load event listeners to track image loading
            img.addEventListener('load', () => {
                console.log(`✅ Image loaded successfully:`, img.src);
            });
            
            img.addEventListener('error', () => {
                console.error(`❌ Image failed to load:`, img.src);
                // Try to recover with alternative formats if it's a Google Drive URL
                if (window.isGoogleDriveUrl && window.isGoogleDriveUrl(img.src)) {
                    window.tryAlternativeFormats(img);
                }
            });
        });
        
        // Look for the Swiper container
        const swiperContainer = container.querySelector('.swiper-container');
        if (swiperContainer) {
            console.log(`Carousel #${index + 1} has a Swiper container`);
            // This will be handled by the Swiper initialization code
        } else {
            console.log(`Carousel #${index + 1} does not have a Swiper container, initializing custom carousel`);
            // Initialize non-Swiper carousel
            setupNonSwiperCarousel(container, index);
        }
    });
};

// Helper function for non-Swiper carousels
function setupNonSwiperCarousel(container, carouselIndex) {
    const slides = container.querySelectorAll('.carousel-slide');
    const dots = container.querySelectorAll('.carousel-dot');
    const prevBtn = container.querySelector('.prev-button');
    const nextBtn = container.querySelector('.next-button');
    
    if (slides.length === 0) {
        console.warn(`No slides found for carousel #${carouselIndex + 1}`);
        return;
    }
    
    let currentSlide = 0;
    
    // Function to show a specific slide
    function showSlide(index) {
        console.log(`Showing slide ${index + 1} of ${slides.length} for carousel #${carouselIndex + 1}`);
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        currentSlide = index;
    }
    
    // Set up click handlers for dots
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
        });
    });
    
    // Set up click handlers for navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });
    }
    
    // Initialize the carousel
    showSlide(0);
}

// Function to process all Google Drive images on the page
window.processGoogleDriveImages = function() {
    console.log("Processing Google Drive images on page");
    const images = document.querySelectorAll('img');
    console.log(`Found ${images.length} total images to process`);
    
    let gdImageCount = 0;
    
    images.forEach((img, index) => {
        const src = img.getAttribute('src');
        const dataSrc = img.getAttribute('data-src');
        
        // Process src attribute
        if (src && window.isGoogleDriveUrl(src)) {
            gdImageCount++;
            console.log(`Processing Google Drive image #${gdImageCount} (${src})`);
            const newSrc = window.processGoogleDriveUrl(src);
            console.log(`Updated src: ${newSrc}`);
            img.setAttribute('src', newSrc);
        }
        
        // Process data-src attribute (for lazy loaded images)
        if (dataSrc && window.isGoogleDriveUrl(dataSrc)) {
            const newDataSrc = window.processGoogleDriveUrl(dataSrc);
            console.log(`Updated data-src: ${newDataSrc}`);
            img.setAttribute('data-src', newDataSrc);
        }
        
        // Add load event listeners
        img.addEventListener('load', () => {
            console.log(`✅ Image loaded successfully:`, img.src);
        });
        
        img.addEventListener('error', () => {
            console.error(`❌ Image failed to load:`, img.src);
            // Try alternative formats for Google Drive URLs
            if (window.isGoogleDriveUrl(img.src)) {
                window.tryAlternativeFormats(img);
            }
        });
    });
    
    console.log(`Processed ${gdImageCount} Google Drive images out of ${images.length} total images`);
};

// Try alternative formats for Google Drive images
window.tryAlternativeFormats = function(img) {
    console.log(`Trying alternative formats for: ${img.src}`);
    const src = img.getAttribute('src');
    
    if (!window.isGoogleDriveUrl(src)) {
        console.log(`Not a Google Drive URL, skipping: ${src}`);
        return;
    }
    
    const fileId = window.extractGoogleDriveFileId(src);
    if (!fileId) {
        console.warn(`Could not extract file ID from: ${src}`);
        return;
    }
    
    // Try different export formats
    const formats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    let currentFormatIndex = 0;
    
    function tryNextFormat() {
        if (currentFormatIndex >= formats.length) {
            console.error(`All formats failed for image: ${src}`);
            // Show a placeholder or error image
            img.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
            return;
        }
        
        const format = formats[currentFormatIndex];
        const newUrl = `https://drive.google.com/uc?export=view&id=${fileId}&format=${format}`;
        console.log(`Trying format ${format}: ${newUrl}`);
        
        img.src = newUrl;
        currentFormatIndex++;
        
        // Check if this format works after a short delay
        setTimeout(() => {
            if (!img.complete || img.naturalWidth === 0) {
                console.log(`Format ${format} failed, trying next format`);
                tryNextFormat();
            } else {
                console.log(`✅ Format ${format} succeeded for file ID: ${fileId}`);
            }
        }, 1000);
    }
    
    tryNextFormat();
};

// Check if a URL is a Google Drive URL
window.isGoogleDriveUrl = function(url) {
    if (!url) return false;
    
    // Check for common Google Drive URL patterns
    return url.includes('drive.google.com') || 
           url.includes('googleusercontent.com') ||
           url.includes('docs.google.com');
};

// Extract the file ID from a Google Drive URL
window.extractGoogleDriveFileId = function(url) {
    if (!url) return null;
    
    console.log(`Extracting file ID from: ${url}`);
    
    // Pattern 1: https://drive.google.com/file/d/FILE_ID/view
    let match = url.match(/\/file\/d\/([^\/]+)/);
    if (match) return match[1];
    
    // Pattern 2: https://drive.google.com/uc?export=view&id=FILE_ID
    match = url.match(/[?&]id=([^&]+)/);
    if (match) return match[1];
    
    // Pattern 3: https://drive.google.com/open?id=FILE_ID
    match = url.match(/open\?id=([^&]+)/);
    if (match) return match[1];
    
    console.warn(`Could not extract file ID from URL: ${url}`);
    return null;
};

// Process a Google Drive URL to a directly viewable format
window.processGoogleDriveUrl = function(url) {
    if (!window.isGoogleDriveUrl(url)) {
        return url; // Not a Google Drive URL, return as is
    }
    
    const fileId = window.extractGoogleDriveFileId(url);
    if (!fileId) {
        console.warn(`Could not extract file ID from: ${url}`);
        return url; // Could not extract file ID, return as is
    }
    
    // Convert to a direct download link
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', window.setupCarousels); 