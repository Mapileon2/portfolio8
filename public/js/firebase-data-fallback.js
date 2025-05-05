/**
 * Firebase Hosting Data Fallback
 * 
 * This script provides static fallback data when the site is deployed to Firebase Hosting
 * where the Node.js API endpoints are not available.
 */

(function() {
  // Check if we're in Firebase Hosting environment
  const isFirebaseHosting = window.location.hostname.includes('web.app') || 
                           window.location.hostname.includes('firebaseapp.com');
  
  if (!isFirebaseHosting) {
    console.log('Not in Firebase Hosting environment, using normal API endpoints');
    return; // Exit if not in Firebase Hosting
  }
  
  console.log('Firebase Hosting environment detected, using static data fallbacks');
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Create fallback data for all API endpoints
  const fallbackData = {
    '/api/status': { status: 'online', source: 'static' },
    '/api/projects': [],
    '/api/skills': [
      { id: '1', name: 'Product Vision', category: 'Strategy', proficiency: 95 },
      { id: '2', name: 'Roadmapping', category: 'Strategy', proficiency: 90 },
      { id: '3', name: 'OKRs', category: 'Strategy', proficiency: 85 },
      { id: '4', name: 'Agile Methodologies', category: 'Execution', proficiency: 92 },
      { id: '5', name: 'User Stories', category: 'Execution', proficiency: 88 },
      { id: '6', name: 'Prioritization', category: 'Execution', proficiency: 90 },
      { id: '7', name: 'SQL', category: 'Analytics', proficiency: 85 },
      { id: '8', name: 'A/B Testing', category: 'Analytics', proficiency: 80 },
      { id: '9', name: 'Data Visualization', category: 'Analytics', proficiency: 75 }
    ],
    '/api/testimonials': [],
    '/api/contact': {
      email: 'arpanguria68@gmail.com',
      location: 'Bengaluru, India',
      phone: '',
      linkedin: 'https://www.linkedin.com/in/arpan-guria/',
      github: 'https://github.com/arpang12'
    },
    '/api/about': {
      intro: 'In the ever-shifting landscape of business, where challenges loom like towering mountains and opportunities sparkle like hidden gems, a Management Consultant set forth on a mission: to turn complexity into clarity, data into direction, and strategy into success.',
      description: 'Armed with the sword of strategic problem-solving, the shield of data analysis, and the map of actionable insights, I navigate the intricate pathways of decision-making, helping leaders and organizations find their way through uncertainty.',
      highlights: [
        'Roadmap Wizardry: Turning visions into actionable plans',
        'Strategy Alignment: Bringing teams together under one sky',
        'Metric Sorcery: Weaving data into compelling stories',
        'Innovation Alchemy: Transforming ideas into gold'
      ],
      image: '/images/IMG_20230307_172356-EDIT.jpg'
    },
    '/api/timeline': [
      {
        id: '1',
        title: 'Consultant',
        company: 'Capgemini India',
        period: '2023-Present',
        description: 'Consultant at Capgemini leading ERP transformations, P&L management, and digital initiatives; expertise in governance, operations analytics, market analysis, and driving margin growth, efficiency, and AI-led customer service enhancements.'
      },
      {
        id: '2',
        title: 'Summer Intern Consultant - Enterprise Growth Group',
        company: 'Tata Consultancy Services',
        period: '2022',
        description: 'Summer Intern at TCS, developed a retail strategy framework addressing store cannibalization; conducted primary research across formats and designed actionable solutions using a 7-parameter, 30+ sub-parameter model.'
      }
    ],
    '/api/settings': {
      siteName: 'Arpan\'s Product Journey',
      siteDescription: 'A Product Manager\'s journey through enchanted user experiences and data-driven storytelling',
      primaryColor: '#4a90e2',
      secondaryColor: '#f8d56b',
      logoText: 'Arpan\'s Product Journey',
      footerText: '© 2025 Arpan\'s Product Journey. All rights reserved. Crafted with magic and ♥',
      footerLinks: [
        { text: 'LinkedIn', url: 'https://www.linkedin.com/in/arpan-guria/' },
        { text: 'GitHub', url: 'https://github.com/arpang12' }
      ]
    },
    '/api/sections': {
      hero: {
        html: '<h1 class="ghibli-font text-5xl md:text-7xl font-bold text-indigo-100 dark:text-gray-100">Crafting Products <br>That Spark <span class="text-yellow-400">Joy & Magic</span></h1><p class="text-xl md:text-2xl mb-10 text-indigo-200 dark:text-gray-300">A Product Manager\'s journey through enchanted user experiences and data-driven storytelling</p>'
      }
    },
    '/api/case-studies': []
  };
  
  // Create a special case for carousel images
  let carouselImages = JSON.parse(localStorage.getItem('carouselImages') || '[]');
  if (carouselImages.length === 0) {
    // Provide default carousel images if none in localStorage
    carouselImages = [
      {
        id: '1',
        url: '/images/Image carousel/IMG_20220904_104615.jpg',
        title: 'Journey Step 1',
        description: 'Description for journey step 1',
        order: 1
      },
      {
        id: '2',
        url: '/images/Image carousel/IMG_1078.jpg',
        title: 'Journey Step 2',
        description: 'Description for journey step 2',
        order: 2
      }
    ];
    
    // Save to localStorage for future use
    localStorage.setItem('carouselImages', JSON.stringify(carouselImages));
  }
  
  fallbackData['/api/carousel-images'] = carouselImages;
  fallbackData['/api/carousel-settings'] = {
    title: 'Magical Journey',
    speed: 5000,
    autoplay: true,
    indicators: true
  };
  
  // Create a handler for file uploads in the static environment
  const handleFileUpload = async (url, options) => {
    console.log('Simulating file upload in Firebase Hosting environment');
    
    // Generate a placeholder response for file uploads
    let response = {
      ok: true,
      status: 200,
      url: 'https://via.placeholder.com/800x600?text=Simulated+Upload',
      secure_url: 'https://via.placeholder.com/800x600?text=Simulated+Upload'
    };
    
    // If this is a form data upload, try to get the file and create a data URL
    if (options && options.body instanceof FormData) {
      try {
        const fileField = options.body.get('file') || options.body.get('image');
        if (fileField && fileField instanceof File) {
          // Create a temporary local URL for the uploaded file
          const fileReader = new FileReader();
          const fileUrl = await new Promise((resolve) => {
            fileReader.onload = (e) => resolve(e.target.result);
            fileReader.readAsDataURL(fileField);
          });
          
          // Generate a random ID for the upload
          const uploadId = 'local-' + Math.random().toString(36).substring(2, 15);
          
          // Create a more specific response
          response = {
            id: uploadId,
            ok: true,
            status: 200,
            url: fileUrl,
            secure_url: fileUrl,
            public_id: 'local/' + uploadId,
            original_filename: fileField.name
          };
          
          // Store this in localStorage for persistence
          const uploads = JSON.parse(localStorage.getItem('fallback_uploads') || '[]');
          uploads.push(response);
          localStorage.setItem('fallback_uploads', JSON.stringify(uploads));
          
          console.log('Created simulated upload response with data URL', { id: uploadId });
          
          // If this is a carousel image upload, also add it to carousel images
          if (url.includes('/api/carousel')) {
            const formValues = {};
            for (const [key, value] of options.body.entries()) {
              if (key !== 'file' && key !== 'image') {
                formValues[key] = value;
              }
            }
            
            // Create a new carousel image entry
            const newImage = {
              id: uploadId,
              url: fileUrl,
              title: formValues.caption || formValues.title || 'Uploaded Image',
              description: formValues.description || '',
              order: parseInt(formValues.order || '99')
            };
            
            // Add to carousel images
            carouselImages.push(newImage);
            localStorage.setItem('carouselImages', JSON.stringify(carouselImages));
            
            // Update the fallback data
            fallbackData['/api/carousel-images'] = carouselImages;
            
            console.log('Added uploaded image to carousel images', newImage);
          }
        }
      } catch (error) {
        console.error('Error creating simulated upload:', error);
      }
    }
    
    // Return a mock successful response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });
  };
  
  // Override fetch to intercept API calls
  window.fetch = function(url, options) {
    if (typeof url === 'string') {
      // Extract the pathname from the URL (handles both relative and absolute URLs)
      let pathname = url;
      try {
        // If it's a full URL, extract the pathname
        if (url.startsWith('http')) {
          pathname = new URL(url).pathname;
        }
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
      
      // Special case for file uploads
      if (pathname.includes('/api/upload') || 
          (pathname.includes('/api/carousel') && options && options.method === 'POST') ||
          pathname.includes('/upload-signature')) {
        return handleFileUpload(url, options);
      }
      
      // Check if the request is for an API endpoint with fallback data
      const fallbackKey = Object.keys(fallbackData).find(key => pathname.startsWith(key));
      if (fallbackKey) {
        console.log(`Using static fallback data for ${pathname}`);
        
        // Return a mock successful response with the fallback data
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(fallbackData[fallbackKey]),
          text: () => Promise.resolve(JSON.stringify(fallbackData[fallbackKey])),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        });
      }
    }
    
    // For all other requests, use the original fetch
    return originalFetch.apply(window, arguments);
  };
  
  // Add a UI indicator that we're using static data
  setTimeout(() => {
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.right = '10px';
    indicator.style.backgroundColor = 'rgba(255, 165, 0, 0.8)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '4px';
    indicator.style.fontSize = '12px';
    indicator.style.zIndex = '9999';
    indicator.textContent = 'Static Data Mode';
    document.body.appendChild(indicator);
  }, 1000);
})(); 