import { auth } from './firebase-config.js';
import { 
  loginUser, logoutUser, 
  getProjects, getProject, addProject, updateProject, deleteProject,
  getSkills, addSkill, updateSkill, deleteSkill,
  getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial,
  getContactInfo, updateContactInfo,
  getCaseStudies, getCaseStudy, addCaseStudy, updateCaseStudy, deleteCaseStudy,
  getAboutData, updateAboutData,
  getTimelineItems, addTimelineItem, updateTimelineItem, deleteTimelineItem,
  getSiteSettings, updateSiteSettings,
  uploadImage
} from './firebase-services.js';
import { onAuthStateChanged } from "firebase/auth";

const API_BASE = 'http://localhost:3000';

// DOM elements
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-btn');
const loader = document.getElementById('loader');
const loginError = document.getElementById('login-error');
const loginSuccess = document.getElementById('login-success');

// Helper functions
function showLoader() {
  loader.style.display = 'flex';
}

function hideLoader() {
  loader.style.display = 'none';
}

function showLoginError(message) {
  loginError.textContent = message || 'Login failed. Please check your credentials.';
  loginError.style.display = 'block';
  
  // Auto-hide error after 5 seconds
  setTimeout(() => {
    loginError.style.display = 'none';
  }, 5000);
}

function showLoginSuccess(message) {
  loginSuccess.textContent = message || 'Login successful!';
  loginSuccess.style.display = 'block';
  
  // Auto-hide message after 3 seconds
  setTimeout(() => {
    loginSuccess.style.display = 'none';
  }, 3000);
}

// --- AUTH STATE ---
onAuthStateChanged(auth, (user) => {
  hideLoader();
  
  if (user) {
    console.log("Admin is logged in:", user.email);
    loginSection.style.display = 'none';
    adminSection.style.display = 'block';
    logoutButton.style.display = 'block';
    showLoginSuccess(`Welcome, ${user.email}!`);
    
    // Load all admin panel data
    loadAllData();
  } else {
    console.log("Admin is signed out");
    loginSection.style.display = 'block';
    adminSection.style.display = 'none';
    logoutButton.style.display = 'none';
    
    // Clear form fields
    if (loginForm) {
      loginForm.reset();
    }
  }
});

// --- LOGIN ---
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // Disable login button and show loading state
  loginButton.disabled = true;
  loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
  showLoader();
  
  try {
    await loginUser(email, password);
    // Auth state change handler will update UI
  } catch (error) {
    hideLoader();
    loginButton.disabled = false;
    loginButton.textContent = 'Login';
    
    console.error("Login error:", error);
    
    // Display user-friendly error message
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      showLoginError('Invalid email or password. Please try again.');
    } else if (error.code === 'auth/too-many-requests') {
      showLoginError('Too many failed login attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      showLoginError('Network error. Please check your internet connection.');
    } else {
      showLoginError(error.message || 'Login failed. Please try again.');
    }
  }
});

// --- LOGOUT ---
logoutButton.addEventListener('click', async function() {
  if (confirm('Are you sure you want to log out?')) {
    showLoader();
    try {
      await logoutUser();
      // Auth state change will handle UI update
    } catch (error) {
      hideLoader();
      console.error("Logout failed:", error);
      alert('Logout failed: ' + (error.message || 'Unknown error'));
    }
  }
});

// --- LOAD ALL DATA ---
function loadAllData() {
  // Show loading indicator while data loads
  showLoader();
  
  // Use Promise.all to load all data in parallel
  Promise.all([
    loadProjects(),
    loadSkills(),
    loadTestimonials(),
    loadContact(),
    loadCaseStudies(),
    loadAbout(),
    loadTimeline(),
    loadSiteSettings()
  ])
  .then(() => {
    console.log('All data loaded successfully');
    hideLoader();
  })
  .catch(error => {
    console.error('Error loading data:', error);
    hideLoader();
    alert('There was a problem loading the data. Please try refreshing the page.');
  });
}

