const path = require('path');
const fs = require('fs');
const { admin, firestore, rtdb } = require('./firebase-admin');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize Firebase collections
const projectsCollection = 'projects';
const caseStudiesCollection = 'caseStudies';
const sectionsCollection = 'sections';
const carouselImagesCollection = 'carouselImages';
const usersCollection = 'users';

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
  getAll: async () => {
    try {
      const snapshot = await firestore.collection(projectsCollection).orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const doc = await firestore.collection(projectsCollection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting project ${id}:`, error);
      return null;
    }
  },
  
  create: async (projectData, userId) => {
    try {
      const id = generateId();
      const project = addTimestamps({ ...projectData }, userId);
      
      await firestore.collection(projectsCollection).doc(id).set(project);
      
      return { id, ...project };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  
  update: async (id, updates, userId) => {
    try {
      const docRef = firestore.collection(projectsCollection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return null;
      
      const updatedProject = {
        ...updates,
        ...updateTimestamps({}, userId)
      };
      
      await docRef.update(updatedProject);
      
      return { id, ...doc.data(), ...updatedProject };
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await firestore.collection(projectsCollection).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  }
};

// Case Studies operations
const caseStudies = {
  getAll: async () => {
    try {
      const snapshot = await firestore.collection(caseStudiesCollection).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting case studies:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const doc = await firestore.collection(caseStudiesCollection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting case study ${id}:`, error);
      return null;
    }
  },
  
  create: async (caseStudyData, userId) => {
    try {
      const id = generateId();
      const caseStudy = addTimestamps({ ...caseStudyData }, userId);
      
      await firestore.collection(caseStudiesCollection).doc(id).set(caseStudy);
      
      // If linked to a project, update the project
      if (caseStudy.projectId) {
        await projects.update(caseStudy.projectId, {
          hasCaseStudy: true,
          caseStudyId: id
        }, userId);
      }
      
      return { id, ...caseStudy };
    } catch (error) {
      console.error('Error creating case study:', error);
      throw error;
    }
  },
  
  update: async (id, updates, userId) => {
    try {
      const docRef = firestore.collection(caseStudiesCollection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return null;
      
      const updatedCaseStudy = {
        ...updates,
        ...updateTimestamps({}, userId)
      };
      
      await docRef.update(updatedCaseStudy);
      
      return { id, ...doc.data(), ...updatedCaseStudy };
    } catch (error) {
      console.error(`Error updating case study ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id, userId) => {
    try {
      const docRef = firestore.collection(caseStudiesCollection).doc(id);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const caseStudy = doc.data();
        if (caseStudy && caseStudy.projectId) {
          await projects.update(caseStudy.projectId, {
            hasCaseStudy: false,
            caseStudyId: null
          }, userId);
        }
      }
      
      await docRef.delete();
      return true;
    } catch (error) {
      console.error(`Error deleting case study ${id}:`, error);
      throw error;
    }
  }
};

// Sections operations
const sections = {
  getAll: async () => {
    try {
      const doc = await firestore.collection('website').doc('sections').get();
      return doc.exists ? doc.data() : {};
    } catch (error) {
      console.error('Error getting sections:', error);
      return {};
    }
  },
  
  update: async (sectionData, userId) => {
    try {
      const docRef = firestore.collection('website').doc('sections');
      const doc = await docRef.get();
      
      const updatedSections = {
        ...(doc.exists ? doc.data() : {}),
        ...sectionData,
        updatedAt: new Date().toISOString(),
        updatedBy: userId || 'system'
      };
      
      await docRef.set(updatedSections);
      return updatedSections;
    } catch (error) {
      console.error('Error updating sections:', error);
      throw error;
    }
  }
};

// Carousel Images operations
const carouselImages = {
  getAll: async () => {
    try {
      const snapshot = await firestore.collection(carouselImagesCollection).orderBy('order').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting carousel images:', error);
      return [];
    }
  },
  
  create: async (imageData, userId) => {
    try {
      const id = generateId();
      const image = addTimestamps({ ...imageData }, userId);
      
      await firestore.collection(carouselImagesCollection).doc(id).set(image);
      
      return { id, ...image };
    } catch (error) {
      console.error('Error creating carousel image:', error);
      throw error;
    }
  },
  
  update: async (id, updates, userId) => {
    try {
      const docRef = firestore.collection(carouselImagesCollection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return null;
      
      const updatedImage = {
        ...updates,
        ...updateTimestamps({}, userId)
      };
      
      await docRef.update(updatedImage);
      
      return { id, ...doc.data(), ...updatedImage };
    } catch (error) {
      console.error(`Error updating carousel image ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await firestore.collection(carouselImagesCollection).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting carousel image ${id}:`, error);
      throw error;
    }
  }
};

// Users operations
const users = {
  getAll: async () => {
    try {
      const snapshot = await firestore.collection(usersCollection).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const doc = await firestore.collection(usersCollection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting user ${id}:`, error);
      return null;
    }
  },
  
  getByEmail: async (email) => {
    try {
      const snapshot = await firestore.collection(usersCollection)
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting user by email ${email}:`, error);
      return null;
    }
  },
  
  create: async (userData) => {
    try {
      const id = generateId();
      const user = addTimestamps({ ...userData });
      
      await firestore.collection(usersCollection).doc(id).set(user);
      
      return { id, ...user };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  update: async (id, updates) => {
    try {
      const docRef = firestore.collection(usersCollection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return null;
      
      const updatedUser = {
        ...updates,
        ...updateTimestamps({})
      };
      
      await docRef.update(updatedUser);
      
      return { id, ...doc.data(), ...updatedUser };
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await firestore.collection(usersCollection).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },
  
  getAdmins: async () => {
    try {
      const doc = await firestore.collection('website').doc('admins').get();
      return doc.exists ? doc.data().emails || [] : [];
    } catch (error) {
      console.error('Error getting admins:', error);
      return [];
    }
  },
  
  addAdmin: async (email) => {
    try {
      const docRef = firestore.collection('website').doc('admins');
      const doc = await docRef.get();
      
      let admins = [];
      if (doc.exists) {
        admins = doc.data().emails || [];
      }
      
      if (!admins.includes(email)) {
        admins.push(email);
        await docRef.set({ emails: admins });
      }
      
      return admins;
    } catch (error) {
      console.error(`Error adding admin ${email}:`, error);
      throw error;
    }
  },
  
  removeAdmin: async (email) => {
    try {
      const docRef = firestore.collection('website').doc('admins');
      const doc = await docRef.get();
      
      let admins = [];
      if (doc.exists) {
        admins = doc.data().emails || [];
      }
      
      const updatedAdmins = admins.filter(e => e !== email);
      await docRef.set({ emails: updatedAdmins });
      
      return updatedAdmins;
    } catch (error) {
      console.error(`Error removing admin ${email}:`, error);
      throw error;
    }
  }
};

// Remove lowdb initialization code for additional collections
// Initialize Firebase collections instead
const skillsCollection = 'skills';
const testimonialsCollection = 'testimonials';
const timelineCollection = 'timeline';

// Skills operations
const skills = {
  getAll: async () => {
    try {
      const snapshot = await firestore.collection(skillsCollection).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting skills:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const doc = await firestore.collection(skillsCollection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting skill ${id}:`, error);
      return null;
    }
  },
  
  create: async (data, userId) => {
    try {
      const id = generateId();
      const record = addTimestamps(data, userId);
      
      await firestore.collection(skillsCollection).doc(id).set(record);
      
      return { id, ...record };
    } catch (error) {
      console.error('Error creating skill:', error);
      throw error;
    }
  },
  
  update: async (id, updates, userId) => {
    try {
      const docRef = firestore.collection(skillsCollection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return null;
      
      const updatedRecord = {
        ...updates,
        ...updateTimestamps({}, userId)
      };
      
      await docRef.update(updatedRecord);
      
      return { id, ...doc.data(), ...updatedRecord };
    } catch (error) {
      console.error(`Error updating skill ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await firestore.collection(skillsCollection).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting skill ${id}:`, error);
      throw error;
    }
  }
};

