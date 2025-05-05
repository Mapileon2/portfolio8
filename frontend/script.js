import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "firebase/auth";
import { 
  getProjects, getSkills, getTestimonials, getContactInfo, 
  getAboutData, getTimelineItems, getCaseStudies, getSiteSettings
} from './firebase-services.js';

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User is logged in:", user.email);
    document.querySelectorAll('.edit-content-btn').forEach(btn => {
      btn.style.display = 'block';
    });
  } else {
    // User is signed out
    console.log("User is not logged in");
    document.querySelectorAll('.edit-content-btn').forEach(btn => {
      btn.style.display = 'none';
    });
  }
});

// Dark mode toggle
document.getElementById('darkModeToggle').addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  const icon = this.querySelector('i');
  if (document.body.classList.contains('dark-mode')) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
  } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
  }
  
  // Save preference
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Mobile menu toggle
document.getElementById('mobileMenuButton')?.addEventListener('click', function() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('hidden');
});

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

// Load dark mode from preferences
document.addEventListener('DOMContentLoaded', function() {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    document.body.classList.add('dark-mode');
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    }
  }
  
  // Load all content
  loadAllContent();
});

// Soot sprite Easter egg
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

// Load all content from Firebase
async function loadAllContent() {
  updateAbout();
  updateProjects();
  updateSkills();
  updateTimeline();
  updateTestimonials();
  updateContact();
  loadSiteSettings();
}

// Update About Section
async function updateAbout() {
  try {
    const aboutData = await getAboutData();
    if (aboutData) {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        const titleEl = aboutSection.querySelector('h3');
        const paragraphs = aboutSection.querySelectorAll('p');
        
        if (titleEl) titleEl.textContent = aboutData.title || 'Once upon a time...';
        if (paragraphs && paragraphs.length >= 2) {
          paragraphs[0].textContent = aboutData.paragraph1 || '';
          paragraphs[1].textContent = aboutData.paragraph2 || '';
        }
        
        // Update features boxes
        const features = aboutData.features || [];
        const featureBoxes = aboutSection.querySelectorAll('.grid-cols-2 h4');
        if (featureBoxes) {
          features.forEach((feature, index) => {
            if (featureBoxes[index]) {
              featureBoxes[index].textContent = feature.title || '';
              const pEl = featureBoxes[index].nextElementSibling;
              if (pEl) pEl.textContent = feature.description || '';
            }
          });
        }
        
        // Update image if present
        if (aboutData.imageUrl) {
          const imgEl = aboutSection.querySelector('img');
          if (imgEl) imgEl.src = aboutData.imageUrl;
        }
      }
    }
  } catch (error) {
    console.error('Error updating about section:', error);
  }
}

// Update Projects Section
async function updateProjects() {
  try {
    const projects = await getProjects();
    if (projects && projects.length > 0) {
    const projectsSection = document.getElementById('projects');
      const projectsContainer = projectsSection?.querySelector('.grid');

      if (projectsContainer) {
    // Clear existing projects
    projectsContainer.innerHTML = '';

        // Add projects from Firebase
    projects.forEach(project => {
      const projectDiv = document.createElement('div');
      projectDiv.classList.add('project-book');
          
      let innerHTML = `
        <div class="relative h-full">
          <div class="book-inner bg-white rounded-xl shadow-xl overflow-hidden h-full dark:bg-gray-800">
                <img src="${project.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'}"
                     alt="${project.title}"
                 class="w-full h-48 object-cover">
            <div class="p-6">
              <h3 class="ghibli-font text-2xl text-gray-800 mb-2 dark:text-gray-200">${project.title}</h3>
              <p class="text-gray-600 mb-4 dark:text-gray-400">${project.description}</p>
              <div class="flex items-center mb-4">
                    <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">${project.tags ? project.tags.join(', ') : ''}</span>
              </div>
              <div class="flex justify-between items-center">
                <div>
                  <span class="text-yellow-500">★ ★ ★ ★ ★</span>
                      <p class="text-sm text-gray-600 dark:text-gray-400">${project.result || ''}</p>
                </div>
                    <a href="case_study_1.html?id=${project.id}" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Read Story <i class="fas fa-arrow-right ml-1"></i>
                </a>
              </div>
            </div>
          </div>
          <div class="book-spine"></div>
        </div>
      `;
          
      projectDiv.innerHTML = innerHTML;
      projectsContainer.appendChild(projectDiv);
    });
      }
    }
  } catch (error) {
    console.error('Error updating projects:', error);
  }
}