// --- PROJECTS CRUD ---
async function loadProjects() {
  try {
    const projects = await getProjects();
    const tbody = document.querySelector('#projects-table tbody');
    tbody.innerHTML = '';
    
    if (projects && projects.length > 0) {
      projects.forEach(project => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${project.title || ''}</td>
          <td>${project.description ? (project.description.length > 50 ? project.description.substring(0, 50) + '...' : project.description) : ''}</td>
          <td>${project.tags ? (Array.isArray(project.tags) ? project.tags.join(', ') : project.tags) : ''}</td>
          <td>
            <button class='btn btn-sm btn-primary edit-project-btn' data-id="${project.id}">Edit</button>
            <button class='btn btn-sm btn-danger delete-project-btn' data-id="${project.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      // Add event listeners to the edit and delete buttons
      document.querySelectorAll('.edit-project-btn').forEach(btn => {
        btn.addEventListener('click', () => editProject(btn.getAttribute('data-id')));
      });
      
      document.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProjectItem(btn.getAttribute('data-id')));
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No projects found. Add your first project!</td></tr>';
    }
  } catch (error) {
    console.error("Error loading projects:", error);
    const tbody = document.querySelector('#projects-table tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading projects. Please try again.</td></tr>';
  }
}

async function editProject(id) {
  try {
    showLoader();
    const project = await getProject(id);
    hideLoader();
    
    if (project) {
      document.getElementById('project-id').value = project.id;
      document.getElementById('project-title').value = project.title || '';
      document.getElementById('project-description').value = project.description || '';
      document.getElementById('project-tags').value = project.tags ? (Array.isArray(project.tags) ? project.tags.join(', ') : project.tags) : '';
      document.getElementById('project-result').value = project.result || '';
      
      if (project.imageUrl) {
        document.getElementById('project-image-preview').src = project.imageUrl;
        document.getElementById('project-image-preview').style.display = 'block';
      } else {
        document.getElementById('project-image-preview').style.display = 'none';
      }
      
      // Scroll to the form
      document.getElementById('project-form').scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error("Error editing project:", error);
    hideLoader();
    alert('Error loading project details. Please try again.');
  }
}

async function deleteProjectItem(id) {
  if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    try {
      showLoader();
      await deleteProject(id);
      hideLoader();
      loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      hideLoader();
      alert('Error deleting project. Please try again.');
    }
  }
}

// Clear project form
function clearProjectForm() {
  document.getElementById('project-id').value = '';
  document.getElementById('project-title').value = '';
  document.getElementById('project-description').value = '';
  document.getElementById('project-tags').value = '';
  document.getElementById('project-result').value = '';
  document.getElementById('project-image').value = '';
  document.getElementById('project-image-preview').style.display = 'none';
}

// Project form submission handler
document.getElementById('project-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('project-id').value;
  const title = document.getElementById('project-title').value;
  const description = document.getElementById('project-description').value;
  const tagsString = document.getElementById('project-tags').value;
  let tags = [];
  
  if (tagsString && tagsString.trim() !== '') {
    tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
  }
  
  const result = document.getElementById('project-result').value;
  const imageFile = document.getElementById('project-image').files[0];
  
  if (!title) {
    alert('Project title is required.');
    return;
  }
  
  showLoader();
  
  try {
    let imageUrl = null;
    
    // Upload image if a new one is selected
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile, 'projects');
      imageUrl = uploadResult.fileUrl;
    }
    
    const projectData = {
      title,
      description,
      tags,
      result,
      updatedAt: new Date().toISOString()
    };
    
    // Only add imageUrl if a new image was uploaded
    if (imageUrl) {
      projectData.imageUrl = imageUrl;
    }
    
    if (id) {
      // Update existing project
      await updateProject(id, projectData);
    } else {
      // Add new project
      projectData.createdAt = new Date().toISOString();
      await addProject(projectData);
    }
    
    // Reset form
    clearProjectForm();
    
    // Reload projects table
    await loadProjects();
    
    hideLoader();
  } catch (error) {
    console.error("Error saving project:", error);
    hideLoader();
    alert('Error saving project. Please try again.');
  }
});

