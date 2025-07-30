const express = require('express');
const AnalyticsService = require('../services/AnalyticsService');

const router = express.Router();
const analytics = new AnalyticsService();

// Track event
router.post('/track', (req, res) => {
  try {
    const { type, properties = {} } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    analytics.trackEvent(type, properties, context);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Track page view
router.post('/pageview', (req, res) => {
  try {
    const { page } = req.body;
    
    if (!page) {
      return res.status(400).json({ error: 'Page is required' });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    analytics.trackPageView(page, context);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({ error: 'Failed to track page view' });
  }
});

// Track project view
router.post('/project/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;

    const context = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    analytics.trackProjectView(projectId, context);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking project view:', error);
    res.status(500).json({ error: 'Failed to track project view' });
  }
});

// Get analytics summary
router.get('/summary', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const summary = analytics.getAnalyticsSummary(parseInt(days));
    res.json(summary);
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

// Get real-time stats
router.get('/realtime', (req, res) => {
  try {
    const stats = analytics.getRealtimeStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting realtime stats:', error);
    res.status(500).json({ error: 'Failed to get realtime stats' });
  }
});

// Get popular pages
router.get('/pages', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const pages = analytics.getTopPages(null, parseInt(limit));
    res.json({ pages });
  } catch (error) {
    console.error('Error getting popular pages:', error);
    res.status(500).json({ error: 'Failed to get popular pages' });
  }
});

// Get popular projects
router.get('/projects', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const projects = analytics.getTopProjects(null, parseInt(limit));
    res.json({ projects });
  } catch (error) {
    console.error('Error getting popular projects:', error);
    res.status(500).json({ error: 'Failed to get popular projects' });
  }
});

module.exports = router;