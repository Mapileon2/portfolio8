// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    // Mark the about section as static (do not update from Firebase)
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        aboutSection.setAttribute('data-static', 'true');
        aboutSection.setAttribute('data-no-edit', 'true');
    }
    
    // AGGRESSIVE EDIT REMOVAL - runs immediately and constantly
    function removeAllEditElements() {
        // Remove any content editable attributes and editing features
        document.querySelectorAll('[contenteditable="true"]').forEach(element => {
            element.removeAttribute('contenteditable');
            element.setAttribute('contenteditable', 'false');
        });
        
        // Hide any edit buttons that might exist
        document.querySelectorAll('[class*="edit"], [id*="edit"], .edit-inline-btn, .edit-section-btn, button[data-section]').forEach(btn => {
            btn.style.display = 'none';
            try { btn.remove(); } catch(e) { /* ignore */ }
        });
        
        // Find elements with "Saving..." text and remove them
        document.querySelectorAll('button, [class*="btn"]').forEach(el => {
            if (el && el.innerText && 
               (el.innerText.includes('Saving') || 
                el.innerText.includes('Edit') || 
                el.innerText.includes('Save'))) {
                el.style.display = 'none';
                try { el.remove(); } catch(e) { /* ignore */ }
            }
        });
        
        // Override prototype functions that could be used for editing
        try {
            // Override HTMLElement.prototype methods related to contentEditable if not already done
            if (!window._editingDisabled) {
                const originalSetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'contentEditable').set;
                Object.defineProperty(HTMLElement.prototype, 'contentEditable', {
                    set: function(val) {
                        // Always set to false or inherit
                        originalSetter.call(this, 'false');
                    },
                    get: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'contentEditable').get
                });
                window._editingDisabled = true;
            }
        } catch(e) { /* ignore */ }
    }
    
    // Run immediately
    removeAllEditElements();
    
    // Then run every 200ms to catch any dynamic elements
    setInterval(removeAllEditElements, 200);

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            const menu = document.getElementById('mobileMenu');
            menu.classList.toggle('hidden');
        });
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const icon = this.querySelector('i');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });

    // Easter egg - click on soot sprites
    document.querySelectorAll('.soot-sprite').forEach(sprite => {
        sprite.addEventListener('click', function() {
            const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.style.backgroundColor = randomColor;
            
            // Create a temporary message
            const message = document.createElement('div');
            message.textContent = 'Hi there!';
            message.style.position = 'absolute';
            message.style.backgroundColor = 'white';
            message.style.padding = '2px 6px';
            message.style.borderRadius = '4px';
            message.style.fontSize = '10px';
            message.style.top = '-25px';
            message.style.left = '0';
            this.appendChild(message);
            
            // Remove after 2 seconds
            setTimeout(() => {
                message.remove();
            }, 2000);
        });
    });

    // Replace Firebase initialization with REST API
    // Update the loading code for swiperMagical
    if (typeof Swiper !== 'undefined') {
        // Try to use enhanced Swiper initialization if available
        if (typeof window.initializeSwiperCarousels === 'function') {
            // Will initialize all Swiper instances including our magical one
            window.initializeSwiperCarousels();
        } else {
            // Fall back to original Swiper initialization
            try {
                let swiperMagical;
                
                // Check if we need to load carousel images dynamically
                const swiperWrapper = document.querySelector('.swiper-magical .swiper-wrapper');
                if (swiperWrapper) {
                    // First initialize with loading indicator
                    swiperWrapper.innerHTML = `
                        <div class="swiper-slide">
                            <div class="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700">
                                <div class="text-center">
                                    <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                                    <p class="text-gray-600 dark:text-gray-300">Loading magical journeys...</p>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Initialize Swiper with one slide
                    swiperMagical = new Swiper('.swiper-magical', {
                        loop: false,
                        pagination: {
                            el: '.swiper-pagination',
                            clickable: true,
                        },
                        navigation: {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev',
                        },
                    });
                    
                    // Load images from REST API instead of Firebase
                    loadCarouselImages();
                } else {
                    // If there's no swiper wrapper, initialize default swiper
                    initializeDefaultSwiper();
                }
            } catch (error) {
                console.error('Error initializing Swiper:', error);
            }
        }
    }

    // === API Integration via fetch() ===
    // 1) Load Magical Projects (Case Studies)
    loadMagicalProjects();
    
    // 2) Load Sections HTML
    fetch('/api/sections')
        .then(res => res.json())
        .then(sections => {
            Object.keys(sections).forEach(id => {
                if (['projects','contact','timeline','about'].includes(id)) return;
                const html = sections[id].html;
                const secEl = document.getElementById(id);
                if (secEl && html) secEl.innerHTML = html;
            });
        })
        .catch(err => console.error('Error loading sections:', err));

    // 3) Load Carousel Images
    const swiperWrapper = document.querySelector('.swiper-magical .swiper-wrapper');
    if (swiperWrapper) {
        fetch('/api/carousel-images')
            .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
            .then(images => {
                swiperWrapper.innerHTML = '';
                images.forEach(img => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    slide.innerHTML = `
                        <img src="${img.url}" onerror="this.src='https://picsum.photos/800/400';" alt="${img.title}">
                        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                            <h3 class="text-white text-2xl font-bold ghibli-font">${img.title}</h3>
                            <p class="text-white/90">${img.description||''}</p>
                        </div>`;
                    swiperWrapper.appendChild(slide);
                });
                if (window.swiperMagical) swiperMagical.update();
                else swiperMagical = new Swiper('.swiper-magical', {
                    loop:true, effect:'fade', fadeEffect:{crossFade:true},
                    autoplay:{delay:5000,disableOnInteraction:false},
                    pagination:{el:'.swiper-pagination',clickable:true},
                    navigation:{nextEl:'.swiper-button-next',prevEl:'.swiper-button-prev'}
                });
            })
            .catch(err => { console.error('Error loading carousel images:', err); initializeDefaultSwiper(); });
    }
    
    // Call our other content loading functions
    loadAllContent();
});

// Function to load magical projects (case studies)
function loadMagicalProjects() {
    const loading = document.getElementById('projectsLoading');
    const grid = document.getElementById('projectsGrid');
    const errorDiv = document.getElementById('projectsError');
    
    if (!loading || !grid || !errorDiv) {
        console.log('Magical projects section not found on this page');
        return;
    }
    
    loading.classList.remove('hidden');
    grid.classList.add('hidden');
    errorDiv.classList.add('hidden');
    
    console.log('🔍 Loading case studies from API...');
    
    fetch('/api/case-studies')
        .then(res => { 
            if (!res.ok) throw new Error(res.statusText); 
            return res.json(); 
        })
        .then(items => {
            loading.classList.add('hidden');
            console.log('📱 Loaded case studies:', items.length, 'items');
            
            if (!items.length) {
                errorDiv.querySelector('p').textContent = 'No magical projects available yet.';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            // Log the IDs to see if we have our case study
            console.log('📱 Case study IDs:', items.map(cs => cs.id).join(', '));
            
            grid.innerHTML = '';
            items.forEach(cs => {
                console.log(`📱 Processing case study: ${cs.id}, Title: ${cs.projectTitle || 'Untitled'}`);
                
                // For existing case studies, try to derive fields if missing
                // This helps with backward compatibility
                if (!cs.projectTitle && cs.sections && cs.sections.hero && cs.sections.hero.headline) {
                    cs.projectTitle = cs.sections.hero.headline;
                }
                
                if (!cs.projectDescription && cs.sections && cs.sections.overview && cs.sections.overview.content) {
                    // Take first 100 chars as description if missing
                    const contentText = cs.sections.overview.content.replace(/<[^>]*>/g, '');
                    cs.projectDescription = contentText.substring(0, 100) + (contentText.length > 100 ? '...' : '');
                }
                
                // Try to get a presentable image if the main one is missing
                if (!cs.projectImageUrl && cs.sections && cs.sections.gallery && 
                    cs.sections.gallery.images && cs.sections.gallery.images.length > 0) {
                    cs.projectImageUrl = cs.sections.gallery.images[0].url;
                }
                
                const card = document.createElement('div');
                card.className = 'project-book';
                card.innerHTML = `
                    <div class="relative h-full">
                        <div class="book-inner bg-white rounded-xl shadow-xl overflow-hidden h-full dark:bg-gray-800">
                            <img src="${cs.projectImageUrl || '/images/placeholder-project.jpg'}" 
                                 alt="${cs.projectTitle || 'Project'}" 
                                 class="w-full h-48 object-cover"
                                 onerror="this.src='/images/placeholder-project.jpg'">
                            <div class="p-6">
                                <h3 class="ghibli-font text-2xl dark:text-gray-200 mb-2">${cs.projectTitle || 'Untitled Project'}</h3>
                                <p class="text-gray-600 dark:text-gray-400 mb-4">${cs.projectDescription || ''}</p>
                                <div class="flex items-center mb-4">
                                    <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">${cs.projectCategory || 'Project'}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <div>
                                        <span class="text-yellow-500">${'★'.repeat(cs.projectRating || 0)}${'☆'.repeat(5-(cs.projectRating || 0))}</span>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">${cs.projectAchievement || ''}</p>
                                    </div>
                                    <a href="case_study.html?caseId=${cs.id}" class="text-blue-600 dark:text-blue-400 hover:underline">Read Story</a>
                                </div>
                            </div>
                        </div>
                    </div>`;
                grid.appendChild(card);
            });
            grid.classList.remove('hidden');
        })
        .catch(err => {
            console.error('Error loading magical projects:', err);
            loading.classList.add('hidden');
            errorDiv.classList.remove('hidden');
        });
}

// Load all content from REST API
async function loadAllContent() {
  updateAbout();
  updateProjects();
  updateSkills();
  updateTimeline();
  updateTestimonials();
  updateContact();
  loadSiteSettings();
}

// Update about section from REST API
async function updateAbout() {
  try {
    const response = await fetch('/api/about');
    if (!response.ok) throw new Error('Failed to fetch about data');
    const aboutData = await response.json();
    
    // Update the about section content
    document.getElementById('aboutHeadline').textContent = aboutData.headline || '';
    document.getElementById('aboutSubheading').textContent = aboutData.subheading || '';
    document.getElementById('aboutBio').innerHTML = aboutData.bio || '';
    
    // Update photo if available
    const aboutImage = document.getElementById('aboutImage');
    if (aboutImage && aboutData.photoUrl) {
      aboutImage.src = aboutData.photoUrl;
      aboutImage.alt = aboutData.headline || 'About Me';
    }
  } catch (error) {
    console.error('Error loading about section:', error);
  }
}

// Update projects from REST API
async function updateProjects() {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) throw new Error('Failed to fetch projects');
    const projects = await response.json();
    
    const projectsContainer = document.getElementById('projectsContainer');
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = '';
    
    projects.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'project-card';
      projectCard.innerHTML = `
        <div class="project-image">
          <img src="${project.imageUrl || '/images/placeholder-project.jpg'}" alt="${project.title}">
        </div>
        <div class="project-info">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <div class="project-tags">
            ${project.tags.map(tag => `<span>${tag}</span>`).join('')}
          </div>
          ${project.id ? `<a href="/case_study.html?id=${project.id}" class="btn btn-primary">View Details</a>` : ''}
        </div>
      `;
      projectsContainer.appendChild(projectCard);
    });
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Update skills from REST API
async function updateSkills() {
  try {
    const response = await fetch('/api/skills');
    if (!response.ok) throw new Error('Failed to fetch skills');
    const skills = await response.json();
    
    // Group skills by category
    const categories = {};
    skills.forEach(skill => {
      if (!categories[skill.category]) {
        categories[skill.category] = [];
      }
      categories[skill.category].push(skill);
    });
    
    const skillsContainer = document.getElementById('skillsContainer');
    if (!skillsContainer) return;
    
    skillsContainer.innerHTML = '';
    
    // Create category sections
    Object.keys(categories).forEach(category => {
      const categorySection = document.createElement('div');
      categorySection.className = 'skill-category';
      categorySection.innerHTML = `<h3>${category}</h3>`;
      
      const skillsList = document.createElement('div');
      skillsList.className = 'skills-list';
      
      categories[category].forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
          <div class="skill-info">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-percentage">${skill.percentage}%</span>
          </div>
          <div class="skill-bar">
            <div class="skill-progress" style="width: ${skill.percentage}%"></div>
          </div>
        `;
        skillsList.appendChild(skillItem);
      });
      
      categorySection.appendChild(skillsList);
      skillsContainer.appendChild(categorySection);
    });
  } catch (error) {
    console.error('Error loading skills:', error);
  }
}

