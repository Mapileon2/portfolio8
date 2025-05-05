import { db } from './firebase-config.js';
import { doc, getDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async function() {
    // Mobile menu toggle
    document.getElementById('mobile-menu-button').addEventListener('click', function() {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-menu');
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });

    // Load case study content from Firebase
    const urlParams = new URLSearchParams(window.location.search);
    const caseStudyId = urlParams.get('id');
    
    if (caseStudyId) {
        try {
            const docRef = doc(db, 'caseStudies', caseStudyId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const caseStudy = docSnap.data();
                updateCaseStudyContent(caseStudy);
            } else {
                console.error("No case study found with ID:", caseStudyId);
                displayError("Case study not found!");
            }
        } catch (error) {
            console.error("Error loading case study:", error);
            displayError("Error loading case study");
        }
    } else {
        displayError("No case study ID provided");
    }
});

function updateCaseStudyContent(caseStudy) {
    // Update page title
    document.title = `${caseStudy.title} | Case Study`;
    
    // Update hero section
    const heroSection = document.getElementById('hero');
    if (heroSection) {
        const h1 = heroSection.querySelector('h1');
        const h2 = heroSection.querySelector('h2');
        const p = heroSection.querySelector('p');
        
        if (h1) h1.textContent = caseStudy.title || '';
        if (h2) h2.textContent = caseStudy.subtitle || '';
        if (p) p.textContent = caseStudy.summary || '';
        
        // Update hero background if available
        if (caseStudy.imageUrl) {
            heroSection.style.backgroundImage = `url(${caseStudy.imageUrl})`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
        }
    }
    
    // Load and display sections
    if (caseStudy.sections && caseStudy.sections.length > 0) {
        caseStudy.sections.forEach(section => {
            const sectionEl = document.getElementById(section.id);
            if (sectionEl) {
                const h2 = sectionEl.querySelector('h2');
                const contentContainer = sectionEl.querySelector('.content-container');
                
                if (h2) h2.textContent = section.title || '';
                if (contentContainer) contentContainer.innerHTML = section.content || '';
            }
        });
    } else {
        // No sections found, display message
        const mainContent = document.querySelector('main');
        if (mainContent) {
            const noContentDiv = document.createElement('div');
            noContentDiv.className = 'flex justify-center items-center py-20';
            noContentDiv.innerHTML = `
                <div class="text-center">
                    <h3 class="text-2xl text-gray-600">No content sections available for this case study</h3>
                    <p class="mt-4">
                        <a href="portfolio.html" class="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full inline-block mt-4">
                            Back to Portfolio
                        </a>
                    </p>
                </div>
            `;
            mainContent.appendChild(noContentDiv);
        }
    }
}

function displayError(message) {
    const mainContent = document.querySelector('main') || document.body;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'flex justify-center items-center py-20';
    errorDiv.innerHTML = `
        <div class="text-center">
            <h3 class="text-2xl text-red-600">${message}</h3>
            <p class="mt-4">
                <a href="portfolio.html" class="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full inline-block mt-4">
                    Back to Portfolio
                </a>
            </p>
        </div>
    `;
    
    mainContent.innerHTML = '';
    mainContent.appendChild(errorDiv);
}
