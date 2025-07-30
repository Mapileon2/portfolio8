// Development Firebase client (works without credentials for testing)
class FirebaseDevClient {
  constructor() {
    this.currentUser = null;
    this.isDevMode = true;
    console.log('🔧 Firebase Dev Client initialized (no credentials required)');
  }

  // Mock authentication for development
  async signIn(email, password) {
    console.log('🔧 Dev Mode: Mock sign in', { email });
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email.includes('admin')) {
      this.currentUser = {
        uid: 'dev-admin-123',
        email: email,
        displayName: 'Dev Admin',
        emailVerified: true
      };
      return this.currentUser;
    } else {
      throw new Error('Invalid credentials (use admin@example.com for dev)');
    }
  }

  async signOut() {
    console.log('🔧 Dev Mode: Sign out');
    this.currentUser = null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async getIdToken() {
    if (this.currentUser) {
      return 'dev-token-' + Date.now();
    }
    return null;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  onAuthStateChanged(callback) {
    // Simulate auth state change
    setTimeout(() => {
      callback(this.currentUser);
    }, 100);
    
    // Return unsubscribe function
    return () => {};
  }

  // Mock API methods
  async makeAuthenticatedRequest(url, options = {}) {
    console.log('🔧 Dev Mode: API Request', { url, method: options.method || 'GET' });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock responses based on URL
    if (url.includes('/case-studies')) {
      if (options.method === 'POST') {
        return { id: 'dev-case-study-' + Date.now(), ...JSON.parse(options.body) };
      }
      return {
        caseStudies: [
          {
            id: 'dev-case-study-1',
            projectTitle: 'Sample Project',
            description: 'This is a sample project for development',
            technologies: 'React, Node.js, MongoDB',
            createdAt: new Date().toISOString()
          }
        ]
      };
    }
    
    if (url.includes('/carousel-images')) {
      return {
        images: [
          {
            id: 'dev-image-1',
            url: 'https://via.placeholder.com/800x400',
            caption: 'Sample Image',
            createdAt: new Date().toISOString()
          }
        ]
      };
    }
    
    if (url.includes('/sections')) {
      return {
        about: {
          title: 'About Me',
          description: 'Sample about section'
        },
        contact: {
          email: 'dev@example.com',
          phone: '+1-234-567-8900'
        }
      };
    }
    
    if (url.includes('/verify-admin')) {
      return {
        isAdmin: true,
        user: this.currentUser
      };
    }
    
    return { success: true, message: 'Dev mode response' };
  }

  // Convenience methods
  async getCaseStudies() {
    return this.makeAuthenticatedRequest('/api/firebase/case-studies');
  }

  async createCaseStudy(data) {
    return this.makeAuthenticatedRequest('/api/firebase/case-studies', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCaseStudy(id, data) {
    return this.makeAuthenticatedRequest(`/api/firebase/case-studies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCaseStudy(id) {
    return this.makeAuthenticatedRequest(`/api/firebase/case-studies/${id}`, {
      method: 'DELETE'
    });
  }

  async getCarouselImages() {
    return this.makeAuthenticatedRequest('/api/firebase/carousel-images');
  }

  async addCarouselImage(data) {
    return this.makeAuthenticatedRequest('/api/firebase/carousel-images', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteCarouselImage(id) {
    return this.makeAuthenticatedRequest(`/api/firebase/carousel-images/${id}`, {
      method: 'DELETE'
    });
  }

  async getSections() {
    return this.makeAuthenticatedRequest('/api/firebase/sections');
  }

  async updateSections(data) {
    return this.makeAuthenticatedRequest('/api/firebase/sections', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async verifyAdmin() {
    return this.makeAuthenticatedRequest('/api/firebase/verify-admin');
  }

  async uploadImage(file, options = {}) {
    console.log('🔧 Dev Mode: Mock image upload', { fileName: file.name, options });
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      image: {
        url: 'https://via.placeholder.com/800x400',
        publicId: 'dev-image-' + Date.now(),
        thumbnail: 'https://via.placeholder.com/300x200'
      }
    };
  }

  async deleteImage(publicId) {
    console.log('🔧 Dev Mode: Mock image delete', { publicId });
    return { success: true };
  }
}

// Export singleton instance
const firebaseClient = new FirebaseDevClient();
export default firebaseClient;