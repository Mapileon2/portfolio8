// Sections API endpoints
const setupSectionsAPI = (app, rtdb) => {
  // Get all sections (public)
  app.get('/api/sections', async (req, res) => {
    try {
      console.log('📊 GET /api/sections - Fetching sections data');
      
      // First try to fetch from Firebase
      let sections = {};
      try {
        const snapshot = await rtdb.ref('sections').once('value');
        const val = snapshot.val();
        
        if (val) {
          console.log(`📊 Found sections data in Firebase`);
          sections = val;
        } else {
          console.log('📊 No sections found in Firebase, using default template');
          // Provide default template for sections
          sections = {
            about: {
              title: "About Arpan",
              description: "Professional portfolio showcasing my work and skills",
              image: "/images/profile.jpg"
            },
            skills: [],
            timeline: [],
            testimonials: []
          };
        }
      } catch (fbError) {
        console.log('Firebase sections fetch failed, using default template:', fbError);
        // Fallback to default template
        sections = {
          about: {
            title: "About Arpan",
            description: "Professional portfolio showcasing my work and skills",
            image: "/images/profile.jpg"
          },
          skills: [],
          timeline: [],
          testimonials: []
        };
      }
      
      res.json(sections);
    } catch (error) {
      console.error('Error fetching sections:', error);
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  });

  // Update sections content (protected)
  app.put('/api/sections', async (req, res) => {
    try {
      console.log('📊 PUT /api/sections - Updating sections');
      
      // Update sections in Firebase
      await rtdb.ref('sections').set(req.body);
      console.log('📊 Sections updated successfully');
      
      res.json({ success: true, message: 'Sections updated successfully' });
    } catch (error) {
      console.error('Error updating sections:', error);
      res.status(500).json({ error: 'Failed to update sections' });
    }
  });

  console.log('📊 Sections API endpoints initialized');
};

module.exports = setupSectionsAPI; 