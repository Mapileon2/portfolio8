// Firebase API for Vercel deployment
const fs = require('fs');
const path = require('path');

// Mock data for development/demo
const getMockData = () => ({
  caseStudies: [
    {
      id: 'case-study-1',
      projectTitle: 'E-commerce Platform',
      description: 'Modern e-commerce solution built with React and Node.js',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      category: 'Web Development',
      status: 'published',
      featured: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
          alt: 'E-commerce dashboard',
          caption: 'Admin dashboard overview'
        }
      ],
      liveUrl: 'https://example-ecommerce.com',
      githubUrl: 'https://github.com/user/ecommerce-project',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'case-study-2',
      projectTitle: 'Task Management App',
      description: 'Collaborative task management application with real-time updates',
      technologies: ['React', 'Firebase', 'Material-UI'],
      category: 'Web Application',
      status: 'published',
      featured: false,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800',
          alt: 'Task management interface',
          caption: 'Main task board view'
        }
      ],
      liveUrl: 'https://example-tasks.com',
      githubUrl: 'https://github.com/user/task-app',
      createdAt: '2024-01-10T14:20:00Z',
      updatedAt: '2024-01-10T14:20:00Z'
    }
  ],
  carouselImages: [
    {
      id: 'carousel-1',
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200',
      alt: 'Portfolio showcase',
      caption: 'Featured project showcase',
      order: 1,
      active: true,
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'carousel-2',
      url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200',
      alt: 'Development workspace',
      caption: 'Modern development environment',
      order: 2,
      active: true,
      createdAt: '2024-01-15T10:30:00Z'
    }
  ],
  sections: {
    hero: {
      title: 'Welcome to My Portfolio',
      subtitle: 'Full Stack Developer & Designer',
      description: 'Creating amazing web experiences with modern technologies',
      backgroundImage: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1200',
      ctaText: 'View My Work',
      ctaLink: '#projects'
    },
    about: {
      title: 'About Me',
      content: 'I\'m a passionate full-stack developer with expertise in modern web technologies. I love creating efficient, scalable, and user-friendly applications.',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'PostgreSQL'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    contact: {
      title: 'Get In Touch',
      email: 'contact@example.com',
      phone: '+1 (555) 123-4567',
      social: {
        github: 'https://github.com/username',
        linkedin: 'https://linkedin.com/in/username',
        twitter: 'https://twitter.com/username'
      }
    }
  }
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    const urlPath = url.replace('/api/firebase', '') || '/';
    const mockData = getMockData();
    
    // Case Studies endpoints
    if (urlPath === '/case-studies' && method === 'GET') {
      res.status(200).json({
        success: true,
        data: mockData.caseStudies
      });
      
    } else if (urlPath === '/case-studies' && method === 'POST') {
      const newCaseStudy = {
        id: `case-study-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        data: newCaseStudy
      });
      
    } else if (urlPath.startsWith('/case-studies/') && method === 'PUT') {
      const id = urlPath.split('/')[2];
      const updatedCaseStudy = {
        id,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      res.status(200).json({
        success: true,
        data: updatedCaseStudy
      });
      
    } else if (urlPath.startsWith('/case-studies/') && method === 'DELETE') {
      const id = urlPath.split('/')[2];
      
      res.status(200).json({
        success: true,
        message: 'Case study deleted successfully'
      });
      
    // Carousel Images endpoints
    } else if (urlPath === '/carousel-images' && method === 'GET') {
      res.status(200).json({
        success: true,
        data: mockData.carouselImages
      });
      
    } else if (urlPath === '/carousel-images' && method === 'POST') {
      const newImage = {
        id: `carousel-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        data: newImage
      });
      
    } else if (urlPath.startsWith('/carousel-images/') && method === 'DELETE') {
      const id = urlPath.split('/')[2];
      
      res.status(200).json({
        success: true,
        message: 'Carousel image deleted successfully'
      });
      
    // Sections endpoints
    } else if (urlPath === '/sections' && method === 'GET') {
      res.status(200).json({
        success: true,
        data: mockData.sections
      });
      
    } else if (urlPath === '/sections' && method === 'PUT') {
      const updatedSections = {
        ...mockData.sections,
        ...req.body
      };
      
      res.status(200).json({
        success: true,
        data: updatedSections
      });
      
    // Admin verification
    } else if (urlPath === '/verify-admin' && method === 'POST') {
      const { email, password } = req.body;
      
      // Mock admin verification
      if (email === 'admin@example.com') {
        res.status(200).json({
          success: true,
          user: {
            uid: 'admin-uid',
            email: 'admin@example.com',
            role: 'admin'
          },
          token: 'mock-jwt-token'
        });
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: 'Invalid credentials'
          }
        });
      }
      
    } else if (urlPath === '/create-admin' && method === 'GET') {
      // Development only endpoint
      res.status(200).json({
        success: true,
        message: 'Admin user created successfully',
        credentials: {
          email: 'admin@example.com',
          password: 'Use any password for demo'
        }
      });
      
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Firebase endpoint not found'
        }
      });
    }
    
  } catch (error) {
    console.error('Firebase API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process Firebase request'
      }
    });
  }
};