// Update Skills Section
async function updateSkills() {
  try {
    const skillsData = await getSkills();
    if (skillsData && skillsData.length > 0) {
    const skillsSection = document.getElementById('skills');
      const skillsContainer = skillsSection?.querySelector('.grid');

      if (skillsContainer) {
    // Clear existing skills
    skillsContainer.innerHTML = '';

        // Group skills by category
        const skillsByCategory = {};
        skillsData.forEach(skill => {
          if (!skillsByCategory[skill.category]) {
            skillsByCategory[skill.category] = [];
          }
          skillsByCategory[skill.category].push(skill);
        });
        
        // Add skills by category
        Object.keys(skillsByCategory).forEach(category => {
          const skills = skillsByCategory[category];
          
      const categoryDiv = document.createElement('div');
      categoryDiv.classList.add('bg-white', 'p-6', 'rounded-2xl', 'shadow-lg', 'dark:bg-gray-800');
          
      let innerHTML = `
        <div class="flex justify-center mb-6">
          <div class="bg-blue-100 p-4 rounded-full dark:bg-gray-700">
                <i class="fas ${skills[0].icon || 'fa-chess-queen'} text-3xl text-blue-600 dark:text-blue-300"></i>
          </div>
        </div>
            <h3 class="ghibli-font text-2xl text-center mb-4 text-gray-800 dark:text-gray-200">${category}</h3>
        <div class="space-y-4">
      `;
          
          skills.forEach(skill => {
        innerHTML += `
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${skill.name}</span>
              <span class="text-sm text-gray-500">${skill.percentage}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div class="bg-blue-600 h-2 rounded-full" style="width: ${skill.percentage}%"></div>
            </div>
          </div>
        `;
      });
          
      innerHTML += '</div>';
      categoryDiv.innerHTML = innerHTML;
      skillsContainer.appendChild(categoryDiv);
    });
  }
}
  } catch (error) {
    console.error('Error updating skills:', error);
  }
}

// Update Timeline Section
async function updateTimeline() {
  try {
    const timelineItems = await getTimelineItems();
    if (timelineItems && timelineItems.length > 0) {
      const timelineSection = document.getElementById('timeline');
      const timelineContainer = timelineSection?.querySelector('.space-y-16');
      
      if (timelineContainer) {
        // Clear existing timeline items
        timelineContainer.innerHTML = '';
        
        // Add timeline items
        timelineItems.forEach((item, index) => {
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('relative', 'flex', 'flex-col', 'md:flex-row', 'items-center');
          
          // Alternate layout for even/odd items
          const isEven = index % 2 === 0;
          
          let innerHTML = `
            <div class="md:w-1/2 ${isEven ? 'md:pr-16 mb-8 md:mb-0 text-right' : 'md:pl-16 order-2 md:order-1'}">
              ${isEven ? `
                <div class="bg-blue-50 p-6 rounded-2xl shadow-lg dark:bg-gray-700">
                  <h3 class="ghibli-font text-2xl text-blue-700 mb-2 dark:text-blue-300">${item.title}</h3>
                  <p class="text-gray-600 font-medium mb-2 dark:text-gray-400">${item.company} • ${item.period}</p>
                  <p class="text-gray-600 dark:text-gray-400">${item.description}</p>
                </div>
              ` : `
                <div class="bg-gray-100 p-4 rounded-xl inline-block dark:bg-gray-700">
                  <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'}" 
                      alt="${item.company}" 
                      class="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-600">
                </div>
              `}
            </div>
            <div class="hidden md:block absolute left-1/2 -translate-x-1/2">
              <div class="timeline-lantern"></div>
            </div>
            <div class="md:w-1/2 ${isEven ? 'md:pl-16' : 'md:pr-16 order-1 md:order-2 mb-8 md:mb-0'}">
              ${isEven ? `
                <div class="bg-gray-100 p-4 rounded-xl inline-block dark:bg-gray-700">
                  <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'}" 
                      alt="${item.company}" 
                      class="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-600">
                </div>
              ` : `
                <div class="bg-blue-50 p-6 rounded-2xl shadow-lg dark:bg-gray-700">
                  <h3 class="ghibli-font text-2xl text-blue-700 mb-2 dark:text-blue-300">${item.title}</h3>
                  <p class="text-gray-600 font-medium mb-2 dark:text-gray-400">${item.company} • ${item.period}</p>
                  <p class="text-gray-600 dark:text-gray-400">${item.description}</p>
                </div>
              `}
            </div>
          `;
          
          itemDiv.innerHTML = innerHTML;
          timelineContainer.appendChild(itemDiv);
        });
      }
    }
  } catch (error) {
    console.error('Error updating timeline:', error);
  }
}

