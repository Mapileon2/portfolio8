// DOM elements
const loginSection = document.getElementById('login-section'); // login always shown
const adminSection = document.getElementById('admin-section');
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-btn');
const loader = document.getElementById('loader');
const loginError = document.getElementById('login-error');
const loginSuccess = document.getElementById('login-success');

// New REST API and JWT setup
const API_BASE = '/api';
function getAuthToken() {
  // Check all possible token locations
  const sessionToken = sessionStorage.getItem('jwtToken');
  const localJwtToken = localStorage.getItem('jwt_token');
  const firebaseToken = localStorage.getItem('firebase_token');
  
  // Use the first available token
  let token = sessionToken || localJwtToken || firebaseToken;
  
  // If we found a token in localStorage but not in sessionStorage, sync it
  if (!sessionToken && token) {
    sessionStorage.setItem('jwtToken', token);
  }
  
  return token;
}

// Set up UI based on JWT token when DOM is ready
function initializeUI() {
  // Bypass login: always display admin panel
  if (loginSection) loginSection.style.display = 'none';
  if (adminSection) adminSection.style.display = 'block';
  
  // Load data immediately
  if (typeof loadAllData === 'function') loadAllData();
}

// Initialize UI after DOM loads
document.addEventListener('DOMContentLoaded', initializeUI);

// Logout functionality
if (logoutButton) {
  logoutButton.addEventListener('click', function() {
    sessionStorage.removeItem('jwtToken');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('firebase_token');
    window.location.reload();
  });
}

// Helper functions
function showLoader() {
  if (loader) loader.style.display = 'flex';
}

function hideLoader() {
  if (loader) loader.style.display = 'none';
}

function showLoginError(message) {
  if (loginError) {
    loginError.textContent = message || 'Login failed. Please check your credentials.';
    loginError.style.display = 'block';
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      loginError.style.display = 'none';
    }, 5000);
  }
}

function showLoginSuccess(message) {
  if (loginSuccess) {
    loginSuccess.textContent = message || 'Login successful!';
    loginSuccess.style.display = 'block';
    
    // Auto-hide message after 3 seconds
    setTimeout(() => {
      loginSuccess.style.display = 'none';
    }, 3000);
  }
}

// Load all data function with improved error handling
function loadAllData() {
  console.log("Loading all data...");
  
  // Show loading indicator while data loads
  showLoader();
  
  // Set a timeout to prevent infinite loading
  const loadingTimeout = setTimeout(() => {
    console.warn("Data loading timeout reached, stopping loader");
    hideLoader();
    alert('Data loading took too long. Some features may not be available.');
  }, 30000); // 30-second timeout
  
  // Use Promise.all with individual timeouts
  Promise.all([
    promiseWithTimeout(loadProjects(), 5000, "Projects"),
    promiseWithTimeout(loadSkills(), 5000, "Skills"),
    promiseWithTimeout(loadTestimonials(), 5000, "Testimonials"),
    promiseWithTimeout(loadContact(), 5000, "Contact"),
    promiseWithTimeout(loadCaseStudies(), 5000, "Case Studies"),
    promiseWithTimeout(loadAbout(), 5000, "About"),
    promiseWithTimeout(loadTimeline(), 5000, "Timeline"),
    promiseWithTimeout(loadSiteSettings(), 5000, "Site Settings"),
    promiseWithTimeout(loadSectionsEditor(), 5000, "Sections")
  ])
  .then(() => {
    console.log('All data loaded successfully');
    clearTimeout(loadingTimeout);
    hideLoader();
  })
  .catch(error => {
    console.error('Error loading data:', error);
    clearTimeout(loadingTimeout);
    hideLoader();
    alert('There was a problem loading some data. You may need to refresh the page or check your connection.');
  });
}

// Helper function to add timeouts to promises
function promiseWithTimeout(promise, timeoutMs, name) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn(`${name} data loading timed out after ${timeoutMs}ms`);
      // Don't fail the whole process, just resolve with empty data
      resolve(); 
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        console.error(`Error loading ${name}:`, error);
        clearTimeout(timer);
        // Don't fail the whole process for this section
        resolve();
      });
  });
}

