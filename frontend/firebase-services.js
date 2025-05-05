import { db, auth, storage } from './firebase-config';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, sendPasswordResetEmail 
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// =====================
// Authentication Services
// =====================

export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw error;
  }
};

// =====================
// Portfolio Sections Services
// =====================

// About Section
export const getAboutData = async () => {
  try {
    const docRef = doc(db, 'sections', 'about');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

export const updateAboutData = async (data) => {
  try {
    await setDoc(doc(db, 'sections', 'about'), data);
    return true;
  } catch (error) {
    throw error;
  }
};

// Skills Section
export const getSkills = async () => {
  try {
    const skillsRef = collection(db, 'skills');
    const querySnapshot = await getDocs(skillsRef);
    const skills = [];
    querySnapshot.forEach((doc) => {
      skills.push({ id: doc.id, ...doc.data() });
    });
    return skills;
  } catch (error) {
    throw error;
  }
};

export const addSkill = async (skill) => {
  try {
    const skillId = uuidv4();
    await setDoc(doc(db, 'skills', skillId), skill);
    return skillId;
  } catch (error) {
    throw error;
  }
};

export const updateSkill = async (id, skill) => {
  try {
    await updateDoc(doc(db, 'skills', id), skill);
    return true;
  } catch (error) {
    throw error;
  }
};

export const deleteSkill = async (id) => {
  try {
    await deleteDoc(doc(db, 'skills', id));
    return true;
  } catch (error) {
    throw error;
  }
};

// Timeline/Journey Section
export const getTimelineItems = async () => {
  try {
    const timelineRef = collection(db, 'timeline');
    const q = query(timelineRef, orderBy('year', 'desc'));
    const querySnapshot = await getDocs(q);
    const timelineItems = [];
    querySnapshot.forEach((doc) => {
      timelineItems.push({ id: doc.id, ...doc.data() });
    });
    return timelineItems;
  } catch (error) {
    throw error;
  }
};

export const addTimelineItem = async (item) => {
  try {
    const itemId = uuidv4();
    await setDoc(doc(db, 'timeline', itemId), item);
    return itemId;
  } catch (error) {
    throw error;
  }
};

export const updateTimelineItem = async (id, item) => {
  try {
    await updateDoc(doc(db, 'timeline', id), item);
    return true;
  } catch (error) {
    throw error;
  }
};

export const deleteTimelineItem = async (id) => {
  try {
    await deleteDoc(doc(db, 'timeline', id));
    return true;
  } catch (error) {
    throw error;
  }
};

// Projects Section
export const getProjects = async () => {
  try {
    const projectsRef = collection(db, 'projects');
    const querySnapshot = await getDocs(projectsRef);
    const projects = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() });
    });
    return projects;
  } catch (error) {
    throw error;
  }
};

export const getProject = async (id) => {
  try {
    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

export const addProject = async (project) => {
  try {
    const projectId = uuidv4();
    await setDoc(doc(db, 'projects', projectId), project);
    return projectId;
  } catch (error) {
    throw error;
  }
};

export const updateProject = async (id, project) => {
  try {
    await updateDoc(doc(db, 'projects', id), project);
    return true;
  } catch (error) {
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    await deleteDoc(doc(db, 'projects', id));
    return true;
  } catch (error) {
    throw error;
  }
};

// Case Studies
export const getCaseStudies = async () => {
  try {
    const caseStudiesRef = collection(db, 'caseStudies');
    const querySnapshot = await getDocs(caseStudiesRef);
    const caseStudies = [];
    querySnapshot.forEach((doc) => {
      caseStudies.push({ id: doc.id, ...doc.data() });
    });
    return caseStudies;
  } catch (error) {
    throw error;
  }
};

export const getCaseStudy = async (id) => {
  try {
    const docRef = doc(db, 'caseStudies', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

export const addCaseStudy = async (caseStudy) => {
  try {
    const caseStudyId = uuidv4();
    await setDoc(doc(db, 'caseStudies', caseStudyId), caseStudy);
    return caseStudyId;
  } catch (error) {
    throw error;
  }
};

export const updateCaseStudy = async (id, caseStudy) => {
  try {
    await updateDoc(doc(db, 'caseStudies', id), caseStudy);
    return true;
  } catch (error) {
    throw error;
  }
};

export const deleteCaseStudy = async (id) => {
  try {
    await deleteDoc(doc(db, 'caseStudies', id));
    return true;
  } catch (error) {
    throw error;
  }
};

// Testimonials
export const getTestimonials = async () => {
  try {
    const testimonialsRef = collection(db, 'testimonials');
    const querySnapshot = await getDocs(testimonialsRef);
    const testimonials = [];
    querySnapshot.forEach((doc) => {
      testimonials.push({ id: doc.id, ...doc.data() });
    });
    return testimonials;
  } catch (error) {
    throw error;
  }
};

export const addTestimonial = async (testimonial) => {
  try {
    const testimonialId = uuidv4();
    await setDoc(doc(db, 'testimonials', testimonialId), testimonial);
    return testimonialId;
  } catch (error) {
    throw error;
  }
};

export const updateTestimonial = async (id, testimonial) => {
  try {
    await updateDoc(doc(db, 'testimonials', id), testimonial);
    return true;
  } catch (error) {
    throw error;
  }
};

export const deleteTestimonial = async (id) => {
  try {
    await deleteDoc(doc(db, 'testimonials', id));
    return true;
  } catch (error) {
    throw error;
  }
};

// Contact Info
export const getContactInfo = async () => {
  try {
    const docRef = doc(db, 'sections', 'contact');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

export const updateContactInfo = async (data) => {
  try {
    await setDoc(doc(db, 'sections', 'contact'), data);
    return true;
  } catch (error) {
    throw error;
  }
};

// =====================
// File Upload Services
// =====================

export const uploadImage = async (file, folder = 'images') => {
  try {
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      fileName,
      fileUrl: downloadURL
    };
  } catch (error) {
    throw error;
  }
};

export const deleteImage = async (filePath) => {
  try {
    const imageRef = ref(storage, filePath);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    throw error;
  }
};

// =====================
// Site Settings
// =====================

export const getSiteSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'site');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

export const updateSiteSettings = async (data) => {
  try {
    await setDoc(doc(db, 'settings', 'site'), data);
    return true;
  } catch (error) {
    throw error;
  }
}; 