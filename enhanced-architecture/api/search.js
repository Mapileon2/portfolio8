const express = require('express');
const SearchService = require('../services/SearchService');

const router = express.Router();
const search = new SearchService();

// Search endpoint
router.get('/', (req, res) => {
  try {
    const {
      q: query,
      type,
      category,
      technologies,
      limit = 10,
      offset = 0
    } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const options = {
      type,
      category,
      technologies: technologies ? technologies.split(',').map(t => t.trim()) : undefined,
      limit: Math.min(parseInt(limit), 50), // Max 50 results
      offset: parseInt(offset)
    };

    const results = search.search(query, options);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get search suggestions
router.get('/suggestions', (req, res) => {
  try {
    const { q: query = '', limit = 5 } = req.query;
    const suggestions = search.getSuggestions(query, parseInt(limit));
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get search analytics
router.get('/analytics', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analytics = search.getSearchAnalytics(parseInt(days));
    res.json(analytics);
  } catch (error) {
    console.error('Error getting search analytics:', error);
    res.status(500).json({ error: 'Failed to get search analytics' });
  }
});

// Add document to search index (admin endpoint)
router.post('/index', (req, res) => {
  try {
    const { id, type, title, description, technologies, category, url } = req.body;

    if (!id || !type || !title || !description) {
      return res.status(400).json({ 
        error: 'ID, type, title, and description are required' 
      });
    }

    const document = {
      id,
      type,
      title,
      description,
      technologies: technologies || [],
      category: category || 'General',
      url: url || `/${type}s/${id}`
    };

    search.addDocument(document);
    res.json({ success: true, message: 'Document indexed successfully' });
  } catch (error) {
    console.error('Error indexing document:', error);
    res.status(500).json({ error: 'Failed to index document' });
  }
});

// Remove document from index (admin endpoint)
router.delete('/index/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    search.removeDocument(documentId);
    res.json({ success: true, message: 'Document removed from index' });
  } catch (error) {
    console.error('Error removing document:', error);
    res.status(500).json({ error: 'Failed to remove document' });
  }
});

// Update document in index (admin endpoint)
router.put('/index/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    const updates = req.body;
    
    search.updateDocument(documentId, updates);
    res.json({ success: true, message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

module.exports = router;