// --- PROJECTS CRUD ---
async function loadProjects() {
  try {
    if (window.updateLoadingProgress) window.updateLoadingProgress(10, 'Loading projects...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/projects`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const projects = await res.json();
    if (!Array.isArray(projects)) throw new Error('Invalid data format');

    const tbody = document.querySelector('#projects-table tbody');
    if (!tbody) return projects;
    tbody.innerHTML = '';

    if (projects.length) {
      projects.forEach(project => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${project.title || ''}</td>
          <td>${project.description ? (project.description.length > 50 ? project.description.substring(0, 50) + '...' : project.description) : ''}</td>
          <td>${project.tags ? project.tags.join(', ') : ''}</td>
          <td>
            <button class='btn btn-sm btn-primary edit-project-btn' data-id="${project.id}">Edit</button>
            <button class='btn btn-sm btn-danger delete-project-btn' data-id="${project.id}">Delete</button>
          </td>`;
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.edit-project-btn').forEach(btn => {
        btn.addEventListener('click', () => editProject(btn.getAttribute('data-id')));
      });
      document.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProjectItem(btn.getAttribute('data-id')));
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No projects found. Add your first project!</td></tr>';
    }

    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Projects loaded successfully');
    return projects;
  } catch (error) {
    console.error('Error loading projects:', error);
    const tbody = document.querySelector('#projects-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading projects. Please try again.</td></tr>';
    return [];
  }
}

async function getProject(id) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch project failed');
  return data;
}

async function editProject(id) {
  showLoader();
  try {
    const project = await getProject(id);
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-title').value = project.title || '';
    document.getElementById('project-description').value = project.description || '';
    document.getElementById('project-tags').value = project.tags ? project.tags.join(', ') : '';
    document.getElementById('project-result').value = project.result || '';
    if (project.imageUrl) {
      document.getElementById('project-image-preview').src = project.imageUrl;
      document.getElementById('project-image-preview').style.display = 'block';
    } else {
      document.getElementById('project-image-preview').style.display = 'none';
    }
    document.getElementById('project-form').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Error editing project:', err);
    alert('Error loading project details. Please try again.');
  } finally {
    hideLoader();
  }
}

async function addProject(projectData) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
    body: JSON.stringify(projectData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Add project failed');
  return data.id;
}

async function updateProject(id, projectData) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
    body: JSON.stringify(projectData)
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Update project failed');
  }
  return true;
}

async function deleteProjectItem(id) {
  if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
  showLoader();
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete project failed');
    await loadProjects();
  } catch (err) {
    console.error('Error deleting project:', err);
    alert('Error deleting project. Please try again.');
  } finally {
    hideLoader();
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

// Image upload helper function
async function uploadImage(file, folder = 'images') {
  // Build form data for backend upload
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);
  formData.append('imageType', folder);

  // Attach JWT token if present
  const token = sessionStorage.getItem('jwtToken') || '';

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('Server upload failed:', data.error);
    throw new Error(data.error || 'Upload failed');
  }

  return { fileUrl: data.url, filePath: data.publicId };
}

// Project form submission handler
document.getElementById('project-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('project-id')?.value;
  const title = document.getElementById('project-title')?.value;
  const description = document.getElementById('project-description')?.value;
  const tags = document.getElementById('project-tags')?.value;
  const result = document.getElementById('project-result')?.value;
  const imageInput = document.getElementById('project-image');
  
  if (!title || !description) {
    alert('Please fill in all required fields.');
    return;
  }
  
  showLoader();
  try {
    // Handle image upload if there's a new image
    let imageUrl = null;
    if (imageInput?.files && imageInput.files.length > 0) {
      const uploadResult = await uploadImage(imageInput.files[0], 'projects');
      imageUrl = uploadResult.fileUrl;
    }
    
    // Create project data object
    const projectData = {
      title,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      result,
      ...(imageUrl && { imageUrl })
    };
    
    // Determine whether to create or update
    if (id) {
      await updateProject(id, projectData);
    } else {
      await addProject(projectData);
    }
    
    clearProjectForm();
    await loadProjects();
  } catch (err) {
    console.error('Error saving project:', err);
    alert('Error saving project. Please try again.');
  } finally {
    hideLoader();
  }
});

// Add image preview functionality
document.getElementById('project-image')?.addEventListener('change', function(e) {
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

// --- SKILLS CRUD (REST API) ---
async function loadSkills() {
  try {
    if (window.updateLoadingProgress) window.updateLoadingProgress(10, 'Loading skills...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/skills`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const skills = await res.json();
    if (!Array.isArray(skills)) throw new Error('Invalid data format');

    const tbody = document.querySelector('#skills-table tbody');
    if (tbody) {
      tbody.innerHTML = '';
      if (skills.length) {
        skills.forEach(skill => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${skill.name || ''}</td>
            <td>${skill.category || ''}</td>
            <td>${skill.percentage || 0}%</td>
            <td>
              <button class='btn btn-sm btn-primary edit-skill-btn' data-id='${skill.id}'>Edit</button>
              <button class='btn btn-sm btn-danger delete-skill-btn' data-id='${skill.id}'>Delete</button>
            </td>`;
          tbody.appendChild(tr);
        });
        document.querySelectorAll('.edit-skill-btn').forEach(btn => btn.addEventListener('click', () => editSkill(btn.dataset.id)));
        document.querySelectorAll('.delete-skill-btn').forEach(btn => btn.addEventListener('click', () => deleteSkill(btn.dataset.id)));
      } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No skills found. Add your first skill!</td></tr>';
      }
    }
    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Skills loaded successfully');
    return skills;
  } catch (err) {
    console.error('Error loading skills:', err);
    const tbody = document.querySelector('#skills-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading skills. Please try again.</td></tr>';
    return [];
  }
}

async function getSkill(id) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/skills/${id}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch skill failed');
  return data;
}

async function editSkill(id) {
  showLoader();
  try {
    const skill = await getSkill(id);
    document.getElementById('skill-id').value = skill.id;
    document.getElementById('skill-name').value = skill.name || '';
    document.getElementById('skill-category').value = skill.category || '';
    document.getElementById('skill-percentage').value = skill.percentage || '';
    document.getElementById('skill-icon').value = skill.icon || '';
    document.getElementById('skill-form').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Error editing skill:', err);
    alert('Error loading skill details. Please try again.');
  } finally {
    hideLoader();
  }
}

async function deleteSkill(id) {
  if (!confirm('Are you sure you want to delete this skill? This action cannot be undone.')) return;
  showLoader();
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/skills/${id}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete skill failed');
    await loadSkills();
  } catch (err) {
    console.error('Error deleting skill:', err);
    alert('Error deleting skill. Please try again.');
  } finally {
    hideLoader();
  }
}

// Skill form submission handler
document.getElementById('skill-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('skill-id')?.value;
  const name = document.getElementById('skill-name')?.value;
  const category = document.getElementById('skill-category')?.value;
  const percentage = document.getElementById('skill-percentage')?.value;
  const icon = document.getElementById('skill-icon')?.value;
  
  if (!name || !category || !percentage) {
    alert('Please fill in all required fields.');
    return;
  }
  
  showLoader();
  try {
    const token = getAuthToken();
    const skillData = {
      name,
      category,
      percentage: parseInt(percentage) || 0,
      icon
    };
    
    const url = id ? `${API_BASE}/skills/${id}` : `${API_BASE}/skills`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: JSON.stringify(skillData)
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Save skill failed');
    
    clearSkillForm();
    await loadSkills();
  } catch (err) {
    console.error('Error saving skill:', err);
    alert('Error saving skill. Please try again.');
  } finally {
    hideLoader();
  }
});

function clearSkillForm() {
  document.getElementById('skill-id').value = '';
  document.getElementById('skill-name').value = '';
  document.getElementById('skill-category').value = '';
  document.getElementById('skill-percentage').value = '';
  document.getElementById('skill-icon').value = '';
}

// --- TESTIMONIALS CRUD (REST API) ---
async function loadTestimonials() {
  try {
    if (window.updateLoadingProgress) window.updateLoadingProgress(10, 'Loading testimonials...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/testimonials`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const testimonials = await res.json();
    if (!Array.isArray(testimonials)) throw new Error('Invalid data format');

    const tbody = document.querySelector('#testimonials-table tbody');
    if (tbody) {
      tbody.innerHTML = '';
      if (testimonials.length) {
        testimonials.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${item.author || ''}</td>
            <td>${item.title || ''}</td>
            <td>${item.content ? (item.content.length > 50 ? item.content.substring(0,50)+'...' : item.content) : ''}</td>
            <td>${'★'.repeat(item.rating || 0)}</td>
            <td>
              <button class="btn btn-sm btn-primary edit-testimonial-btn" data-id="${item.id}">Edit</button>
              <button class="btn btn-sm btn-danger delete-testimonial-btn" data-id="${item.id}">Delete</button>
            </td>`;
          tbody.appendChild(tr);
        });
        document.querySelectorAll('.edit-testimonial-btn').forEach(btn => btn.addEventListener('click', () => editTestimonial(btn.dataset.id)));
        document.querySelectorAll('.delete-testimonial-btn').forEach(btn => btn.addEventListener('click', () => deleteTestimonial(btn.dataset.id)));
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No testimonials found. Add your first testimonial!</td></tr>';
      }
    }
    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Testimonials loaded successfully');
    return testimonials;
  } catch (err) {
    console.error('Error loading testimonials:', err);
    const tbody = document.querySelector('#testimonials-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading testimonials. Please try again.</td></tr>';
    return [];
  }
}

async function getTestimonial(id) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/testimonials/${id}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch testimonial failed');
  return data;
}

async function editTestimonial(id) {
  showLoader();
  try {
    const test = await getTestimonial(id);
    document.getElementById('testimonial-id').value = test.id;
    document.getElementById('testimonial-author').value = test.author || '';
    document.getElementById('testimonial-title').value = test.title || '';
    document.getElementById('testimonial-content').value = test.content || '';
    document.getElementById('testimonial-rating').value = test.rating || 5;
    if (test.photoUrl) {
      const preview = document.getElementById('testimonial-photo-preview');
      preview.src = test.photoUrl;
      preview.style.display = 'block';
    }
    document.getElementById('testimonial-form').scrollIntoView({behavior:'smooth'});
  } catch (err) {
    console.error('Error editing testimonial:', err);
    alert('Error loading testimonial details. Please try again.');
  } finally {
    hideLoader();
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Are you sure you want to delete this testimonial?')) return;
  showLoader();
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/testimonials/${id}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete testimonial failed');
    await loadTestimonials();
  } catch (err) {
    console.error('Error deleting testimonial:', err);
    alert('Error deleting testimonial. Please try again.');
  } finally {
    hideLoader();
  }
}

// Testimonial form submission handler
document.getElementById('testimonial-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('testimonial-id')?.value;
  const author = document.getElementById('testimonial-author')?.value;
  const title = document.getElementById('testimonial-title')?.value;
  const content = document.getElementById('testimonial-content')?.value;
  const rating = document.getElementById('testimonial-rating')?.value;
  const photoInput = document.getElementById('testimonial-photo');
  
  if (!author || !content) {
    alert('Please fill in all required fields.');
    return;
  }
  
  showLoader();
  try {
    // Handle photo upload if there's a new photo
    let photoUrl = null;
    if (photoInput?.files && photoInput.files.length > 0) {
      const uploadResult = await uploadImage(photoInput.files[0], 'testimonials');
      photoUrl = uploadResult.fileUrl;
    }
    
    // Create testimonial data object
    const testimonialData = {
      author,
      title,
      content,
      rating: parseInt(rating) || 5,
      ...(photoUrl && { photoUrl })
    };
    
    // Determine whether to create or update
    const token = getAuthToken();
    const url = id ? `${API_BASE}/testimonials/${id}` : `${API_BASE}/testimonials`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: JSON.stringify(testimonialData)
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Save testimonial failed');
    
    clearTestimonialForm();
    await loadTestimonials();
  } catch (err) {
    console.error('Error saving testimonial:', err);
    alert('Error saving testimonial. Please try again.');
  } finally {
    hideLoader();
  }
});

function clearTestimonialForm() {
  document.getElementById('testimonial-id').value = '';
  document.getElementById('testimonial-author').value = '';
  document.getElementById('testimonial-title').value = '';
  document.getElementById('testimonial-content').value = '';
  document.getElementById('testimonial-rating').value = '5';
  document.getElementById('testimonial-photo').value = '';
  document.getElementById('testimonial-photo-preview').style.display = 'none';
}

// --- CONTACT INFO CRUD (REST API) ---
async function loadContact() {
  // Skip if contact form not in DOM
  if (!document.getElementById('contact-form')) {
    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Contact info skipped');
    return {};
  }
  try {
    if (window.updateLoadingProgress) window.updateLoadingProgress(10, 'Loading contact info...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/contact`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const contact = await res.json();
    if (!contact) throw new Error('Invalid data format');

    // Fill the contact form with the data
    const emailEl = document.getElementById('contact-email');
    if (emailEl) emailEl.value = contact.email || '';
    const phoneEl = document.getElementById('contact-phone');
    if (phoneEl) phoneEl.value = contact.phone || '';
    const addressEl = document.getElementById('contact-address');
    if (addressEl) addressEl.value = contact.address || '';
    const linkedinEl = document.getElementById('contact-linkedin');
    if (linkedinEl) linkedinEl.value = contact.socialLinks?.linkedin || '';
    const githubEl = document.getElementById('contact-github');
    if (githubEl) githubEl.value = contact.socialLinks?.github || '';
    const twitterEl = document.getElementById('contact-twitter');
    if (twitterEl) twitterEl.value = contact.socialLinks?.twitter || '';
    // The HTML form doesn't include Instagram or Facebook fields, so skip them

    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Contact info loaded successfully');
    return contact;
  } catch (err) {
    console.error('Error loading contact info:', err);
    // Show an error row or skip if form not present
    return {};
  }
}

// Contact form submission handler
document.getElementById('contact-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('contact-email')?.value;
  const phone = document.getElementById('contact-phone')?.value;
  const address = document.getElementById('contact-address')?.value;
  const linkedin = document.getElementById('contact-linkedin')?.value;
  const twitter = document.getElementById('contact-twitter')?.value;
  const github = document.getElementById('contact-github')?.value;
  
  if (!email) {
    alert('Please enter at least an email address.');
    return;
  }
  
  showLoader();
  try {
    const token = getAuthToken();
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
    
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: JSON.stringify(contactData)
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Save contact info failed');
    
    alert('Contact information saved successfully!');
  } catch (err) {
    console.error('Error saving contact info:', err);
    alert('Error saving contact information. Please try again.');
  } finally {
    hideLoader();
  }
});

// --- ABOUT PAGE CRUD (REST API) ---
async function loadAbout() {
  // Skip if about form not in DOM
  if (!document.getElementById('about-form')) {
    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'About info skipped');
    return {};
  }
  try {
    if (window.updateLoadingProgress) window.updateLoadingProgress(10, 'Loading about info...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/about`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const about = await res.json();
    if (!about) throw new Error('Invalid data format');

    // Fill the about form with the data
    const titleEl = document.getElementById('about-title');
    if (titleEl) titleEl.value = about.headline || '';
    
    // Split bio into paragraphs if stored as combined string
    const paragraphs = (about.bio || '').split('\n\n');
    
    const paragraph1El = document.getElementById('about-paragraph1');
    if (paragraph1El) paragraph1El.value = paragraphs[0] || '';
    
    const paragraph2El = document.getElementById('about-paragraph2');
    if (paragraph2El) paragraph2El.value = paragraphs[1] || '';

    // Preview image
    const preview = document.getElementById('about-image-preview');
    if (preview) {
      if (about.photoUrl) {
        preview.src = about.photoUrl;
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    }

    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'About info loaded successfully');
    return about;
  } catch (err) {
    console.error('Error loading about info:', err);
    return {};
  }
}

// About form submission handler
document.getElementById('about-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const headline = document.getElementById('about-title')?.value;
  const subheading = document.getElementById('about-paragraph2')?.value;
  const bio = document.getElementById('about-paragraph1')?.value;
  const education = document.getElementById('about-education')?.value;
  const imageInput = document.getElementById('about-image');
  
  if (!headline || !bio) {
    alert('Please fill in at least the headline and bio.');
    return;
  }
  
  showLoader();
  try {
    // Handle photo upload if there's a new photo
    let photoUrl = null;
    if (imageInput?.files && imageInput.files.length > 0) {
      const uploadResult = await uploadImage(imageInput.files[0], 'about');
      photoUrl = uploadResult.fileUrl;
    }
    
    // Create about data object
    const aboutData = {
      headline,
      subheading,
      bio,
      education,
      ...(photoUrl && { photoUrl })
    };
    
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/about`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: JSON.stringify(aboutData)
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Save about info failed');
    
    alert('About information saved successfully!');
  } catch (err) {
    console.error('Error saving about info:', err);
    alert('Error saving about information. Please try again.');
  } finally {
    hideLoader();
  }
});

// About photo preview
document.getElementById('about-image')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('about-image-preview');
      if (preview) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
});

// --- TIMELINE CRUD (REST API) ---
async function loadTimeline() {
  try {
    if (window.updateLoadingProgress) window.updateLoadingProgress(10, 'Loading timeline items...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/timeline`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const timeline = await res.json();
    if (!Array.isArray(timeline)) throw new Error('Invalid data format');

    const tbody = document.querySelector('#timeline-table tbody');
    if (tbody) {
      tbody.innerHTML = '';
      if (timeline.length) {
        timeline.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${item.year || ''}</td>
            <td>${item.title || ''}</td>
            <td>${item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : ''}</td>
            <td>
              <button class="btn btn-sm btn-primary edit-timeline-btn" data-id="${item.id}">Edit</button>
              <button class="btn btn-sm btn-danger delete-timeline-btn" data-id="${item.id}">Delete</button>
            </td>`;
          tbody.appendChild(tr);
        });
        document.querySelectorAll('.edit-timeline-btn').forEach(btn => btn.addEventListener('click', () => editTimelineItem(btn.dataset.id)));
        document.querySelectorAll('.delete-timeline-btn').forEach(btn => btn.addEventListener('click', () => deleteTimelineItem(btn.dataset.id)));
      } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No timeline items found. Add your first item!</td></tr>';
      }
    }
    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Timeline loaded successfully');
    return timeline;
  } catch (err) {
    console.error('Error loading timeline:', err);
    const tbody = document.querySelector('#timeline-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading timeline. Please try again.</td></tr>';
    return [];
  }
}

async function getTimelineItem(id) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/timeline/${id}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch timeline item failed');
  return data;
}

async function editTimelineItem(id) {
  showLoader();
  try {
    const item = await getTimelineItem(id);
    document.getElementById('timeline-id').value = item.id;
    document.getElementById('timeline-year').value = item.year || '';
    document.getElementById('timeline-title-input').value = item.title || '';
    document.getElementById('timeline-description').value = item.description || '';
    document.getElementById('timeline-form').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Error editing timeline item:', err);
    alert('Error loading timeline item details. Please try again.');
  } finally {
    hideLoader();
  }
}

async function deleteTimelineItem(id) {
  if (!confirm('Are you sure you want to delete this timeline item? This action cannot be undone.')) return;
  showLoader();
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/timeline/${id}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete timeline item failed');
    await loadTimeline();
  } catch (err) {
    console.error('Error deleting timeline item:', err);
    alert('Error deleting timeline item. Please try again.');
  } finally {
    hideLoader();
  }
}

// Timeline form submission handler
document.getElementById('timeline-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('timeline-id')?.value;
  const year = document.getElementById('timeline-year')?.value;
  const title = document.getElementById('timeline-title-input')?.value;
  const description = document.getElementById('timeline-description')?.value;
  
  if (!year || !title) {
    alert('Please fill in all required fields.');
    return;
  }
  
  showLoader();
  try {
    const token = getAuthToken();
    const payload = { year, title, description };
    const url = id ? `${API_BASE}/timeline/${id}` : `${API_BASE}/timeline`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save timeline item failed');
    clearTimelineForm();
    await loadTimeline();
  } catch (err) {
    console.error('Error saving timeline item:', err);
    alert('Error saving timeline item. Please try again.');
  } finally {
    hideLoader();
  }
});

function clearTimelineForm() {
  document.getElementById('timeline-id').value = '';
  document.getElementById('timeline-year').value = '';
  document.getElementById('timeline-title-input').value = '';
  document.getElementById('timeline-description').value = '';
}

// --- CASE STUDIES CRUD (REST API) ---
async function loadCaseStudies() {
  // Call our enhanced unified function
  return loadCaseStudiesAdmin();
}

// Case study helper functions
async function getCaseStudy(id) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/case-studies/${id}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch case study failed');
  return data;
}

// Case study form submission handler
document.getElementById('case-study-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('case-study-id')?.value;
  const title = document.getElementById('case-study-title')?.value;
  const subtitle = document.getElementById('case-study-subtitle')?.value;
  const summary = document.getElementById('case-study-summary')?.value;
  const content = document.getElementById('case-study-content')?.value;
  const category = document.getElementById('case-study-category')?.value;
  const imageInput = document.getElementById('case-study-image');
  
  if (!title || !subtitle) {
    alert('Please fill in at least the title and subtitle fields.');
    return;
  }
  
  showLoader();
  try {
    // Handle image upload if there's a new image
    let imageUrl = null;
    if (imageInput?.files && imageInput.files.length > 0) {
      const uploadResult = await uploadImage(imageInput.files[0], 'case-studies');
      imageUrl = uploadResult.fileUrl;
    }
    
    // Create case study data object using standardized field names
    const caseStudyData = {
      // Use standardized field names for index page compatibility
      projectTitle: title,
      projectDescription: subtitle,
      projectCategory: category || 'Case Study',
      projectRating: 5,
      projectAchievement: summary,
      // Keep original field names for backward compatibility
      title,
      subtitle,
      summary,
      content,
      category,
      // Add createdAt if this is a new case study
      ...(id ? {} : {createdAt: Date.now()}),
      // Always update the updatedAt timestamp
      updatedAt: Date.now(),
      ...(imageUrl && { projectImageUrl: imageUrl, imageUrl })
    };
    
    // Determine whether to create or update
    const token = getAuthToken();
    const url = id ? `${API_BASE}/case-studies/${id}` : `${API_BASE}/case-studies`;
    const method = id ? 'PUT' : 'POST';
    console.log('➡️ Sending case study to:', method, url, caseStudyData);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: JSON.stringify(caseStudyData)
    });
    console.log('⬅️ Received response:', res.status);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || `Save case study failed (status ${res.status})`);
    
    clearCaseStudyForm();
    await loadCaseStudies();
    alert('Case study saved successfully!');
  } catch (err) {
    console.error('Error saving case study:', err);
    alert(`Error saving case study: ${err.message}`);
  } finally {
    hideLoader();
  }
});

function clearCaseStudyForm() {
  const idEl = document.getElementById('case-study-id'); if (idEl) idEl.value = '';
  const titleEl = document.getElementById('case-study-title'); if (titleEl) titleEl.value = '';
  const subEl = document.getElementById('case-study-subtitle'); if (subEl) subEl.value = '';
  const sumEl = document.getElementById('case-study-summary'); if (sumEl) sumEl.value = '';
  // Note: no project selector field in this form
  const imgEl = document.getElementById('case-study-image'); if (imgEl) imgEl.value = '';
  const previewEl = document.getElementById('case-study-image-preview'); if (previewEl) previewEl.style.display = 'none';
}

// Case study image preview
document.getElementById('case-study-image')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('case-study-image-preview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// --- SITE SETTINGS CRUD (REST API) ---
async function loadSiteSettings() {
  // Skip if settings form not in DOM
  if (!document.getElementById('settings-form')) {
    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Site settings skipped');
    return {};
  }
  try {
    if (window.updateLoadingProgress) window.updateLoadingProgress(10, 'Loading site settings...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/settings`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const settings = await res.json();
    if (!settings) throw new Error('Invalid data format');

    // Fill the settings form
    const siteTitleEl = document.getElementById('settings-site-title');
    if (siteTitleEl) siteTitleEl.value = settings.siteTitle || '';
    const siteDescEl = document.getElementById('settings-logo-text');
    if (siteDescEl) siteDescEl.value = settings.logoText || '';
    const heroTitleEl = document.getElementById('settings-hero-title');
    if (heroTitleEl) {
      const hero = settings.hero && settings.hero.title;
      heroTitleEl.value = hero || '';
    }
    const heroSubEl = document.getElementById('settings-hero-subtitle');
    if (heroSubEl) heroSubEl.value = settings.hero?.subtitle || '';
    const heroBtnEl = document.getElementById('settings-hero-button');
    if (heroBtnEl) heroBtnEl.value = settings.hero?.buttonText || '';

    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Site settings loaded successfully');
    return settings;
  } catch (err) {
    console.error('Error loading site settings:', err);
    return {};
  }
}

// Settings form submission handler
document.getElementById('settings-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const siteTitle = document.getElementById('settings-site-title')?.value;
  const siteDescription = document.getElementById('settings-logo-text')?.value;
  const primaryColor = document.getElementById('primary-color')?.value;
  const secondaryColor = document.getElementById('secondary-color')?.value;
  const googleAnalyticsId = document.getElementById('google-analytics')?.value;
  const customCss = document.getElementById('custom-css')?.value;
  const customJs = document.getElementById('custom-js')?.value;
  const faviconFile = document.getElementById('favicon')?.files[0];
  const logoFile = document.getElementById('logo')?.files[0];
  
  let favicon, logoUrl;
  
  if (faviconFile) {
    const uploadResult = await uploadImage(faviconFile, 'settings');
    favicon = uploadResult.fileUrl;
  }
  
  if (logoFile) {
    const uploadResult = await uploadImage(logoFile, 'settings');
    logoUrl = uploadResult.fileUrl;
  }
  
  const settingsData = {
    siteTitle,
    siteDescription,
    primaryColor,
    secondaryColor,
    googleAnalyticsId,
    customCss,
    customJs
  };
  
  if (favicon) {
    settingsData.favicon = favicon;
  }
  
  if (logoUrl) {
    settingsData.logoUrl = logoUrl;
  }
  
  showLoader();
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: JSON.stringify(settingsData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save settings failed');
    alert('Site settings saved successfully');
  } catch (err) {
    console.error('Error saving site settings:', err);
    alert('Error saving site settings. Please try again.');
  } finally {
    hideLoader();
  }
});

// Settings image previews
document.getElementById('favicon')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('favicon-preview');
      if (preview) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('logo')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('logo-preview');
      if (preview) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
});

// --- SECTIONS EDITOR (REST API) ---
async function loadSectionsEditor() {
  try {
    if (window.updateLoadingProgress) window.updateLoadingProgress(10, 'Loading sections editor...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/sections`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const sections = await res.json();
    if (!sections) throw new Error('Invalid data format');

    const container = document.getElementById('sections-editors');
    if (container) {
      container.innerHTML = '';
      
      // Create a template for each section
      const sectionTypes = [
        { id: 'home', name: 'Home' },
        { id: 'about', name: 'About' },
        { id: 'skills', name: 'Skills' },
        { id: 'timeline', name: 'Timeline' },
        { id: 'projects', name: 'Projects' },
        { id: 'case-studies', name: 'Case Studies' },
        { id: 'testimonials', name: 'Testimonials' },
        { id: 'contact', name: 'Contact' }
      ];
      
      sectionTypes.forEach(section => {
        const sectionData = sections[section.id] || { enabled: true, title: section.name, subtitle: '' };
        
        const sectionEditor = document.createElement('div');
        sectionEditor.className = 'card mb-4';
        sectionEditor.innerHTML = `
          <div class="card-header">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="${section.id}-enabled" ${sectionData.enabled ? 'checked' : ''}>
              <label class="form-check-label" for="${section.id}-enabled">${section.name} Section</label>
            </div>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="${section.id}-title" class="form-label">Section Title</label>
              <input type="text" class="form-control" id="${section.id}-title" value="${sectionData.title || ''}">
            </div>
            <div class="mb-3">
              <label for="${section.id}-subtitle" class="form-label">Section Subtitle</label>
              <input type="text" class="form-control" id="${section.id}-subtitle" value="${sectionData.subtitle || ''}">
            </div>
            ${section.id === 'case-studies' ? `
              <div class="mb-3">
                <label for="${section.id}-count" class="form-label">Max Case Studies to Display</label>
                <input type="number" class="form-control" id="${section.id}-count" min="1" max="12" value="${sectionData.count || 3}">
              </div>
              <div class="mb-3">
                <label for="${section.id}-display" class="form-label">Display Style</label>
                <select class="form-control" id="${section.id}-display">
                  <option value="grid" ${(sectionData.display === 'grid') ? 'selected' : ''}>Grid</option>
                  <option value="carousel" ${(sectionData.display === 'carousel') ? 'selected' : ''}>Carousel</option>
                </select>
              </div>
            ` : ''}
          </div>`;
        
        container.appendChild(sectionEditor);
      });
    }
    
    if (window.updateLoadingProgress) window.updateLoadingProgress(100, 'Sections editor loaded successfully');
    return sections;
  } catch (err) {
    console.error('Error loading sections editor:', err);
    alert('Error loading sections editor. Please try again.');
    return {};
  }
}

// Sections form submission handler
document.getElementById('sections-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const sections = {
    home: {
      enabled: document.getElementById('home-enabled')?.checked || false,
      title: document.getElementById('home-title')?.value || '',
      subtitle: document.getElementById('home-subtitle')?.value || ''
    },
    about: {
      enabled: document.getElementById('about-enabled')?.checked || false,
      title: document.getElementById('about-title-input')?.value || '',
      subtitle: document.getElementById('about-subtitle')?.value || ''
    },
    skills: {
      enabled: document.getElementById('skills-enabled')?.checked || false,
      title: document.getElementById('skills-title')?.value || '',
      subtitle: document.getElementById('skills-subtitle')?.value || ''
    },
    timeline: {
      enabled: document.getElementById('timeline-enabled')?.checked || false,
      title: document.getElementById('timeline-title')?.value || '',
      subtitle: document.getElementById('timeline-subtitle')?.value || ''
    },
    projects: {
      enabled: document.getElementById('projects-enabled')?.checked || false,
      title: document.getElementById('projects-title')?.value || '',
      subtitle: document.getElementById('projects-subtitle')?.value || ''
    },
    testimonials: {
      enabled: document.getElementById('testimonials-enabled')?.checked || false,
      title: document.getElementById('testimonials-title')?.value || '',
      subtitle: document.getElementById('testimonials-subtitle')?.value || ''
    },
    contact: {
      enabled: document.getElementById('contact-enabled')?.checked || false,
      title: document.getElementById('contact-title')?.value || '',
      subtitle: document.getElementById('contact-subtitle')?.value || ''
    },
    'case-studies': {
      enabled: document.getElementById('case-studies-enabled')?.checked || false,
      title: document.getElementById('case-studies-title')?.value || '',
      subtitle: document.getElementById('case-studies-subtitle')?.value || '',
      count: parseInt(document.getElementById('case-studies-count')?.value || '3', 10),
      display: document.getElementById('case-studies-display')?.value || 'grid'
    }
  };
  
  showLoader();
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/sections`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: JSON.stringify(sections)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save sections failed');
    alert('Sections saved successfully');
  } catch (err) {
    console.error('Error saving sections:', err);
    alert('Error saving sections. Please try again.');
  } finally {
    hideLoader();
  }
});

// Init login form event listeners
document.getElementById('login-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Remove any previous token
  sessionStorage.removeItem('jwtToken');
  
  const email = document.getElementById('username')?.value || '';
  const password = document.getElementById('password')?.value || '';
  
  if (!email || !password) {
    showLoginError('Please enter email and password');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Save the token to session storage
    sessionStorage.setItem('jwtToken', data.token);
    showLoginSuccess('Login successful!');
    
    // Hide login form and show admin panel
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-section').style.display = 'block';
    
    // Load all data
    loadAllData();
  } catch (error) {
    console.error('Login error:', error);
    showLoginError(error.message || 'Login failed. Please check your credentials.');
  }
});

// DOM elements for case study sections
const caseStudySectionsContainer = document.getElementById('case-study-sections');
const addSectionBtn = document.getElementById('add-section-btn');

function createSectionEditor(content = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'mb-3';
  wrapper.innerHTML = `
    <textarea class="form-control case-study-section" rows="3" placeholder="Section content">${content}</textarea>
    <button type="button" class="btn btn-sm btn-danger remove-section-btn mt-1">Remove</button>
  `;
  wrapper.querySelector('.remove-section-btn').addEventListener('click', () => wrapper.remove());
  return wrapper;
}

if (caseStudySectionsContainer && addSectionBtn) {
  // start with one section editor
  caseStudySectionsContainer.appendChild(createSectionEditor());
  addSectionBtn.addEventListener('click', () => {
    caseStudySectionsContainer.appendChild(createSectionEditor());
  });
}

// --- UNIFIED CASE STUDIES MANAGEMENT ---
async function loadCaseStudiesAdmin() {
  try {
    console.log("Loading case studies for admin panel...");
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/case-studies`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const caseStudies = await res.json();
    
    const tbody = document.querySelector('#case-studies-table tbody');
    if (!tbody) return caseStudies;
    
    // Clear the table
    tbody.innerHTML = '';
    
    if (caseStudies.length) {
      caseStudies.forEach(study => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${study.projectTitle || 'Untitled'}</td>
          <td>${study.projectDescription ? (study.projectDescription.length > 50 ? study.projectDescription.substring(0, 50) + '...' : study.projectDescription) : ''}</td>
          <td>${study.projectCategory || 'Uncategorized'}</td>
          <td>
            <button class="btn btn-sm btn-primary edit-case-study-btn" data-id="${study.id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-case-study-btn" data-id="${study.id}">Delete</button>
            <a href="/case_study.html?caseId=${study.id}" class="btn btn-sm btn-info" target="_blank">View</a>
            <a href="/case_study_editor.html?caseId=${study.id}" class="btn btn-sm btn-secondary">Advanced Edit</a>
          </td>`;
        tbody.appendChild(tr);
      });
      
      // Add event listeners
      document.querySelectorAll('.edit-case-study-btn').forEach(btn => {
        btn.addEventListener('click', () => editCaseStudy(btn.getAttribute('data-id')));
      });
      
      document.querySelectorAll('.delete-case-study-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteCaseStudy(btn.getAttribute('data-id')));
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No case studies found. Add your first case study!</td></tr>';
    }
    
    return caseStudies;
  } catch (error) {
    console.error("Error loading case studies:", error);
    return [];
  }
}

// --- MAGICAL CAROUSEL MANAGEMENT ---
async function loadCarouselImages() {
  try {
    console.log('Loading carousel images...');
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/carousel-images`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    if (!res.ok) throw new Error('Failed to fetch carousel images');
    const carouselImages = await res.json();
    
    const carouselTableBody = document.querySelector('#carousel-images-table tbody');
    if (!carouselTableBody) return;
    
    // Clear the table
    carouselTableBody.innerHTML = '';
    
    if (carouselImages.length) {
      carouselImages.forEach((image, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="border px-4 py-2">
            <img src="${image.url}" alt="${image.caption || 'Carousel image'}" class="w-24 h-16 object-cover rounded">
          </td>
          <td class="border px-4 py-2">${image.caption || 'No caption'}</td>
          <td class="border px-4 py-2">${image.order || index + 1}</td>
          <td class="border px-4 py-2">
            <button class="edit-carousel-image bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2" 
                    data-id="${image.id}">
              Edit
            </button>
            <button class="delete-carousel-image bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" 
                    data-id="${image.id}">
              Delete
            </button>
          </td>
        `;
        carouselTableBody.appendChild(tr);
      });
      
      // Add event listeners for edit/delete buttons
      document.querySelectorAll('.edit-carousel-image').forEach(button => {
        button.addEventListener('click', function() {
          const imageId = this.getAttribute('data-id');
          const image = carouselImages.find(img => img.id === imageId);
          
          if (image) {
            document.getElementById('carousel-image-id').value = image.id;
            document.getElementById('carousel-image-caption').value = image.caption || '';
            document.getElementById('carousel-image-order').value = image.order || 0;
            document.getElementById('carousel-image-preview').src = image.url;
            document.getElementById('carousel-image-preview').classList.remove('hidden');
            document.getElementById('carousel-upload-container').classList.add('hidden');
            
            // Show the form
            document.getElementById('carousel-image-form-container').classList.remove('hidden');
            document.getElementById('carousel-image-form-title').textContent = 'Edit Carousel Image';
          }
        });
      });
      
      document.querySelectorAll('.delete-carousel-image').forEach(button => {
        button.addEventListener('click', async function() {
          if (confirm('Are you sure you want to delete this carousel image?')) {
            const imageId = this.getAttribute('data-id');
            
            try {
              const token = getAuthToken();
              const res = await fetch(`${API_BASE}/carousel-images/${imageId}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              });
              
              if (!res.ok) throw new Error('Failed to delete carousel image');
              
              // Reload the carousel images
              loadCarouselImages();
              showNotification('Carousel image deleted successfully');
            } catch (error) {
              console.error('Error deleting carousel image:', error);
              showNotification('Failed to delete carousel image', 'error');
            }
          }
        });
      });
    } else {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="4" class="border px-4 py-2 text-center">No carousel images found</td>
      `;
      carouselTableBody.appendChild(tr);
    }
  } catch (error) {
    console.error('Error loading carousel images:', error);
    showNotification('Failed to load carousel images', 'error');
  }
}

// Add a new carousel image
document.getElementById('add-carousel-image-btn')?.addEventListener('click', function() {
  // Reset the form
  document.getElementById('carousel-image-id').value = '';
  document.getElementById('carousel-image-caption').value = '';
  document.getElementById('carousel-image-order').value = '';
  document.getElementById('carousel-image-preview').src = '';
  document.getElementById('carousel-image-preview').classList.add('hidden');
  document.getElementById('carousel-upload-container').classList.remove('hidden');
  
  // Show the form
  document.getElementById('carousel-image-form-container').classList.remove('hidden');
  document.getElementById('carousel-image-form-title').textContent = 'Add Carousel Image';
});

// Close the carousel image form
document.getElementById('cancel-carousel-image-btn')?.addEventListener('click', function() {
  document.getElementById('carousel-image-form-container').classList.add('hidden');
});

// Handle direct file upload for carousel images
document.getElementById('carousel-direct-upload')?.addEventListener('change', async function(e) {
  if (!e.target.files || e.target.files.length === 0) return;
  
  const file = e.target.files[0];
  const token = getAuthToken();
  
  // Show progress bar
  const progressBar = document.querySelector('#upload-progress');
  const progressBarInner = progressBar.querySelector('.progress-bar');
  progressBar.classList.remove('d-none');
  progressBarInner.style.width = '0%';
  progressBarInner.setAttribute('aria-valuenow', 0);
  
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'portfolio/carousel');
    formData.append('caption', 'New Carousel Image');
    
    // Use fetch with upload progress tracking
    const xhr = new XMLHttpRequest();
    
    // Set up progress tracking
    xhr.upload.addEventListener('progress', function(event) {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        progressBarInner.style.width = percentComplete + '%';
        progressBarInner.setAttribute('aria-valuenow', percentComplete);
      }
    });
    
    // Create a Promise to handle the XHR request
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.open('POST', `${API_BASE}/carousel-images`);
      
      // Set headers
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred'));
      };
      
      xhr.send(formData);
    });
    
    // Wait for upload to complete
    const response = await uploadPromise;
    
    // Update the form with the response data
    document.getElementById('carousel-image-preview').src = response.url;
    document.getElementById('carousel-image-preview').classList.remove('hidden');
    document.getElementById('carousel-image-url').value = response.url;
    document.getElementById('carousel-image-public-id').value = response.publicId;
    document.getElementById('carousel-image-width').value = response.width;
    document.getElementById('carousel-image-height').value = response.height;
    
    // Hide the upload container
    document.getElementById('carousel-upload-container').classList.add('hidden');
    
    // Show success notification
    showNotification('Image uploaded successfully!', 'success');
  } catch (error) {
    console.error('Error uploading image:', error);
    showNotification('Failed to upload image. Please try again.', 'error');
  } finally {
    // Hide progress bar
    progressBar.classList.add('d-none');
  }
});

// Handle carousel image form submission
document.getElementById('carousel-image-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('carousel-image-id').value;
  const caption = document.getElementById('carousel-image-caption').value;
  const order = document.getElementById('carousel-image-order').value;
  const url = document.getElementById('carousel-image-url').value;
  const publicId = document.getElementById('carousel-image-public-id').value;
  const width = document.getElementById('carousel-image-width').value;
  const height = document.getElementById('carousel-image-height').value;
  
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    let res;
    
    if (id) {
      // Update existing image
      res = await fetch(`${API_BASE}/carousel-images/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          caption,
          order: parseInt(order) || 0
        })
      });
    } else {
      // Create new image
      res = await fetch(`${API_BASE}/carousel-images`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url,
          publicId,
          width: parseInt(width) || 0,
          height: parseInt(height) || 0,
          caption,
          order: parseInt(order) || 0,
          service: 'cloudinary'
        })
      });
    }
    
    if (!res.ok) throw new Error('Failed to save carousel image');
    
    // Hide the form
    document.getElementById('carousel-image-form-container').classList.add('hidden');
    
    // Reload the carousel images
    loadCarouselImages();
    showNotification('Carousel image saved successfully');
  } catch (error) {
    console.error('Error saving carousel image:', error);
    showNotification('Failed to save carousel image', 'error');
  }
});

