const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize databases for different collections
const projectsAdapter = new FileSync(path.join(dataDir, 'projects.json'));
const caseStudiesAdapter = new FileSync(path.join(dataDir, 'case-studies.json'));
const sectionsAdapter = new FileSync(path.join(dataDir, 'sections.json'));
const carouselImagesAdapter = new FileSync(path.join(dataDir, 'carousel-images.json'));
const usersAdapter = new FileSync(path.join(dataDir, 'users.json'));

const projectsDb = low(projectsAdapter);
const caseStudiesDb = low(caseStudiesAdapter);
const sectionsDb = low(sectionsAdapter);
const carouselImagesDb = low(carouselImagesAdapter);
const usersDb = low(usersAdapter);

// Set defaults if JSON files are empty
projectsDb.defaults({ projects: [] }).write();
caseStudiesDb.defaults({ caseStudies: [] }).write();
sectionsDb.defaults({ sections: {} }).write();
carouselImagesDb.defaults({ images: [] }).write();
usersDb.defaults({ users: [], admins: [] }).write();

// Helper function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Helper to add timestamps to records
function addTimestamps(data, userId) {
  const now = new Date().toISOString();
  return {
    ...data,
    createdAt: now,
    updatedAt: now,
    createdBy: userId || 'system'
  };
}

// Helper to update timestamps for existing records
function updateTimestamps(data, userId) {
  return {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: userId || 'system'
  };
}

// Projects operations
const projects = {
  getAll: () => {
    return projectsDb.get('projects')
      .sortBy('createdAt')
      .reverse()
      .value();
  },
  
  getById: (id) => {
    return projectsDb.get('projects')
      .find({ id })
      .value();
  },
  
  create: (projectData, userId) => {
    const id = generateId();
    const project = addTimestamps({ ...projectData, id }, userId);
    
    projectsDb.get('projects')
      .push(project)
      .write();
      
    return project;
  },
  
  update: (id, updates, userId) => {
    const project = projectsDb.get('projects')
      .find({ id })
      .value();
      
    if (!project) return null;
    
    const updatedProject = {
      ...project,
      ...updates,
      ...updateTimestamps({}, userId)
    };
    
    projectsDb.get('projects')
      .find({ id })
      .assign(updatedProject)
      .write();
      
    return updatedProject;
  },
  
  delete: (id) => {
    return projectsDb.get('projects')
      .remove({ id })
      .write();
  }
};

// Case Studies operations
const caseStudies = {
  getAll: () => {
    return caseStudiesDb.get('caseStudies')
      .value();
  },
  
  getById: (id) => {
    return caseStudiesDb.get('caseStudies')
      .find({ id })
      .value();
  },
  
  create: (caseStudyData, userId) => {
    const id = generateId();
    const caseStudy = addTimestamps({ ...caseStudyData, id }, userId);
    
    caseStudiesDb.get('caseStudies')
      .push(caseStudy)
      .write();
      
    // If linked to a project, update the project
    if (caseStudy.projectId) {
      projects.update(caseStudy.projectId, {
        hasCaseStudy: true,
        caseStudyId: id
      }, userId);
    }
      
    return caseStudy;
  },
  
  update: (id, updates, userId) => {
    const caseStudy = caseStudiesDb.get('caseStudies')
      .find({ id })
      .value();
      
    if (!caseStudy) return null;
    
    const updatedCaseStudy = {
      ...caseStudy,
      ...updates,
      ...updateTimestamps({}, userId)
    };
    
    caseStudiesDb.get('caseStudies')
      .find({ id })
      .assign(updatedCaseStudy)
      .write();
      
    return updatedCaseStudy;
  },
  
  delete: (id, userId) => {
    const caseStudy = caseStudiesDb.get('caseStudies')
      .find({ id })
      .value();
      
    if (caseStudy && caseStudy.projectId) {
      projects.update(caseStudy.projectId, {
        hasCaseStudy: false,
        caseStudyId: null
      }, userId);
    }
    
    return caseStudiesDb.get('caseStudies')
      .remove({ id })
      .write();
  }
};

// Sections operations
const sections = {
  getAll: () => {
    return sectionsDb.get('sections').value();
  },
  
  update: (sectionData, userId) => {
    const updatedSections = {
      ...sectionsDb.get('sections').value(),
      ...sectionData,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || 'system'
    };
    
    sectionsDb.set('sections', updatedSections).write();
    return updatedSections;
  }
};

// Carousel Images operations
const carouselImages = {
  getAll: () => {
    return carouselImagesDb.get('images')
      .sortBy('order')
      .value();
  },
  
  create: (imageData, userId) => {
    const id = generateId();
    const image = addTimestamps({ ...imageData, id }, userId);
    
    carouselImagesDb.get('images')
      .push(image)
      .write();
      
    return image;
  },
  
  update: (id, updates, userId) => {
    const image = carouselImagesDb.get('images')
      .find({ id })
      .value();
      
    if (!image) return null;
    
    const updatedImage = {
      ...image,
      ...updates,
      ...updateTimestamps({}, userId)
    };
    
    carouselImagesDb.get('images')
      .find({ id })
      .assign(updatedImage)
      .write();
      
    return updatedImage;
  },
  
  delete: (id) => {
    return carouselImagesDb.get('images')
      .remove({ id })
      .write();
  }
};