// Update Testimonials Section
async function updateTestimonials() {
  try {
    const testimonials = await getTestimonials();
    if (testimonials && testimonials.length > 0) {
    const testimonialsSection = document.getElementById('testimonials');
      const testimonialsContainer = testimonialsSection?.querySelector('.grid');

      if (testimonialsContainer) {
    // Clear existing testimonials
    testimonialsContainer.innerHTML = '';

        // Add testimonials
        testimonials.forEach(testimonial => {
      const testimonialDiv = document.createElement('div');
      testimonialDiv.classList.add('bg-blue-50', 'p-8', 'rounded-2xl', 'shadow-lg', 'relative', 'dark:bg-gray-700');
          
      let innerHTML = `
        <div class="absolute -top-6 -left-6">
          <div class="kodama"></div>
        </div>
        <div class="mb-4">
              <span class="text-yellow-500">${'★'.repeat(testimonial.rating || 5)}${testimonial.rating < 5 ? '☆'.repeat(5 - testimonial.rating) : ''}</span>
        </div>
        <p class="text-gray-700 italic mb-6 dark:text-gray-300">
              "${testimonial.content}"
        </p>
        <div class="flex items-center">
              <img src="${testimonial.photoUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'}"
               alt="${testimonial.author}"
               class="w-12 h-12 rounded-full object-cover mr-4 border-2 border-white dark:border-gray-600">
          <div>
            <h4 class="font-bold text-gray-800 dark:text-gray-200">${testimonial.author}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">${testimonial.title}</p>
          </div>
        </div>
      `;
          
      testimonialDiv.innerHTML = innerHTML;
      testimonialsContainer.appendChild(testimonialDiv);
    });
      }
    }
  } catch (error) {
    console.error('Error updating testimonials:', error);
  }
}

// Update Contact Section
async function updateContact() {
  try {
    const contactData = await getContactInfo();
    if (contactData) {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        // Update contact information
        const emailDiv = contactSection.querySelector('.fa-envelope')?.parentNode.nextElementSibling;
        const phoneDiv = contactSection.querySelector('.fa-phone')?.parentNode.nextElementSibling;
        const addressDiv = contactSection.querySelector('.fa-map-marker-alt')?.parentNode.nextElementSibling;
        
        if (emailDiv) emailDiv.textContent = contactData.email || '';
        if (phoneDiv) phoneDiv.textContent = contactData.phone || '';
        if (addressDiv) addressDiv.textContent = contactData.address || '';
        
        // Update social links if present
        if (contactData.socialLinks) {
          const linkedinLink = contactSection.querySelector('a[class*="linkedin"]');
          const twitterLink = contactSection.querySelector('a[class*="twitter"]');
          const githubLink = contactSection.querySelector('a[class*="github"]');
          
          if (linkedinLink && contactData.socialLinks.linkedin)
            linkedinLink.href = contactData.socialLinks.linkedin;
          
          if (twitterLink && contactData.socialLinks.twitter) 
            twitterLink.href = contactData.socialLinks.twitter;
          
          if (githubLink && contactData.socialLinks.github)
            githubLink.href = contactData.socialLinks.github;
        }
      }
    }
  } catch (error) {
    console.error('Error updating contact info:', error);
  }
}

// Load site settings
async function loadSiteSettings() {
  try {
    const settings = await getSiteSettings();
    if (settings) {
      // Update site title
      document.title = settings.siteTitle || 'Ghibli-Inspired Product Portfolio';
      
      // Update logo text
      const logoText = document.querySelector('.ghibli-font');
      if (logoText && settings.logoText) {
        logoText.textContent = settings.logoText;
      }
      
      // Update hero section
      const heroSection = document.querySelector('.hero-bg');
      if (heroSection && settings.heroSettings) {
        const h1 = heroSection.querySelector('h1');
        const p = heroSection.querySelector('p');
        const a = heroSection.querySelector('a');
        
        if (h1 && settings.heroSettings.title) 
          h1.innerHTML = settings.heroSettings.title;
        
        if (p && settings.heroSettings.subtitle) 
          p.textContent = settings.heroSettings.subtitle;
        
        if (a && settings.heroSettings.buttonText) 
          a.innerHTML = `${settings.heroSettings.buttonText} <i class="fas fa-arrow-down ml-2"></i>`;
      }
    }
  } catch (error) {
    console.error('Error loading site settings:', error);
  }
}

// Check for case study parameter
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the case study page
  if (window.location.pathname.includes('case_study_1.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const caseStudyId = urlParams.get('id');
    
    if (caseStudyId) {
      loadCaseStudy(caseStudyId);
    }
  }
});

// Load case study content
async function loadCaseStudy(id) {
  try {
    const caseStudy = await getCaseStudy(id);
    if (caseStudy) {
      document.title = `${caseStudy.title} | Case Study`;
      
      // Update case study header
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        const h1 = heroSection.querySelector('h1');
        const h2 = heroSection.querySelector('h2');
        const p = heroSection.querySelector('p');
        
        if (h1) h1.textContent = caseStudy.title || '';
        if (h2) h2.textContent = caseStudy.subtitle || '';
        if (p) p.textContent = caseStudy.summary || '';
      }
      
      // Update content sections
      if (caseStudy.sections) {
        caseStudy.sections.forEach(section => {
          const sectionEl = document.getElementById(section.id);
          if (sectionEl) {
            const h2 = sectionEl.querySelector('h2');
            const content = sectionEl.querySelector('.content-container');
            
            if (h2) h2.textContent = section.title || '';
            if (content) content.innerHTML = section.content || '';
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading case study:', error);
  }
}
