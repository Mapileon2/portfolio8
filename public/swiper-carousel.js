/**
 * Swiper Carousel Upgrade
 * 
 * This script enhances the existing simple carousel with Swiper.js functionality
 * while maintaining backward compatibility with the original implementation.
 */

// Convert existing simple carousels to Swiper carousels
function convertToSwiperCarousels() {
    // Find all simple carousels on the page
    const carousels = document.querySelectorAll('.simple-carousel:not(.swiper)');
    
    // Convert each carousel to Swiper
    carousels.forEach(carousel => {
        convertToSwiper(carousel);
    });
    
    console.log(`Converted ${carousels.length} simple carousels to Swiper`);
}

// Convert a single carousel to Swiper
function convertToSwiper(carousel) {
    // Store original HTML for possible fallback
    const originalHTML = carousel.innerHTML;
    carousel.setAttribute('data-original-html', originalHTML);
    
    // Get the original elements
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    
    if (!track || !slides.length) {
        console.error("Invalid carousel structure, missing track or slides");
        return;
    }
    
    // Create Swiper structure
    const swiperContainer = document.createElement('div');
    swiperContainer.className = 'swiper swiper-carousel';
    
    // Create wrapper element
    const swiperWrapper = document.createElement('div');
    swiperWrapper.className = 'swiper-wrapper';
    
    // Move slides to Swiper wrapper
    slides.forEach(slide => {
        const swiperSlide = document.createElement('div');
        swiperSlide.className = 'swiper-slide';
        
        // Enhance image responsiveness
        const img = slide.querySelector('img');
        if (img) {
            // Create a new image with responsive classes
            const newImg = document.createElement('img');
            newImg.className = 'adaptive-carousel-image loading';
            
            // Copy important attributes
            newImg.src = img.src;
            newImg.alt = img.alt || 'Carousel image';
            
            // Add data attributes
            if (img.dataset.fullsize) {
                newImg.dataset.fullsize = img.dataset.fullsize;
            }
            
            // Add responsive loading
            newImg.onload = function() {
                this.classList.remove('loading');
                this.classList.add('loaded');
            };
            
            // Replace the original image
            const imgContainer = slide.querySelector('.image-container') || slide;
            if (imgContainer !== slide && imgContainer.contains(img)) {
                imgContainer.replaceChild(newImg, img);
                swiperSlide.appendChild(imgContainer.cloneNode(true));
            } else {
                const newContainer = document.createElement('div');
                newContainer.className = 'image-container adaptive-container';
                newContainer.appendChild(newImg);
                swiperSlide.appendChild(newContainer);
            }
        } else {
            // If no image, just clone the slide
            swiperSlide.appendChild(slide.cloneNode(true));
        }
        swiperWrapper.appendChild(swiperSlide);
    });
    
    // Add navigation and pagination
    const prevBtn = carousel.querySelector('.prev-btn');
    const nextBtn = carousel.querySelector('.next-btn');
    
    // Create navigation buttons if they don't exist
    const prevBtnClass = prevBtn ? prevBtn.className : '';
    const nextBtnClass = nextBtn ? nextBtn.className : '';
    
    const prevBtnEl = document.createElement('div');
    prevBtnEl.className = `swiper-button-prev ${prevBtnClass}`;
    
    const nextBtnEl = document.createElement('div');
    nextBtnEl.className = `swiper-button-next ${nextBtnClass}`;
    
    // Create pagination
    const paginationEl = document.createElement('div');
    paginationEl.className = 'swiper-pagination';
    
    // Assemble the new Swiper structure
    swiperContainer.appendChild(swiperWrapper);
    swiperContainer.appendChild(prevBtnEl);
    swiperContainer.appendChild(nextBtnEl);
    swiperContainer.appendChild(paginationEl);
    
    // Replace the original carousel
    carousel.innerHTML = '';
    carousel.appendChild(swiperContainer);
    carousel.classList.add('swiper-converted');
    
    // Initialize Swiper
    try {
        let slidesPerView = 1;
        // Determine slides per view based on screen width
        if (window.innerWidth >= 1024) {
            slidesPerView = 3;
        } else if (window.innerWidth >= 640) {
            slidesPerView = 2;
        }
        
        const swiper = new Swiper(swiperContainer, {
            slidesPerView: 'auto',
            spaceBetween: 15,
            centeredSlides: window.innerWidth < 640,
            effect: "slide",
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: paginationEl,
                clickable: true,
            },
            navigation: {
                nextEl: nextBtnEl,
                prevEl: prevBtnEl,
            },
            breakpoints: {
                // Mobile
                320: {
                    slidesPerView: 1.2,
                    centeredSlides: true,
                    spaceBetween: 10,
                },
                // Tablet
                640: {
                    slidesPerView: 2.2,
                    centeredSlides: false,
                    spaceBetween: 20,
                },
                // Desktop
                1024: {
                    slidesPerView: 3.2,
                    spaceBetween: 30,
                },
            },
            lazy: {
                loadPrevNext: true,
                loadPrevNextAmount: 2,
            },
            on: {
                init: function() {
                    console.log('Swiper initialized:', carousel.id || 'unnamed carousel');
                },
                click: function(swiper, event) {
                    // Handle click on slide if needed
                    // Maintain original click behavior for lightbox
                    const clickedSlide = event.target.closest('.swiper-slide');
                    if (clickedSlide) {
                        const img = clickedSlide.querySelector('img');
                        if (img && img.dataset.fullsize) {
                            const lightbox = document.getElementById('lightbox');
                            const lightboxImg = document.getElementById('lightbox-img');
                            if (lightbox && lightboxImg) {
                                lightboxImg.src = img.dataset.fullsize;
                                lightboxImg.setAttribute('data-original-url', img.dataset.fullsize);
                                lightbox.classList.remove('hidden');
                                document.body.style.overflow = 'hidden';
                            }
                        }
                    }
                },
                resize: function(swiper) {
                    // Update slides per view on resize
                    if (window.innerWidth < 640) {
                        swiper.params.centeredSlides = true;
                    } else {
                        swiper.params.centeredSlides = false;
                    }
                    swiper.update();
                }
            }
        });
        
        // Store swiper instance on the element for future reference
        carousel.swiper = swiper;
        
    } catch (error) {
        console.error("Error initializing Swiper:", error);
        // Fallback to original carousel
        fallbackToSimpleCarousel(carousel);
    }
}