// Update timeline from REST API
async function updateTimeline() {
  try {
    const response = await fetch('/api/timeline');
    if (!response.ok) throw new Error('Failed to fetch timeline');
    const timeline = await response.json();
    
    const timelineContainer = document.getElementById('timelineContainer');
    if (!timelineContainer) return;
    
    timelineContainer.innerHTML = '';
    
    // Sort timeline by year (descending)
    timeline.sort((a, b) => b.year - a.year);
    
    timeline.forEach((item, index) => {
      const timelineItem = document.createElement('div');
      timelineItem.className = `timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;
      timelineItem.innerHTML = `
        <div class="timeline-content">
          <div class="timeline-year">${item.year}</div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      `;
      timelineContainer.appendChild(timelineItem);
    });
  } catch (error) {
    console.error('Error loading timeline:', error);
  }
}

// Update testimonials from REST API
async function updateTestimonials() {
  try {
    const response = await fetch('/api/testimonials');
    if (!response.ok) throw new Error('Failed to fetch testimonials');
    const testimonials = await response.json();
    
    const testimonialsContainer = document.getElementById('testimonialsContainer');
    if (!testimonialsContainer) return;
    
    testimonialsContainer.innerHTML = '';
    
    testimonials.forEach(testimonial => {
      const testimonialCard = document.createElement('div');
      testimonialCard.className = 'testimonial-card';
      testimonialCard.innerHTML = `
        <div class="testimonial-content">
          <div class="testimonial-rating">
            ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}
          </div>
          <p class="testimonial-text">${testimonial.content}</p>
          <div class="testimonial-author">
            ${testimonial.photoUrl ? `<img src="${testimonial.photoUrl}" alt="${testimonial.author}">` : ''}
            <div class="testimonial-info">
              <h4>${testimonial.author}</h4>
              <p>${testimonial.title}</p>
            </div>
          </div>
        </div>
      `;
      testimonialsContainer.appendChild(testimonialCard);
    });
  } catch (error) {
    console.error('Error loading testimonials:', error);
  }
}

// Update contact info from REST API
async function updateContact() {
  try {
    const response = await fetch('/api/contact');
    if (!response.ok) throw new Error('Failed to fetch contact info');
    const contact = await response.json();
    
    // Update email
    const emailElement = document.getElementById('contactEmail');
    if (emailElement && contact.email) {
      emailElement.textContent = contact.email;
      emailElement.href = `mailto:${contact.email}`;
    }
    
    // Update phone
    const phoneElement = document.getElementById('contactPhone');
    if (phoneElement && contact.phone) {
      phoneElement.textContent = contact.phone;
      phoneElement.href = `tel:${contact.phone}`;
    }
    
    // Update address
    const addressElement = document.getElementById('contactAddress');
    if (addressElement && contact.address) {
      addressElement.textContent = contact.address;
    }
    
    // Update social links
    if (contact.socialLinks) {
      Object.keys(contact.socialLinks).forEach(platform => {
        const link = contact.socialLinks[platform];
        if (!link) return;
        
        const element = document.getElementById(`${platform}Link`);
        if (element) {
          element.href = link.startsWith('http') ? link : `https://${link}`;
        }
      });
    }
  } catch (error) {
    console.error('Error loading contact info:', error);
  }
}