// Testimonials operations
const testimonials = {
  getAll: async () => {
    try {
      const snapshot = await firestore.collection(testimonialsCollection).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting testimonials:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const doc = await firestore.collection(testimonialsCollection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting testimonial ${id}:`, error);
      return null;
    }
  },
  
  create: async (data, userId) => {
    try {
      const id = generateId();
      const record = addTimestamps(data, userId);
      
      await firestore.collection(testimonialsCollection).doc(id).set(record);
      
      return { id, ...record };
    } catch (error) {
      console.error('Error creating testimonial:', error);
      throw error;
    }
  },
  
  update: async (id, updates, userId) => {
    try {
      const docRef = firestore.collection(testimonialsCollection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return null;
      
      const updatedRecord = {
        ...updates,
        ...updateTimestamps({}, userId)
      };
      
      await docRef.update(updatedRecord);
      
      return { id, ...doc.data(), ...updatedRecord };
    } catch (error) {
      console.error(`Error updating testimonial ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await firestore.collection(testimonialsCollection).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting testimonial ${id}:`, error);
      throw error;
    }
  }
};

// Contact operations (single document)
const contact = {
  get: async () => {
    try {
      const doc = await firestore.collection('website').doc('contact').get();
      return doc.exists ? doc.data() : {};
    } catch (error) {
      console.error('Error getting contact info:', error);
      return {};
    }
  },
  
  update: async (data, userId) => {
    try {
      const updated = { ...data, ...updateTimestamps({}, userId) };
      await firestore.collection('website').doc('contact').set(updated);
      return updated;
    } catch (error) {
      console.error('Error updating contact info:', error);
      throw error;
    }
  }
};

// About operations (single document)
const about = {
  get: async () => {
    try {
      const doc = await firestore.collection('website').doc('about').get();
      return doc.exists ? doc.data() : {};
    } catch (error) {
      console.error('Error getting about info:', error);
      return {};
    }
  },
  
  update: async (data, userId) => {
    try {
      const updated = { ...data, ...updateTimestamps({}, userId) };
      await firestore.collection('website').doc('about').set(updated);
      return updated;
    } catch (error) {
      console.error('Error updating about info:', error);
      throw error;
    }
  }
};

// Timeline operations
const timeline = {
  getAll: async () => {
    try {
      const snapshot = await firestore.collection(timelineCollection).orderBy('year', 'desc').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting timeline items:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const doc = await firestore.collection(timelineCollection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting timeline item ${id}:`, error);
      return null;
    }
  },
  
  create: async (data, userId) => {
    try {
      const id = generateId();
      const record = addTimestamps(data, userId);
      
      await firestore.collection(timelineCollection).doc(id).set(record);
      
      return { id, ...record };
    } catch (error) {
      console.error('Error creating timeline item:', error);
      throw error;
    }
  },
  
  update: async (id, updates, userId) => {
    try {
      const docRef = firestore.collection(timelineCollection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) return null;
      
      const updatedRecord = {
        ...updates,
        ...updateTimestamps({}, userId)
      };
      
      await docRef.update(updatedRecord);
      
      return { id, ...doc.data(), ...updatedRecord };
    } catch (error) {
      console.error(`Error updating timeline item ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await firestore.collection(timelineCollection).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting timeline item ${id}:`, error);
      throw error;
    }
  }
};

// Site settings operations (single document)
const settings = {
  get: async () => {
    try {
      const doc = await firestore.collection('website').doc('settings').get();
      return doc.exists ? doc.data() : {};
    } catch (error) {
      console.error('Error getting site settings:', error);
      return {};
    }
  },
  
  update: async (data, userId) => {
    try {
      const updated = { ...data, ...updateTimestamps({}, userId) };
      await firestore.collection('website').doc('settings').set(updated);
      return updated;
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
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