// Fallback to original carousel if Swiper fails
function fallbackToSimpleCarousel(carousel) {
    console.warn("Falling back to simple carousel for:", carousel.id || 'unnamed carousel');
    if (typeof initializeCarousels === 'function') {
        // Reset the carousel to original structure first
        const originalHTML = carousel.getAttribute('data-original-html');
        if (originalHTML) {
            carousel.innerHTML = originalHTML;
            carousel.classList.remove('swiper-converted');
            // Initialize with the original function
            initCarousel(carousel);
        }
    }
}

// Auto-recover Google Drive images
function autoRecoverGoogleDriveImages() {
    // Find all images with error class
    const errorImages = document.querySelectorAll('img.error-image');
    
    console.log(`Found ${errorImages.length} error images to attempt recovery`);
    
    errorImages.forEach((img, index) => {
        // Get the original URL if available
        const originalUrl = img.getAttribute('data-original-url') || img.src;
        
        // Check if it's a Google Drive URL
        if (originalUrl.includes('drive.google.com')) {
            console.log(`Attempting to recover Google Drive image #${index}:`, originalUrl);
            
            // Extract file ID
            let fileId = null;
            
            // Format: https://drive.google.com/file/d/FILE_ID/view
            const fileMatch = originalUrl.match(/\/file\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
            if (fileMatch) fileId = fileMatch[1];
            
            // Format: https://drive.google.com/open?id=FILE_ID
            const openMatch = originalUrl.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
            if (!fileId && openMatch) fileId = openMatch[1];
            
            // Format: https://drive.google.com/uc?export=view&id=FILE_ID
            const ucMatch = originalUrl.match(/[?&]id=([A-Za-z0-9_-]+)(?:&|$)/);
            if (!fileId && ucMatch) fileId = ucMatch[1];
            
            // Format: https://drive.google.com/d/FILE_ID/
            const directMatch = originalUrl.match(/\/d\/([A-Za-z0-9_-]+)(?:\/|\?|$)/);
            if (!fileId && directMatch) fileId = directMatch[1];
            
            if (fileId) {
                console.log(`Found Google Drive file ID ${fileId}, trying alternative formats`);
                
                // Set progressive fallback
                img.onerror = function() {
                    // Try the next format if this one fails
                    const currentSrc = this.src;
                    
                    if (currentSrc.includes('drive.usercontent.google.com')) {
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
                                if (typeof window.showImageLoadingHelp === 'function') {
                                    window.showImageLoadingHelp(fileId, originalUrl);
                                } else {
                                    alert(`Image failed to load. File ID: ${fileId}\nPlease make sure the image is shared with "Anyone with the link".`);
                                }
                            };
                            parent.appendChild(helpButton);
                        }
                    }
                };
                
                // Start with the new usercontent format which has better CORS support
                img.src = `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
                console.log('Trying new usercontent format:', img.src);
            }
        }
    });
}

// Generate Swiper carousel HTML from images array
function generateSwiperCarouselHtml(images) {
    if (!images || !images.length) {
        return '<div class="text-center text-gray-500 py-8">No images available</div>';
    }
    
    // Create HTML structure
    let html = `
    <div class="swiper swiper-carousel">
        <div class="swiper-wrapper">`;
    
    // Add slides
    images.forEach(image => {
        // Get the image URL (handle both string and object formats)
        const imageSource = image.url || image;
        
        // Process the image URL to ensure it's valid
        let processedImage;
        if (typeof window.processImageUrl === 'function') {
            processedImage = window.processImageUrl(imageSource);
        } else {
            // Simple fallback if the main processor isn't available
            processedImage = {
                thumbnail: imageSource,
                fullRes: imageSource
            };
        }
        
        // Log for debugging
        console.log("Processing image:", imageSource);
        console.log("Processed result:", processedImage);
        
        // Extract file ID for direct access to Google Drive content
        const fileId = processedImage.fileId || extractGoogleDriveId(imageSource);
        
        // Get the appropriate URLs with fallbacks
        let imgUrl;
        if (fileId) {
            // If it's a Google Drive image, use the newest usercontent.google.com format
            imgUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
        } else {
            // Otherwise use the processed image URL
            imgUrl = processedImage.thumbnail || processedImage.directUrl || imageSource;
        }
        
        // Determine caption text
        const caption = image.caption || '';
        
        // Determine full-size image URL with fallbacks
        const fullSizeUrl = fileId
            ? `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`
            : (processedImage.fullRes || processedImage.directUrl || imageSource);
        
        // Include both original and processed URLs for debugging
        html += `
            <div class="swiper-slide">
                <div class="image-container">
                    <img src="${imgUrl}" 
                         alt="${caption}" 
                         data-fullsize="${fullSizeUrl}" 
                         data-original-url="${imageSource}"
                         data-file-id="${fileId || ''}"
                         class="adaptive-image"
                         onerror="this.classList.add('error-image'); if(window.setupGoogleDriveImageFallback) window.setupGoogleDriveImageFallback(this, this.getAttribute('data-original-url'));">
                </div>
                ${caption ? `<div class="bg-black bg-opacity-50 text-white p-2 absolute bottom-0 left-0 right-0 text-center">${caption}</div>` : ''}
            </div>`;
    });
    
    // Close main containers and add navigation/pagination
    html += `
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
    </div>`;
    
    return html;
}

// Initialize all Swiper instances on the page
function initializeSwiperCarousels() {
    // First try to convert any existing simple carousels
    convertToSwiperCarousels();
    
    // Add data-slide-index to slides for staggered animations
    document.querySelectorAll('.swiper-slide').forEach((slide, index) => {
        slide.style.setProperty('--slide-index', index);
    });
    
    // Then initialize any pre-built Swiper carousels
    const swiperElements = document.querySelectorAll('.swiper-carousel:not(.swiper-initialized)');
    
    swiperElements.forEach(element => {
        try {
            new Swiper(element, {
                slidesPerView: 'auto',
                spaceBetween: 4, // Minimal gap between slides
                loop: true,
                autoHeight: true,
                effect: 'slide',
                speed: 800,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: element.querySelector('.swiper-pagination'),
                    clickable: true,
                    dynamicBullets: true,
                },
                navigation: {
                    nextEl: element.querySelector('.swiper-button-next'),
                    prevEl: element.querySelector('.swiper-button-prev'),
                },
                breakpoints: {
                    // Mobile
                    320: {
                        slidesPerView: 1,
                        spaceBetween: 2,
                    },
                    // Tablet
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 4,
                    },
                    // Desktop
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 6,
                    },
                },
                centeredSlides: false,
                observer: true,
                observeParents: true,
                updateOnWindowResize: true,
                resizeObserver: true,
                grabCursor: true,
                watchSlidesProgress: true,
                cssMode: true, // Better performance on mobile
                on: {
                    init: function() {
                        console.log("Swiper carousel initialized");
                        
                        // Add animation delay based on slide index
                        this.slides.forEach((slide, index) => {
                            slide.style.setProperty('--slide-index', index);
                        });
                    },
                    slideChangeTransitionStart: function() {
                        // Add fade effect to current and next slides
                        const activeSlide = this.slides[this.activeIndex];
                        if (activeSlide) {
                            activeSlide.style.opacity = '1';
                            activeSlide.style.transform = 'scale(1.05)';
                        }
                    },
                    slideChangeTransitionEnd: function() {
                        // Reset transforms after transition
                        this.slides.forEach(slide => {
                            if (!slide.classList.contains('swiper-slide-active')) {
                                slide.style.opacity = '';
                                slide.style.transform = '';
                            }
                        });
                    }
                },
            });
        } catch (error) {
            console.error("Error initializing Swiper carousel:", error);
        }
    });
    
    // Initialize magical scenery Swiper if present
    const magicalSwiperElements = document.querySelectorAll('.swiper-magical:not(.swiper-initialized)');
    
    magicalSwiperElements.forEach(element => {
        try {
            new Swiper(element, {
                // Optional parameters for magical scenery
                loop: true,
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                speed: 1000,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                // If we need pagination
                pagination: {
                    el: element.querySelector('.swiper-pagination'),
                    clickable: true,
                    dynamicBullets: true,
                },
                // Navigation arrows
                navigation: {
                    nextEl: element.querySelector('.swiper-button-next'),
                    prevEl: element.querySelector('.swiper-button-prev'),
                },
                // Make the carousel more responsive
                autoHeight: true,
                observer: true,
                observeParents: true,
                updateOnWindowResize: true,
                resizeObserver: true,
                grabCursor: true,
            });
            console.log("Magical scenery Swiper initialized");
        } catch (error) {
            console.error("Error initializing magical scenery Swiper:", error);
        }
    });
    
    // After initializing Swiper, try to auto-recover any Google Drive images
    // Give time for images to load first
    setTimeout(() => {
        autoRecoverGoogleDriveImages();
    }, 1000);
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

// Add to window object for global access
window.convertToSwiperCarousels = convertToSwiperCarousels;
window.generateSwiperCarouselHtml = generateSwiperCarouselHtml;
window.initializeSwiperCarousels = initializeSwiperCarousels;
window.autoRecoverGoogleDriveImages = autoRecoverGoogleDriveImages;
window.extractGoogleDriveId = extractGoogleDriveId;

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a short moment to ensure everything is loaded
    setTimeout(() => {
        initializeSwiperCarousels();
    }, 100);
}); 