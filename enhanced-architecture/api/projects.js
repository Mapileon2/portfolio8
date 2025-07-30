const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const projectsFile = path.join(__dirname, '../data/projects.json');

// Helper function to load projects
async function loadProjects() {
  try {
    const data = await fs.readFile(projectsFile, 'utf8');
    return JSON.parse(data).projects || [];
  } catch (error) {
    // Return default projects if file doesn't exist
    return [
      {
        id: 'ecommerce-platform',
        title: 'E-commerce Platform',
        description: 'A full-stack e-commerce solution built with React and Node.js, featuring user authentication, payment processing, and admin dashboard.',
        longDescription: 'This comprehensive e-commerce platform includes features like product catalog, shopping cart, user accounts, order management, payment integration with Stripe, and a complete admin panel for managing products and orders.',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express', 'Stripe API'],
        category: 'Web Development',
        featured: true,
        status: 'completed',
        githubUrl: 'https://github.com/yourusername/ecommerce-platform',
        liveUrl: 'https://ecommerce-demo.yoursite.com',
        imageUrl: '/images/projects/ecommerce-platform.jpg',
        createdAt: '2023-01-15T00:00:00.000Z',
        updatedAt: '2023-06-20T00:00:00.000Z'
      },
      {
        id: 'task-management-app',
        title: 'Task Management App',
        description: 'A collaborative task management application with real-time updates, built using Vue.js and Firebase.',
        longDescription: 'This task management application allows teams to collaborate effectively with features like real-time updates, task assignments, progress tracking, file attachments, and team communication.',
        technologies: ['Vue.js', 'Firebase', 'Vuetify', 'Cloud Firestore'],
        category: 'Web Development',
        featured: true,
        status: 'completed',
        githubUrl: 'https://github.com/yourusername/task-management',
        liveUrl: 'https://tasks-demo.yoursite.com',
        imageUrl: '/images/projects/task-management.jpg',
        createdAt: '2023-03-10T00:00:00.000Z',
        updatedAt: '2023-08-15T00:00:00.000Z'
      },
      {
        id: 'weather-dashboard',
        title: 'Weather Dashboard',
        description: 'A responsive weather dashboard that displays current weather and forecasts for multiple cities.',
        longDescription: 'This weather dashboard provides comprehensive weather information including current conditions, 7-day forecasts, weather maps, and historical data. Features location-based weather detection and favorite cities management.',
        technologies: ['JavaScript', 'HTML5', 'CSS3', 'OpenWeather API'],
        category: 'Web Development',
        featured: false,
        status: 'completed',
        githubUrl: 'https://github.com/yourusername/weather-dashboard',
        liveUrl: 'https://weather-demo.yoursite.com',
        imageUrl: '/images/projects/weather-dashboard.jpg',
        createdAt: '2023-05-20T00:00:00.000Z',
        updatedAt: '2023-07-10T00:00:00.000Z'
      }
    ];
  }
}

// Helper function to save projects
async function saveProjects(projects) {
  try {
    const dataDir = path.dirname(projectsFile);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(projectsFile, JSON.stringify({ projects }, null, 2));
  } catch (error) {
    console.error('Error saving projects:', error);
    throw error;
  }
}

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await loadProjects();
    const { featured, category, technology, status } = req.query;
    
    let filteredProjects = projects;

    // Apply filters
    if (featured === 'true') {
      filteredProjects = filteredProjects.filter(p => p.featured);
    }
    
    if (category) {
      filteredProjects = filteredProjects.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (technology) {
      filteredProjects = filteredProjects.filter(p => 
        p.technologies.some(tech => 
          tech.toLowerCase().includes(technology.toLowerCase())
        )
      );
    }
    
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }

    // Sort by updatedAt (newest first)
    filteredProjects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      projects: filteredProjects,
      total: filteredProjects.length
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Create new project (admin endpoint)
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      longDescription,
      technologies,
      category,
      featured = false,
      status = 'in-progress',
      githubUrl,
      liveUrl,
      imageUrl
    } = req.body;

    if (!title || !description || !technologies || !category) {
      return res.status(400).json({
        error: 'Title, description, technologies, and category are required'
      });
    }

    const projects = await loadProjects();
    
    const newProject = {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      description,
      longDescription: longDescription || description,
      technologies: Array.isArray(technologies) ? technologies : [technologies],
      category,
      featured,
      status,
      githubUrl,
      liveUrl,
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check if project with same ID already exists
    if (projects.find(p => p.id === newProject.id)) {
      return res.status(400).json({ error: 'Project with this title already exists' });
    }

    projects.push(newProject);
    await saveProjects(projects);

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project (admin endpoint)
router.put('/:id', async (req, res) => {
  try {
    const projects = await loadProjects();
    const projectIndex = projects.findIndex(p => p.id === req.params.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = {
      ...projects[projectIndex],
      ...req.body,
      id: projects[projectIndex].id, // Prevent ID changes
      createdAt: projects[projectIndex].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    projects[projectIndex] = updatedProject;
    await saveProjects(projects);

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project (admin endpoint)
router.delete('/:id', async (req, res) => {
  try {
    const projects = await loadProjects();
    const projectIndex = projects.findIndex(p => p.id === req.params.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const deletedProject = projects.splice(projectIndex, 1)[0];
    await saveProjects(projects);

    res.json({ success: true, project: deletedProject });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project categories
router.get('/meta/categories', async (req, res) => {
  try {
    const projects = await loadProjects();
    const categories = [...new Set(projects.map(p => p.category))];
    res.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get project technologies
router.get('/meta/technologies', async (req, res) => {
  try {
    const projects = await loadProjects();
    const technologies = [...new Set(projects.flatMap(p => p.technologies))];
    res.json({ technologies: technologies.sort() });
  } catch (error) {
    console.error('Error getting technologies:', error);
    res.status(500).json({ error: 'Failed to get technologies' });
  }
});

module.exports = router;