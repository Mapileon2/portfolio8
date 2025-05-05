// Debug script for Magical Journeys
document.addEventListener('DOMContentLoaded', function() {
    console.log('Magic Journeys Debug Script Loaded');
    
    // Add a small delay to ensure other scripts have initialized
    setTimeout(() => {
        try {
            // Check if the elements exist
            const carouselBtn = document.getElementById('showCarouselBtn');
            console.log('Show Carousel Button exists:', !!carouselBtn);
            
            const addBtn = document.getElementById('addCarouselImageBtn');
            console.log('Add Image Button exists:', !!addBtn);
            
            const carouselSection = document.getElementById('carouselSection');
            console.log('Carousel Section exists:', !!carouselSection);
            
            const carouselForm = document.getElementById('carouselImageForm');
            console.log('Carousel Form exists:', !!carouselForm);
            
            // Add manual click handler as a backup
            if (addBtn) {
                console.log('Adding backup click handler to Add Image button');
                addBtn.addEventListener('click', function(event) {
                    console.log('Add Image button clicked via backup handler');
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Try to manually show the form
                    if (carouselForm) {
                        console.log('Manually removing hidden class from form');
                        carouselForm.classList.remove('hidden');
                    }
                });
            }
            
            // Add a global accessible method
            window.showMagicalJourneysForm = function() {
                console.log('Manual form show function called');
                const form = document.getElementById('carouselImageForm');
                if (form) {
                    form.classList.remove('hidden');
                    return 'Form should now be visible';
                }
                return 'Form element not found';
            };
            
            console.log('Debug setup complete. You can call window.showMagicalJourneysForm() in the console to manually show the form.');
        } catch (error) {
            console.error('Error in Magic Journeys Debug:', error);
        }
    }, 2000);
}); 