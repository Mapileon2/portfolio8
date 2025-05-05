/**
 * Portfolio API Client
 * This file provides utilities to interact with the NoSQL backend API
 */

const API = {
  baseUrl: '/api', // Relative URL to support both development and production
  
  // Project endpoints
  async getAllProjects() {
    try {
      const response = await fetch(`${this.baseUrl}/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },
  
  async getProject(id) {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return await response.json();
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },
  
  async createProject(projectData) {
    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      return await response.json();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  
  async updateProject(id, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update project');
      return await response.json();
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  },
  
  async deleteProject(id) {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete project');
      return await response.json();
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  },
  
  // Case Study endpoints
  async getAllCaseStudies() {
    try {
      const response = await fetch(`${this.baseUrl}/case-studies`);
      if (!response.ok) throw new Error('Failed to fetch case studies');
      return await response.json();
    } catch (error) {
      console.error('Error fetching case studies:', error);
      throw error;
    }
  },
  
  async getCaseStudy(id) {
    try {
      const response = await fetch(`${this.baseUrl}/case-studies/${id}`);
      if (!response.ok) throw new Error('Failed to fetch case study');
      return await response.json();
    } catch (error) {
      console.error(`Error fetching case study ${id}:`, error);
      throw error;
    }
  },
  
  async createCaseStudy(caseStudyData) {
    try {
      const response = await fetch(`${this.baseUrl}/case-studies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(caseStudyData)
      });
      
      if (!response.ok) throw new Error('Failed to create case study');
      return await response.json();
    } catch (error) {
      console.error('Error creating case study:', error);
      throw error;
    }
  },
  
  async updateCaseStudy(id, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/case-studies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update case study');
      return await response.json();
    } catch (error) {
      console.error(`Error updating case study ${id}:`, error);
      throw error;
    }
  },
  
  async deleteCaseStudy(id) {
    try {
      const response = await fetch(`${this.baseUrl}/case-studies/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete case study');
      return await response.json();
    } catch (error) {
      console.error(`Error deleting case study ${id}:`, error);
      throw error;
    }
  },
  
  // Sections endpoints
  async getSections() {
    try {
      const response = await fetch(`${this.baseUrl}/sections`);
      if (!response.ok) throw new Error('Failed to fetch sections');
      return await response.json();
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  },
  
  async updateSections(sectionsData) {
    try {
      const response = await fetch(`${this.baseUrl}/sections`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sectionsData)
      });
      
      if (!response.ok) throw new Error('Failed to update sections');
      return await response.json();
    } catch (error) {
      console.error('Error updating sections:', error);
      throw error;
    }
  },
  
  // Carousel Images endpoints
  async getCarouselImages() {
    try {
      const response = await fetch(`${this.baseUrl}/carousel-images`);
      if (!response.ok) throw new Error('Failed to fetch carousel images');
      return await response.json();
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      throw error;
    }
  },
  
  async createCarouselImage(imageData) {
    try {
      const response = await fetch(`${this.baseUrl}/carousel-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(imageData)
      });
      
      if (!response.ok) throw new Error('Failed to create carousel image');
      return await response.json();
    } catch (error) {
      console.error('Error creating carousel image:', error);
      throw error;
    }
  },
  
  async updateCarouselImage(id, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/carousel-images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update carousel image');
      return await response.json();
    } catch (error) {
      console.error(`Error updating carousel image ${id}:`, error);
      throw error;
    }
  },
  
  async deleteCarouselImage(id) {
    try {
      const response = await fetch(`${this.baseUrl}/carousel-images/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete carousel image');
      return await response.json();
    } catch (error) {
      console.error(`Error deleting carousel image ${id}:`, error);
      throw error;
    }
  }
};

// Example usage:
// API.getAllProjects().then(projects => {
//   console.log('Projects:', projects);
// }).catch(error => {
//   console.error('Failed to get projects:', error);
// }); 