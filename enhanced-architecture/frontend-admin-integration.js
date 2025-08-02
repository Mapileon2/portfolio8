// Frontend-Admin Integration Script
// Add this to case-study.html to connect with admin panel

class PortfolioIntegration {
  constructor() {
    this.apiBase = window.location.origin;
    this.lastUpdate = localStorage.getItem('lastUpdate') || '0';
    this.analytics = new AnalyticsTracker();
    this.contentManager = new ContentManager();
    
    this.init();
  }

  async init() {
    console.log('🔗 Initializing Portfolio-Admin Integration...');
    
    // Load dynamic content from admin
    await this.loadDynamicContent();
    
    // Setup analytics tracking
    this.setupAnalytics();
    
    // Setup real-time updates
    this.setupRealTimeUpdates();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    console.log('✅ Portfolio-Admin Integration Ready');
  }

  async loadDynamicContent() {
    try {
      const [caseStudies, sections, images] = await Promise.all([
        fetch(`${this.apiBase}/api/firebase/case-studies`).then(r => r.json()),
        fetch(`${this.apiBase}/api/firebase/sections`).then(r => r.json()),
        fetch(`${this.apiBase}/api/firebase/carousel-images`).then(r => r.json())
      ]);

      // Update content on page
      this.contentManager.updateCaseStudies(caseStudies.data || []);
      this.contentManager.updateSections(sections.data || {});
      this.contentManager.updateCarousel(images.data || []);
      
      console.log('📄 Dynamic content loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dynamic content:', error);
      // Fallback to static content
      this.contentManager.useStaticContent();
    }
  }

  setupAnalytics() {
    // Track page view
    this.analytics.trackPageView(window.location.pathname);
    
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (scrollPercent % 25 === 0) {
          this.analytics.trackEvent('scroll_depth', { percent: scrollPercent });
        }
      }
    });

    // Track interactions
    document.addEventListener('click', (e) => {
      if (e.target.matches('a, button, .interactive')) {
        this.analytics.trackEvent('click', {
          element: e.target.tagName,
          text: e.target.textContent?.substring(0, 50),
          href: e.target.href,
          className: e.target.className
        });
      }
    });

    // Track time on page
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      this.analytics.trackEvent('time_on_page', { seconds: timeSpent });
    });

    console.log('📊 Analytics tracking initialized');
  }

  setupRealTimeUpdates() {
    // Check for updates every 30 seconds
    setInterval(async () => {
      try {
        const response = await fetch(`${this.apiBase}/api/updates?since=${this.lastUpdate}`);
        const updates = await response.json();
        
        if (updates.length > 0) {
          console.log('🔄 Applying real-time updates:', updates);
          this.applyUpdates(updates);
          this.lastUpdate = Date.now().toString();
          localStorage.setItem('lastUpdate', this.lastUpdate);
        }
      } catch (error) {
        console.warn('⚠️ Real-time update check failed:', error);
      }
    }, 30000);
  }

  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.analytics.trackWebVital.bind(this.analytics));
        getFID(this.analytics.trackWebVital.bind(this.analytics));
        getFCP(this.analytics.trackWebVital.bind(this.analytics));
        getLCP(this.analytics.trackWebVital.bind(this.analytics));
        getTTFB(this.analytics.trackWebVital.bind(this.analytics));
      });
    }

    // Monitor page load performance
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      this.analytics.trackEvent('page_performance', {
        loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
        firstPaint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)
      });
    });
  }

  applyUpdates(updates) {
    updates.forEach(update => {
      switch (update.type) {
        case 'case-studies':
          this.contentManager.updateCaseStudies(update.data);
          break;
        case 'sections':
          this.contentManager.updateSections(update.data);
          break;
        case 'carousel-images':
          this.contentManager.updateCarousel(update.data);
          break;
        default:
          console.warn('Unknown update type:', update.type);
      }
    });
  }
}

class AnalyticsTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  async trackPageView(path) {
    try {
      await fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          title: document.title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  async trackEvent(event, properties = {}) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: event,
          properties: {
            ...properties,
            sessionId: this.sessionId,
            userId: this.userId,
            url: window.location.href,
            timestamp: Date.now()
          }
        })
      });
    } catch (error) {
      console.warn('Event tracking failed:', error);
    }
  }

  trackWebVital(metric) {
    this.trackEvent('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating
    });
  }
}

class ContentManager {
  constructor() {
    this.caseStudiesContainer = document.getElementById('case-studies-container');
    this.carouselContainer = document.getElementById('carousel-container');
    this.sectionsContainer = document.getElementById('sections-container');
  }

  updateCaseStudies(caseStudies) {
    if (!this.caseStudiesContainer) return;

    const html = caseStudies.map(study => `
      <div class="case-study-card bg-white rounded-lg shadow-lg p-6 mb-6 slide-in">
        <h3 class="text-2xl font-bold mb-4 ghibli-text-blue">${study.projectTitle}</h3>
        <p class="text-gray-600 mb-4">${study.description}</p>
        <div class="technologies mb-4">
          ${(study.technologies || '').split(',').map(tech => 
            `<span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">${tech.trim()}</span>`
          ).join('')}
        </div>
        ${study.imageUrl ? `<img src="${study.imageUrl}" alt="${study.projectTitle}" class="w-full h-48 object-cover rounded-lg mb-4">` : ''}
        <div class="flex space-x-4">
          ${study.projectUrl ? `<a href="${study.projectUrl}" target="_blank" class="text-blue-600 hover:text-blue-800">View Project</a>` : ''}
          ${study.githubUrl ? `<a href="${study.githubUrl}" target="_blank" class="text-gray-600 hover:text-gray-800">View Code</a>` : ''}
        </div>
      </div>
    `).join('');

    this.caseStudiesContainer.innerHTML = html;
    this.animateNewContent();
  }

  updateSections(sections) {
    Object.entries(sections).forEach(([sectionKey, sectionData]) => {
      const element = document.getElementById(`section-${sectionKey}`);
      if (element && typeof sectionData === 'object') {
        this.updateSectionContent(element, sectionData);
      }
    });
  }

  updateSectionContent(element, data) {
    Object.entries(data).forEach(([key, value]) => {
      const targetElement = element.querySelector(`[data-field="${key}"]`);
      if (targetElement) {
        if (targetElement.tagName === 'IMG') {
          targetElement.src = value;
        } else {
          targetElement.textContent = value;
        }
      }
    });
  }

  updateCarousel(images) {
    if (!this.carouselContainer) return;

    const html = images.map((image, index) => `
      <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
        <img src="${image.url}" alt="${image.caption || 'Portfolio image'}" class="w-full h-full object-cover">
        ${image.caption ? `<div class="carousel-caption">${image.caption}</div>` : ''}
      </div>
    `).join('');

    this.carouselContainer.innerHTML = html;
    this.initializeCarousel();
  }

  initializeCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;

    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 5000);
  }

  animateNewContent() {
    const newElements = document.querySelectorAll('.slide-in');
    newElements.forEach((element, index) => {
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  useStaticContent() {
    console.log('📄 Using static content as fallback');
    // Keep existing static content
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.portfolioIntegration = new PortfolioIntegration();
  });
} else {
  window.portfolioIntegration = new PortfolioIntegration();
}

// Export for manual initialization
window.PortfolioIntegration = PortfolioIntegration;