// Add this function to the initial load
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a page that needs carousel images
  if (document.getElementById('carousel-images-table')) {
    loadCarouselImages();
  }
});

// Initialize Cloudinary upload widget for carousel images
document.getElementById('carousel-upload-widget-btn')?.addEventListener('click', function() {
  console.log('🖱️ Cloudinary upload widget button clicked!');
  
  // Check if Cloudinary is available
  if (typeof cloudinary === 'undefined') {
    console.error('❌ Cloudinary widget is not available! Make sure the Cloudinary script is loaded.');
    showNotification('Cloudinary widget is not available. Please refresh the page.', 'error');
    return;
  }
  
  // Generate timestamp and signature for Cloudinary
  fetch(`${API_BASE}/upload-signature?folder=portfolio/carousel&service=cloudinary`, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  })
  .then(res => {
    console.log('Signature response status:', res.status);
    if (!res.ok) {
      throw new Error(`Failed to get upload signature: ${res.status} ${res.statusText}`);
    }
    return res.json();
  })
  .then(data => {
    console.log('Got upload signature data:', data);
    
    if (!data.cloudName || !data.apiKey || !data.signature) {
      throw new Error('Missing required Cloudinary credentials');
    }
    
    const uploadOptions = {
      cloudName: data.cloudName,
      apiKey: data.apiKey,
      uploadSignature: data.signature,
      uploadPreset: 'portfolio_carousel',
      folder: 'portfolio/carousel',
      timestamp: data.timestamp,
      // Remove cropping constraint to allow any image size/ratio
      cropping: false,
      // Add more upload sources for versatility
      sources: ['local', 'url', 'camera', 'dropbox', 'google_drive', 'facebook', 'instagram'],
      // Remove file size limitations
      maxFileSize: 50000000, // 50MB max file size
      // Allow multiple images to be uploaded
      multiple: true,
      // Add support for more file types
      resourceType: 'auto',
      // Customize UI with better colors and messaging
      styles: {
        palette: { window: '#F5F5F5', sourceBg: '#FFFFFF', windowBorder: '#4299E1', tabIcon: '#4299E1', inactiveTabIcon: '#CCCCCC', menuIcons: '#4299E1', link: '#4299E1', action: '#2B6CB0', inProgress: '#3182CE', complete: '#48BB78', error: '#E53E3E', textDark: '#2D3748', textLight: '#FFFFFF' },
        fonts: { default: { active: true } }
      },
      text: {
        en: {
          local: {
            dd_title_single: 'Drag and drop your carousel image here',
            dd_title_multi: 'Drag and drop your carousel images here',
            drop_title_single: 'Drop your carousel image here',
            drop_title_multi: 'Drop your carousel images here'
          }
        }
      }
    };

    console.log('Creating Cloudinary upload widget with options:', uploadOptions);
    
    try {
      const widget = cloudinary.createUploadWidget(uploadOptions, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          showNotification('Error uploading image. Please try again.', 'error');
          return;
        }
        
        console.log('Cloudinary widget event:', result?.event, result?.info);
        
        if (result && result.event === 'success') {
          const imageData = result.info;
          console.log('Successfully uploaded image:', imageData);
          
          // Set the form values
          document.getElementById('carousel-image-preview').src = imageData.secure_url;
          document.getElementById('carousel-image-preview').classList.remove('hidden');
          document.getElementById('carousel-image-url').value = imageData.secure_url;
          document.getElementById('carousel-image-public-id').value = imageData.public_id;
          document.getElementById('carousel-image-width').value = imageData.width;
          document.getElementById('carousel-image-height').value = imageData.height;
          
          // Hide the upload container
          document.getElementById('carousel-upload-container').classList.add('hidden');
          
          // Show success notification
          showNotification('Image uploaded successfully!', 'success');
        }
        
        // Handle queue complete event to support multiple uploads
        if (result && result.event === 'queues-end') {
          console.log('All uploads completed');
        }
      });
      
      console.log('Opening Cloudinary widget...');
      widget.open();
    } catch (err) {
      console.error('Error creating or opening Cloudinary widget:', err);
      showNotification('Failed to initialize upload widget', 'error');
    }
  })
  .catch(error => {
    console.error('Error getting upload signature:', error);
    showNotification('Failed to initialize upload widget', 'error');
  });
});