// Add image preview functionality
document.getElementById('project-image').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('project-image-preview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// Add button to clear the form
const projectForm = document.getElementById('project-form');
const submitBtn = projectForm.querySelector('button[type="submit"]');
const clearBtn = document.createElement('button');
clearBtn.type = 'button';
clearBtn.className = 'btn btn-secondary ms-2';
clearBtn.textContent = 'Clear Form';
clearBtn.addEventListener('click', clearProjectForm);
submitBtn.parentNode.insertBefore(clearBtn, submitBtn.nextSibling);

// Make these functions available globally
window.editProject = editProject;
window.deleteProjectItem = deleteProjectItem;

// --- SKILLS CRUD ---
async function loadSkills() {
  try {
    const skills = await getSkills();
  const tbody = document.querySelector('#skills-table tbody');
  tbody.innerHTML = '';
    
    skills.forEach(skill => {
    const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${skill.name || ''}</td>
        <td>${skill.category || ''}</td>
        <td>${skill.percentage || 0}%</td>
        <td>
          <button class='btn btn-sm btn-primary' onclick='editSkill("${skill.id}")'>Edit</button>
          <button class='btn btn-sm btn-danger' onclick='deleteSkillItem("${skill.id}")'>Delete</button>
        </td>
      `;
    tbody.appendChild(tr);
  });
  } catch (error) {
    console.error("Error loading skills:", error);
  }
}

window.editSkill = async function(id) {
  try {
    const skill = await getSkill(id);
    if (skill) {
      document.getElementById('skill-id').value = skill.id;
      document.getElementById('skill-name').value = skill.name || '';
      document.getElementById('skill-category').value = skill.category || '';
      document.getElementById('skill-percentage').value = skill.percentage || 0;
      document.getElementById('skill-icon').value = skill.icon || 'fa-chess-queen';
    }
  } catch (error) {
    console.error("Error editing skill:", error);
  }
};

window.deleteSkillItem = async function(id) {
  if (confirm('Are you sure you want to delete this skill?')) {
    try {
      await deleteSkill(id);
  loadSkills();
    } catch (error) {
      console.error("Error deleting skill:", error);
    }
  }
};

document.getElementById('skill-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('skill-id').value;
  const name = document.getElementById('skill-name').value;
  const category = document.getElementById('skill-category').value;
  const percentage = parseInt(document.getElementById('skill-percentage').value) || 0;
  const icon = document.getElementById('skill-icon').value;
  
  try {
    const skillData = {
      name,
      category,
      percentage,
      icon
    };
    
  if (id) {
      await updateSkill(id, skillData);
  } else {
      await addSkill(skillData);
  }
    
    // Reset form
  this.reset();
    document.getElementById('skill-id').value = '';
    
  loadSkills();
  } catch (error) {
    console.error("Error saving skill:", error);
  }
});

// --- TESTIMONIALS CRUD ---
async function loadTestimonials() {
  try {
    const testimonials = await getTestimonials();
  const tbody = document.querySelector('#testimonials-table tbody');
  tbody.innerHTML = '';
    
    testimonials.forEach(testimonial => {
    const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${testimonial.author || ''}</td>
        <td>${testimonial.title || ''}</td>
        <td>${testimonial.content || ''}</td>
        <td>${testimonial.rating || 5}</td>
        <td>
          <button class='btn btn-sm btn-primary' onclick='editTestimonial("${testimonial.id}")'>Edit</button>
          <button class='btn btn-sm btn-danger' onclick='deleteTestimonialItem("${testimonial.id}")'>Delete</button>
        </td>
      `;
    tbody.appendChild(tr);
  });
  } catch (error) {
    console.error("Error loading testimonials:", error);
  }
}

window.editTestimonial = async function(id) {
  try {
    const testimonial = await getTestimonial(id);
    if (testimonial) {
      document.getElementById('testimonial-id').value = testimonial.id;
      document.getElementById('testimonial-author').value = testimonial.author || '';
      document.getElementById('testimonial-title').value = testimonial.title || '';
      document.getElementById('testimonial-content').value = testimonial.content || '';
      document.getElementById('testimonial-rating').value = testimonial.rating || 5;
      
      if (testimonial.photoUrl) {
        document.getElementById('testimonial-photo-preview').src = testimonial.photoUrl;
        document.getElementById('testimonial-photo-preview').style.display = 'block';
      } else {
        document.getElementById('testimonial-photo-preview').style.display = 'none';
      }
    }
  } catch (error) {
    console.error("Error editing testimonial:", error);
  }
};

window.deleteTestimonialItem = async function(id) {
  if (confirm('Are you sure you want to delete this testimonial?')) {
    try {
      await deleteTestimonial(id);
  loadTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    }
  }
};

document.getElementById('testimonial-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('testimonial-id').value;
  const author = document.getElementById('testimonial-author').value;
  const title = document.getElementById('testimonial-title').value;
  const content = document.getElementById('testimonial-content').value;
  const rating = parseInt(document.getElementById('testimonial-rating').value) || 5;
  const photoFile = document.getElementById('testimonial-photo').files[0];
  
  try {
    let photoUrl = null;
    
    // Upload photo if a new one is selected
    if (photoFile) {
      const uploadResult = await uploadImage(photoFile, 'testimonials');
      photoUrl = uploadResult.fileUrl;
    }
    
    const testimonialData = {
      author,
      title,
      content,
      rating
    };
    
    // Only add photoUrl if a new photo was uploaded
    if (photoUrl) {
      testimonialData.photoUrl = photoUrl;
    }
    
  if (id) {
      // Get existing testimonial to preserve photoUrl if no new photo
      if (!photoUrl) {
        const existingTestimonial = await getTestimonial(id);
        if (existingTestimonial && existingTestimonial.photoUrl) {
          testimonialData.photoUrl = existingTestimonial.photoUrl;
        }
      }
      await updateTestimonial(id, testimonialData);
  } else {
      await addTestimonial(testimonialData);
  }
    
    // Reset form
  this.reset();
    document.getElementById('testimonial-id').value = '';
    document.getElementById('testimonial-photo-preview').style.display = 'none';
    
  loadTestimonials();
  } catch (error) {
    console.error("Error saving testimonial:", error);
  }
});