// Load site settings from REST API
async function loadSiteSettings() {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error('Failed to fetch site settings');
    const settings = await response.json();
    
    // Update site title
    document.title = settings.siteTitle || document.title;
    
    // Update favicon if available
    if (settings.favicon) {
      const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
      link.rel = 'icon';
      link.href = settings.favicon;
      if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(link);
      }
    }
    
    // Update logo if available
    const logoElements = document.querySelectorAll('.site-logo');
    if (logoElements.length > 0 && settings.logoUrl) {
      logoElements.forEach(logo => {
        if (logo.tagName === 'IMG') {
          logo.src = settings.logoUrl;
        }
      });
    }
    
    // Apply custom CSS if available
    if (settings.customCss) {
      const style = document.getElementById('custom-css') || document.createElement('style');
      style.id = 'custom-css';
      style.textContent = settings.customCss;
      if (!document.getElementById('custom-css')) {
        document.head.appendChild(style);
      }
    }
    
    // Apply custom JS if available
    if (settings.customJs) {
      try {
        // Use Function constructor to evaluate JS code safely
        const customJs = new Function(settings.customJs);
        customJs();
      } catch (error) {
        console.error('Error executing custom JS:', error);
      }
    }
    
    // Set the primary and secondary colors if available
    if (settings.primaryColor || settings.secondaryColor) {
      const root = document.documentElement;
      if (settings.primaryColor) {
        root.style.setProperty('--primary-color', settings.primaryColor);
      }
      if (settings.secondaryColor) {
        root.style.setProperty('--secondary-color', settings.secondaryColor);
      }
    }
    
    // Add Google Analytics if available
    if (settings.googleAnalyticsId) {
      addGoogleAnalytics(settings.googleAnalyticsId);
    }
  } catch (error) {
    console.error('Error loading site settings:', error);
  }
}