// Add notification function to show success/error messages
function showNotification(message, type = 'success') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('notification-toast');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification-toast';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.padding = '12px 24px';
    notification.style.borderRadius = '6px';
    notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    notification.style.opacity = '0';
    document.body.appendChild(notification);
  }
  
  // Set notification style based on type
  if (type === 'success') {
    notification.style.backgroundColor = '#48BB78';
    notification.style.color = 'white';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#F56565';
    notification.style.color = 'white';
  } else if (type === 'warning') {
    notification.style.backgroundColor = '#ED8936';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = '#4299E1';
    notification.style.color = 'white';
  }
  
  // Set message text
  notification.textContent = message;
  
  // Show notification
  notification.style.opacity = '1';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Unified case study editing
async function editCaseStudy(id) {
  showLoader();
  try {
    const caseStudy = await getCaseStudy(id);
    if (!caseStudy) {
      throw new Error('Case study not found');
    }
    
    const simpleEditorAvailable = document.getElementById('case-study-form');
    
    if (simpleEditorAvailable) {
      // Use the simple editor in the main admin panel
      document.getElementById('case-study-id').value = caseStudy.id;
      document.getElementById('case-study-title').value = caseStudy.projectTitle || caseStudy.title || '';
      document.getElementById('case-study-subtitle').value = caseStudy.projectDescription || caseStudy.summary || '';
      
      if (caseStudy.projectImageUrl) {
        document.getElementById('case-study-image-preview').src = caseStudy.projectImageUrl;
        document.getElementById('case-study-image-preview').style.display = 'block';
      } else {
        document.getElementById('case-study-image-preview').style.display = 'none';
      }
      
      document.getElementById('case-study-form').scrollIntoView({ behavior: 'smooth' });
    } else {
      // Redirect to the advanced editor
      window.location.href = `/case_study_editor.html?caseId=${id}`;
    }
  } catch (err) {
    console.error('Error editing case study:', err);
    alert('Error loading case study details. Please try again.');
  } finally {
    hideLoader();
  }
}