// --- CONTACT CRUD ---
async function loadContact() {
  try {
    const contact = await getContactInfo();
    if (contact) {
      document.getElementById('contact-email').value = contact.email || '';
      document.getElementById('contact-phone').value = contact.phone || '';
      document.getElementById('contact-address').value = contact.address || '';
      
      if (contact.socialLinks) {
        document.getElementById('contact-linkedin').value = contact.socialLinks.linkedin || '';
        document.getElementById('contact-twitter').value = contact.socialLinks.twitter || '';
        document.getElementById('contact-github').value = contact.socialLinks.github || '';
      }
    }
  } catch (error) {
    console.error("Error loading contact info:", error);
  }
}

document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('contact-email').value;
  const phone = document.getElementById('contact-phone').value;
  const address = document.getElementById('contact-address').value;
  const linkedin = document.getElementById('contact-linkedin').value;
  const twitter = document.getElementById('contact-twitter').value;
  const github = document.getElementById('contact-github').value;
  
  try {
    const contactData = {
      email,
      phone,
      address,
      socialLinks: {
        linkedin,
        twitter,
        github
      }
    };
    
    await updateContactInfo(contactData);
    alert('Contact information updated!');
  } catch (error) {
    console.error("Error saving contact info:", error);
  }
});

// --- CASE STUDIES CRUD ---
async function loadCaseStudies() {
  try {
    const caseStudies = await getCaseStudies();
  const tbody = document.querySelector('#case-studies-table tbody');
  tbody.innerHTML = '';
    
    caseStudies.forEach(caseStudy => {
    const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${caseStudy.title || ''}</td>
        <td>${caseStudy.subtitle || ''}</td>
        <td>${caseStudy.summary ? caseStudy.summary.substring(0, 50) + '...' : ''}</td>
        <td>
          <button class='btn btn-sm btn-primary' onclick='editCaseStudy("${caseStudy.id}")'>Edit</button>
          <button class='btn btn-sm btn-danger' onclick='deleteCaseStudyItem("${caseStudy.id}")'>Delete</button>
          <a href="case_study_1.html?id=${caseStudy.id}" class='btn btn-sm btn-secondary' target="_blank">View</a>
        </td>
      `;
    tbody.appendChild(tr);
  });
  } catch (error) {
    console.error("Error loading case studies:", error);
  }
}

window.editCaseStudy = async function(id) {
  try {
    const caseStudy = await getCaseStudy(id);
    if (caseStudy) {
      document.getElementById('case-study-id').value = caseStudy.id;
      document.getElementById('case-study-title').value = caseStudy.title || '';
      document.getElementById('case-study-subtitle').value = caseStudy.subtitle || '';
      document.getElementById('case-study-summary').value = caseStudy.summary || '';
      
      // Handle sections with rich text editor
      const sectionsContainer = document.getElementById('case-study-sections');
      sectionsContainer.innerHTML = '';
      
      if (caseStudy.sections && caseStudy.sections.length > 0) {
        caseStudy.sections.forEach((section, index) => {
          addSectionToEditor(section, index);
        });
      } else {
        // Add default empty section
        addSectionToEditor(null, 0);
      }
      
      if (caseStudy.imageUrl) {
        document.getElementById('case-study-image-preview').src = caseStudy.imageUrl;
        document.getElementById('case-study-image-preview').style.display = 'block';
      } else {
        document.getElementById('case-study-image-preview').style.display = 'none';
      }
    }
  } catch (error) {
    console.error("Error editing case study:", error);
  }
};

function addSectionToEditor(section, index) {
  const sectionsContainer = document.getElementById('case-study-sections');
  
  const sectionDiv = document.createElement('div');
  sectionDiv.classList.add('section-editor', 'mb-3', 'border', 'p-3', 'rounded');
  
  sectionDiv.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h5>Section ${index + 1}</h5>
      <button type="button" class="btn btn-danger btn-sm remove-section">Remove</button>
    </div>
    <div class="mb-2">
      <label>Section ID:</label>
      <input type="text" class="form-control section-id" value="${section ? section.id : ''}" placeholder="overview, problem, process, etc.">
    </div>
    <div class="mb-2">
      <label>Section Title:</label>
      <input type="text" class="form-control section-title" value="${section ? section.title : ''}" placeholder="Section Title">
    </div>
    <div>
      <label>Section Content:</label>
      <div class="rich-text-editor" style="height: 200px;">${section ? section.content : ''}</div>
    </div>
  `;
  
  sectionsContainer.appendChild(sectionDiv);
  
  // Initialize rich text editor
  const richTextElement = sectionDiv.querySelector('.rich-text-editor');
  new Quill(richTextElement, {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['link', 'image'],
        ['clean']
      ]
    }
  });
  
  // Add remove section event listener
  sectionDiv.querySelector('.remove-section').addEventListener('click', function() {
    sectionDiv.remove();
  });
}

document.getElementById('add-section-btn').addEventListener('click', function() {
  const sectionsCount = document.querySelectorAll('.section-editor').length;
  addSectionToEditor(null, sectionsCount);
});

window.deleteCaseStudyItem = async function(id) {
  if (confirm('Are you sure you want to delete this case study?')) {
    try {
      await deleteCaseStudy(id);
  loadCaseStudies();
    } catch (error) {
      console.error("Error deleting case study:", error);
    }
  }
};

document.getElementById('case-study-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('case-study-id').value;
  const title = document.getElementById('case-study-title').value;
  const subtitle = document.getElementById('case-study-subtitle').value;
  const summary = document.getElementById('case-study-summary').value;
  const imageFile = document.getElementById('case-study-image').files[0];
  
  // Collect sections data
  const sectionEditors = document.querySelectorAll('.section-editor');
  const sections = Array.from(sectionEditors).map(editor => {
    const sectionId = editor.querySelector('.section-id').value;
    const sectionTitle = editor.querySelector('.section-title').value;
    const quillEditor = Quill.find(editor.querySelector('.rich-text-editor'));
    
    return {
      id: sectionId,
      title: sectionTitle,
      content: quillEditor.root.innerHTML
    };
  });
  
  try {
    let imageUrl = null;
    
    // Upload image if a new one is selected
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile, 'caseStudies');
      imageUrl = uploadResult.fileUrl;
    }
    
    const caseStudyData = {
      title,
      subtitle,
      summary,
      sections
    };
    
    // Only add imageUrl if a new image was uploaded
    if (imageUrl) {
      caseStudyData.imageUrl = imageUrl;
    }
    
  if (id) {
      // Get existing case study to preserve imageUrl if no new image
      if (!imageUrl) {
        const existingCaseStudy = await getCaseStudy(id);
        if (existingCaseStudy && existingCaseStudy.imageUrl) {
          caseStudyData.imageUrl = existingCaseStudy.imageUrl;
        }
      }
      await updateCaseStudy(id, caseStudyData);
  } else {
      await addCaseStudy(caseStudyData);
  }
    
    // Reset form
  this.reset();
    document.getElementById('case-study-id').value = '';
    document.getElementById('case-study-image-preview').style.display = 'none';
    document.getElementById('case-study-sections').innerHTML = '';
    addSectionToEditor(null, 0); // Add a default empty section
    
  loadCaseStudies();
  } catch (error) {
    console.error("Error saving case study:", error);
  }
});