// Users operations
const users = {
  getAll: () => {
    return usersDb.get('users').value();
  },
  
  getById: (id) => {
    return usersDb.get('users')
      .find({ id })
      .value();
  },
  
  getByEmail: (email) => {
    return usersDb.get('users')
      .find({ email })
      .value();
  },
  
  create: (userData) => {
    const id = generateId();
    const user = addTimestamps({ ...userData, id });
    
    usersDb.get('users')
      .push(user)
      .write();
      
    return user;
  },
  
  update: (id, updates) => {
    const user = usersDb.get('users')
      .find({ id })
      .value();
      
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updates,
      ...updateTimestamps({})
    };
    
    usersDb.get('users')
      .find({ id })
      .assign(updatedUser)
      .write();
      
    return updatedUser;
  },
  
  delete: (id) => {
    return usersDb.get('users')
      .remove({ id })
      .write();
  },
  
  getAdmins: () => {
    return usersDb.get('admins').value();
  },
  
  addAdmin: (email) => {
    if (!usersDb.get('admins').includes(email).value()) {
      usersDb.get('admins').push(email).write();
    }
    return usersDb.get('admins').value();
  },
  
  removeAdmin: (email) => {
    usersDb.get('admins').remove(e => e === email).write();
    return usersDb.get('admins').value();
  }
};

// Add new adapters for additional collections
const skillsAdapter = new FileSync(path.join(dataDir, 'skills.json'));
const testimonialsAdapter = new FileSync(path.join(dataDir, 'testimonials.json'));
const contactAdapter = new FileSync(path.join(dataDir, 'contact.json'));
const aboutAdapter = new FileSync(path.join(dataDir, 'about.json'));
const timelineAdapter = new FileSync(path.join(dataDir, 'timeline.json'));
const settingsAdapter = new FileSync(path.join(dataDir, 'settings.json'));

// Initialize new DB instances
const skillsDb = low(skillsAdapter);
const testimonialsDb = low(testimonialsAdapter);
const contactDb = low(contactAdapter);
const aboutDb = low(aboutAdapter);
const timelineDb = low(timelineAdapter);
const settingsDb = low(settingsAdapter);

// Set defaults
skillsDb.defaults({ skills: [] }).write();
testimonialsDb.defaults({ testimonials: [] }).write();
contactDb.defaults({ contact: {} }).write();
aboutDb.defaults({ about: {} }).write();
timelineDb.defaults({ timeline: [] }).write();
settingsDb.defaults({ settings: {} }).write();

// Skills operations
const skills = {
  getAll: () => skillsDb.get('skills').value(),
  getById: id => skillsDb.get('skills').find({ id }).value(),
  create: (data, userId) => {
    const id = generateId();
    const record = addTimestamps({ ...data, id }, userId);
    skillsDb.get('skills').push(record).write();
    return record;
  },
  update: (id, updates, userId) => {
    const existing = skillsDb.get('skills').find({ id }).value();
    if (!existing) return null;
    const updated = { ...existing, ...updates, ...updateTimestamps({}, userId) };
    skillsDb.get('skills').find({ id }).assign(updated).write();
    return updated;
  },
  delete: id => skillsDb.get('skills').remove({ id }).write()
};

// Testimonials operations
const testimonials = {
  getAll: () => testimonialsDb.get('testimonials').value(),
  getById: id => testimonialsDb.get('testimonials').find({ id }).value(),
  create: (data, userId) => {
    const id = generateId();
    const record = addTimestamps({ ...data, id }, userId);
    testimonialsDb.get('testimonials').push(record).write();
    return record;
  },
  update: (id, updates, userId) => {
    const existing = testimonialsDb.get('testimonials').find({ id }).value();
    if (!existing) return null;
    const updated = { ...existing, ...updates, ...updateTimestamps({}, userId) };
    testimonialsDb.get('testimonials').find({ id }).assign(updated).write();
    return updated;
  },
  delete: id => testimonialsDb.get('testimonials').remove({ id }).write()
};

// Contact operations (single document)
const contact = {
  get: () => contactDb.get('contact').value(),
  update: (data, userId) => {
    const updated = { ...data, ...updateTimestamps({}, userId) };
    contactDb.set('contact', updated).write();
    return updated;
  }
};

// About operations (single document)
const about = {
  get: () => aboutDb.get('about').value(),
  update: (data, userId) => {
    const updated = { ...data, ...updateTimestamps({}, userId) };
    aboutDb.set('about', updated).write();
    return updated;
  }
};

// Timeline operations
const timeline = {
  getAll: () => timelineDb.get('timeline').sortBy('year').reverse().value(),
  getById: id => timelineDb.get('timeline').find({ id }).value(),
  create: (data, userId) => {
    const id = generateId();
    const record = addTimestamps({ ...data, id }, userId);
    timelineDb.get('timeline').push(record).write();
    return record;
  },
  update: (id, updates, userId) => {
    const existing = timelineDb.get('timeline').find({ id }).value();
    if (!existing) return null;
    const updated = { ...existing, ...updates, ...updateTimestamps({}, userId) };
    timelineDb.get('timeline').find({ id }).assign(updated).write();
    return updated;
  },
  delete: id => timelineDb.get('timeline').remove({ id }).write()
};

// Site settings operations (single document)
const settings = {
  get: () => settingsDb.get('settings').value(),
  update: (data, userId) => {
    const updated = { ...data, ...updateTimestamps({}, userId) };
    settingsDb.set('settings', updated).write();
    return updated;
  }
};

module.exports = {
  projects,
  caseStudies,
  sections,
  carouselImages,
  users,
  skills,
  testimonials,
  contact,
  about,
  timeline,
  settings
}; 