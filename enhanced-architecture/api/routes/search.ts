import express from 'express';
import { SearchService } from '../../services/SearchService';

const router = express.Router();

// Search endpoint
router.get('/', async (req, res) => {
  try {
    const {
      q: query,
      category,
      tags,
      startDate,
      endDate,
      author,
      status,
      sortBy,
      sortOrder = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter is required'
      });
    }

    const search: SearchService = (req as any).services.search;

    // Build search query
    const searchQuery = {
      query: query.trim(),
      filters: {
        ...(category && { category: category as string }),
        ...(tags && { tags: (tags as string).split(',').map(tag => tag.trim()) }),
        ...(startDate && endDate && {
          dateRange: {
            start: new Date(startDate as string),
            end: new Date(endDate as string)
          }
        }),
        ...(author && { author: author as string }),
        ...(status && { status: status as string })
      },
      ...(sortBy && {
        sort: {
          field: sortBy as string,
          direction: sortOrder as 'asc' | 'desc'
        }
      }),
      pagination: {
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 50) // Max 50 results per page
      }
    };

    const results = await search.search(searchQuery);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed'
    });
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = '5' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter is required'
      });
    }

    const search: SearchService = (req as any).services.search;
    const suggestions = await search.getSuggestions(
      query.trim(),
      parseInt(limit as string, 10)
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      error: 'Failed to get suggestions'
    });
  }
});

// Get search analytics (admin endpoint)
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    const search: SearchService = (req as any).services.search;
    const analytics = await search.getSearchAnalytics({
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error getting search analytics:', error);
    res.status(500).json({
      error: 'Failed to get search analytics'
    });
  }
});

// Index document (admin endpoint)
router.post('/index', async (req, res) => {
  try {
    const { id, type, title, content, tags, category, metadata } = req.body;

    if (!id || !type || !title || !content) {
      return res.status(400).json({
        error: 'ID, type, title, and content are required'
      });
    }

    const search: SearchService = (req as any).services.search;
    
    await search.indexDocument({
      id,
      type,
      title,
      content,
      tags: tags || [],
      category: category || 'general',
      metadata: metadata || {}
    });

    res.json({ success: true, message: 'Document indexed successfully' });
  } catch (error) {
    console.error('Error indexing document:', error);
    res.status(500).json({
      error: 'Failed to index document'
    });
  }
});

// Remove from index (admin endpoint)
router.delete('/index/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    const search: SearchService = (req as any).services.search;
    await search.removeFromIndex(documentId);

    res.json({ success: true, message: 'Document removed from index' });
  } catch (error) {
    console.error('Error removing document from index:', error);
    res.status(500).json({
      error: 'Failed to remove document from index'
    });
  }
});

// Reindex all documents (admin endpoint)
router.post('/reindex', async (req, res) => {
  try {
    const search: SearchService = (req as any).services.search;
    
    // Start reindexing in background
    search.reindexAll().catch(error => {
      console.error('Reindex error:', error);
    });

    res.json({ 
      success: true, 
      message: 'Reindexing started in background' 
    });
  } catch (error) {
    console.error('Error starting reindex:', error);
    res.status(500).json({
      error: 'Failed to start reindex'
    });
  }
});

export default router;