// --- ABOUT SECTION CRUD ---
async function loadAbout() {
  try {
    const about = await getAboutData();
    if (about) {
      document.getElementById('about-title').value = about.title || '';
      document.getElementById('about-paragraph1').value = about.paragraph1 || '';
      document.getElementById('about-paragraph2').value = about.paragraph2 || '';
      
      // Handle features
      const featuresContainer = document.getElementById('about-features');
      featuresContainer.innerHTML = '';
      
      if (about.features && about.features.length > 0) {
        about.features.forEach((feature, index) => {
          addFeatureToEditor(feature, index);
        });
      } else {
        // Add 4 default empty features
        for (let i = 0; i < 4; i++) {
          addFeatureToEditor(null, i);
        }
      }
      
      if (about.imageUrl) {
        document.getElementById('about-image-preview').src = about.imageUrl;
        document.getElementById('about-image-preview').style.display = 'block';
      } else {
        document.getElementById('about-image-preview').style.display = 'none';
      }
    }
  } catch (error) {
    console.error("Error loading about data:", error);
  }
}

function addFeatureToEditor(feature, index) {
  const featuresContainer = document.getElementById('about-features');
  
  const featureDiv = document.createElement('div');
  featureDiv.classList.add('feature-editor', 'mb-3', 'border', 'p-3', 'rounded');
  
  featureDiv.innerHTML = `
    <h5>Feature ${index + 1}</h5>
    <div class="mb-2">
      <label>Title:</label>
      <input type="text" class="form-control feature-title" value="${feature ? feature.title : ''}" placeholder="Feature Title">
    </div>
    <div>
      <label>Description:</label>
      <input type="text" class="form-control feature-description" value="${feature ? feature.description : ''}" placeholder="Feature Description">
    </div>
  `;
  
  featuresContainer.appendChild(featureDiv);
}