// Delete case study with confirmation
async function deleteCaseStudy(id) {
  if (!confirm('Are you sure you want to delete this case study? This action cannot be undone.')) return;
  
  showLoader();
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/case-studies/${id}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Delete case study failed');
    }
    
    alert('Case study deleted successfully');
    await loadCaseStudiesAdmin();
  } catch (err) {
    console.error('Error deleting case study:', err);
    alert('Error deleting case study. Please try again.');
  } finally {
    hideLoader();
  }
}

// Unified case study form event handler
document.addEventListener('DOMContentLoaded', function() {
  const caseStudyForm = document.getElementById('case-study-form');
  if (caseStudyForm) {
    caseStudyForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      showLoader();
      
      try {
        const idElement = document.getElementById('case-study-id');
        const titleElement = document.getElementById('case-study-title');
        const subtitleElement = document.getElementById('case-study-subtitle');
        const summaryElement = document.getElementById('case-study-summary');
        const contentElement = document.getElementById('case-study-content');
        const categoryElement = document.getElementById('case-study-category');
        
        const id = idElement ? idElement.value : '';
        const title = titleElement ? titleElement.value : '';
        const subtitle = subtitleElement ? subtitleElement.value : '';
        const summary = summaryElement ? summaryElement.value : '';
        const content = contentElement ? contentElement.value : '';
        const category = categoryElement ? categoryElement.value : '';
        
        // Create case study data object
        const caseStudyData = {
          projectTitle: title,
          projectDescription: subtitle,
          summary: summary || subtitle,
          content: content || '',
          projectCategory: category || 'Case Study',
          updatedAt: new Date().toISOString()
        };
        
        // Check for image upload
        const imageInput = document.getElementById('case-study-image');
        if (imageInput && imageInput.files && imageInput.files.length > 0) {
          try {
            const imageData = await uploadImage(imageInput.files[0], 'caseStudies');
            caseStudyData.projectImageUrl = imageData.url;
            caseStudyData.imagePublicId = imageData.publicId;
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError);
            showNotification('Image upload failed, but will continue with case study save', 'warning');
          }
        }
        
        // Save to API endpoint
        const token = getAuthToken();
        let res;
        
        if (id) {
          res = await fetch(`${API_BASE}/case-studies/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(caseStudyData)
          });
        } else {
          res = await fetch(`${API_BASE}/case-studies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(caseStudyData)
          });
        }
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save case study');
        }
        
        showNotification('Case study saved successfully', 'success');
        clearCaseStudyForm();
        await loadCaseStudies();
      } catch (error) {
        console.error('Error saving case study:', error);
        showNotification('Failed to save case study: ' + error.message, 'error');
      } finally {
        hideLoader();
      }
    });
  }
  
  // Image preview handler for case studies
  const caseStudyImageInput = document.getElementById('case-study-image');
  if (caseStudyImageInput) {
    caseStudyImageInput.addEventListener('change', function(e) {
      const preview = document.getElementById('case-study-image-preview');
      if (preview) {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        } else {
          preview.style.display = 'none';
        }
      }
    });
  }
});