// Helper function to add Google Analytics
function addGoogleAnalytics(trackingId) {
  if (!trackingId || document.getElementById('ga-script')) return;
  
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  
  const script2 = document.createElement('script');
  script2.id = 'ga-script';
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${trackingId}');
  `;
  
  document.head.appendChild(script1);
  document.head.appendChild(script2);
}

// Load carousel images from REST API
async function loadCarouselImages() {
  try {
    console.log('🔄 Loading carousel images from API...');
    const response = await fetch('/api/carousel-images');
    if (!response.ok) throw new Error('Failed to fetch carousel images');
    const images = await response.json();
    
    console.log(`📸 Found ${images.length} carousel images`);
    
    const swiperWrapper = document.querySelector('.swiper-magical .swiper-wrapper');
    if (!swiperWrapper) return;
    
    // Clear loading indicator
    swiperWrapper.innerHTML = '';
    
    if (images.length === 0) {
      console.log('⚠️ No carousel images found, initializing default swiper');
      initializeDefaultSwiper();
      return;
    }
    
    // Add slides
    images.forEach(image => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      
      // Use title or caption for heading
      const title = image.title || image.caption || 'Magical Journey';
      const description = image.description || '';
      
      slide.innerHTML = `
        <img src="${image.url}" 
             alt="${title}" 
             onerror="this.src='https://picsum.photos/800/400?random=${Math.random()}'; this.classList.add('fallback-image');">
        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <h3 class="text-white text-2xl font-bold ghibli-font">${title}</h3>
          <p class="text-white/90">${description}</p>
        </div>
      `;
      swiperWrapper.appendChild(slide);
    });
    
    console.log('🎠 Initializing carousel swiper with loaded images');
    
    // Initialize or update Swiper
    if (window.swiperMagical) {
      window.swiperMagical.update();
    } else {
      window.swiperMagical = new Swiper('.swiper-magical', {
        loop: true,
        effect: 'fade',
        fadeEffect: {
          crossFade: true
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
      });
    }
  } catch (error) {
    console.error('Error loading carousel images:', error);
    
    // Fall back to default Swiper with placeholders
    initializeDefaultSwiper();
  }
}

// Function to initialize default swiper (with static slides)
function initializeDefaultSwiper() {
  console.log("Initializing default swiper with static slides");
  
  // Check if we need to generate placeholder slides
  const swiperWrapper = document.querySelector('.swiper-magical .swiper-wrapper');
  if (swiperWrapper) {
    // Get existing slides
    const existingSlides = swiperWrapper.querySelectorAll('.swiper-slide');
    
    // If we have no slides or they're failing to load, create placeholder slides
    if (existingSlides.length === 0 || existingSlides.length === 1) {
      // Clear the wrapper
      swiperWrapper.innerHTML = '';
      
      // Create 5 placeholder slides
      for (let i = 1; i <= 5; i++) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
          <img src="https://picsum.photos/800/400?random=${i}" alt="Placeholder Image ${i}">
          <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            <h3 class="text-white text-2xl font-bold ghibli-font">Magical Journey ${i}</h3>
            <p class="text-white/90">Explore the wonders of product management</p>
          </div>
        `;
        swiperWrapper.appendChild(slide);
      }
    }
  }
  
  // Make sure we use the static slides that already exist in the HTML
  // instead of trying to load from database
  window.swiperMagical = new Swiper('.swiper-magical', {
    // Optional parameters
    loop: true,
    effect: 'fade',
    fadeEffect: {
      crossFade: true
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    
    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
} 