document.getElementById('about-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const title = document.getElementById('about-title').value;
  const paragraph1 = document.getElementById('about-paragraph1').value;
  const paragraph2 = document.getElementById('about-paragraph2').value;
  const imageFile = document.getElementById('about-image').files[0];
  
  // Collect features data
  const featureEditors = document.querySelectorAll('.feature-editor');
  const features = Array.from(featureEditors).map(editor => {
    return {
      title: editor.querySelector('.feature-title').value,
      description: editor.querySelector('.feature-description').value
    };
  });
  
  try {
    let imageUrl = null;
    
    // Upload image if a new one is selected
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile, 'about');
      imageUrl = uploadResult.fileUrl;
    }
    
    const aboutData = {
      title,
      paragraph1,
      paragraph2,
      features
    };
    
    // Only add imageUrl if a new image was uploaded
    if (imageUrl) {
      aboutData.imageUrl = imageUrl;
    } else {
      // Preserve existing imageUrl
      const existingAbout = await getAboutData();
      if (existingAbout && existingAbout.imageUrl) {
        aboutData.imageUrl = existingAbout.imageUrl;
      }
    }
    
    await updateAboutData(aboutData);
    alert('About section updated!');
  } catch (error) {
    console.error("Error saving about data:", error);
  }
});

// --- TIMELINE CRUD ---
async function loadTimeline() {
  try {
    const timelineItems = await getTimelineItems();
    const tbody = document.querySelector('#timeline-table tbody');
    tbody.innerHTML = '';
    
    timelineItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.title || ''}</td>
        <td>${item.company || ''}</td>
        <td>${item.period || ''}</td>
        <td>${item.description ? item.description.substring(0, 50) + '...' : ''}</td>
        <td>
          <button class='btn btn-sm btn-primary' onclick='editTimelineItem("${item.id}")'>Edit</button>
          <button class='btn btn-sm btn-danger' onclick='deleteTimelineItem("${item.id}")'>Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading timeline items:", error);
  }
}

window.editTimelineItem = async function(id) {
  try {
    const item = await getTimelineItem(id);
    if (item) {
      document.getElementById('timeline-id').value = item.id;
      document.getElementById('timeline-title').value = item.title || '';
      document.getElementById('timeline-company').value = item.company || '';
      document.getElementById('timeline-period').value = item.period || '';
      document.getElementById('timeline-description').value = item.description || '';
      document.getElementById('timeline-year').value = item.year || '';
      
      if (item.imageUrl) {
        document.getElementById('timeline-image-preview').src = item.imageUrl;
        document.getElementById('timeline-image-preview').style.display = 'block';
      } else {
        document.getElementById('timeline-image-preview').style.display = 'none';
      }
    }
  } catch (error) {
    console.error("Error editing timeline item:", error);
  }
};

window.deleteTimelineItem = async function(id) {
  if (confirm('Are you sure you want to delete this timeline item?')) {
    try {
      await deleteTimelineItem(id);
      loadTimeline();
    } catch (error) {
      console.error("Error deleting timeline item:", error);
    }
  }
};

document.getElementById('timeline-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('timeline-id').value;
  const title = document.getElementById('timeline-title').value;
  const company = document.getElementById('timeline-company').value;
  const period = document.getElementById('timeline-period').value;
  const description = document.getElementById('timeline-description').value;
  const year = parseInt(document.getElementById('timeline-year').value) || 0;
  const imageFile = document.getElementById('timeline-image').files[0];
  
  try {
    let imageUrl = null;
    
    // Upload image if a new one is selected
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile, 'timeline');
      imageUrl = uploadResult.fileUrl;
    }
    
    const timelineData = {
      title,
      company,
      period,
      description,
      year
    };
    
    // Only add imageUrl if a new image was uploaded
    if (imageUrl) {
      timelineData.imageUrl = imageUrl;
    }
    
    if (id) {
      // Get existing timeline item to preserve imageUrl if no new image
      if (!imageUrl) {
        const existingItem = await getTimelineItem(id);
        if (existingItem && existingItem.imageUrl) {
          timelineData.imageUrl = existingItem.imageUrl;
        }
      }
      await updateTimelineItem(id, timelineData);
    } else {
      await addTimelineItem(timelineData);
    }
    
    // Reset form
    this.reset();
    document.getElementById('timeline-id').value = '';
    document.getElementById('timeline-image-preview').style.display = 'none';
    
    loadTimeline();
  } catch (error) {
    console.error("Error saving timeline item:", error);
  }
});

// --- SITE SETTINGS ---
async function loadSiteSettings() {
  try {
    const settings = await getSiteSettings();
    if (settings) {
      document.getElementById('settings-site-title').value = settings.siteTitle || '';
      document.getElementById('settings-logo-text').value = settings.logoText || '';
      
      if (settings.heroSettings) {
        document.getElementById('settings-hero-title').value = settings.heroSettings.title || '';
        document.getElementById('settings-hero-subtitle').value = settings.heroSettings.subtitle || '';
        document.getElementById('settings-hero-button').value = settings.heroSettings.buttonText || '';
      }
    }
  } catch (error) {
    console.error("Error loading site settings:", error);
  }
}

document.getElementById('settings-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const siteTitle = document.getElementById('settings-site-title').value;
  const logoText = document.getElementById('settings-logo-text').value;
  const heroTitle = document.getElementById('settings-hero-title').value;
  const heroSubtitle = document.getElementById('settings-hero-subtitle').value;
  const heroButton = document.getElementById('settings-hero-button').value;
  
  try {
    const settingsData = {
      siteTitle,
      logoText,
      heroSettings: {
        title: heroTitle,
        subtitle: heroSubtitle,
        buttonText: heroButton
      }
    };
    
    await updateSiteSettings(settingsData);
    alert('Site settings updated!');
  } catch (error) {
    console.error("Error saving site settings:", error);
  }
});

