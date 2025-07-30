import express from 'express';
import { AnalyticsService } from '../../services/AnalyticsService';

const router = express.Router();

// Get project analytics
router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    const analytics: AnalyticsService = (req as any).services.analytics;
    
    const data = await analytics.getProjectAnalytics(projectId, {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    });

    res.json(data);
  } catch (error) {
    console.error('Error getting project analytics:', error);
    res.status(500).json({
      error: 'Failed to get project analytics'
    });
  }
});

// Get site analytics
router.get('/site', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    const analytics: AnalyticsService = (req as any).services.analytics;
    
    const data = await analytics.getSiteAnalytics({
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    });

    res.json(data);
  } catch (error) {
    console.error('Error getting site analytics:', error);
    res.status(500).json({
      error: 'Failed to get site analytics'
    });
  }
});

// Get real-time analytics
router.get('/realtime', async (req, res) => {
  try {
    const analytics: AnalyticsService = (req as any).services.analytics;
    const data = await analytics.getRealtimeAnalytics();
    res.json(data);
  } catch (error) {
    console.error('Error getting realtime analytics:', error);
    res.status(500).json({
      error: 'Failed to get realtime analytics'
    });
  }
});

// Track event
router.post('/track', async (req, res) => {
  try {
    const { type, properties = {}, context = {} } = req.body;
    
    if (!type) {
      return res.status(400).json({
        error: 'Event type is required'
      });
    }

    const analytics: AnalyticsService = (req as any).services.analytics;
    
    // Add request context
    const eventContext = {
      ...context,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    await analytics.trackEvent(type, properties, eventContext);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      error: 'Failed to track event'
    });
  }
});

// Track page view
router.post('/track/pageview', async (req, res) => {
  try {
    const { page, title, context = {} } = req.body;
    
    if (!page) {
      return res.status(400).json({
        error: 'Page is required'
      });
    }

    const analytics: AnalyticsService = (req as any).services.analytics;
    
    const eventContext = {
      ...context,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      title
    };

    await analytics.trackPageView(page, eventContext);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({
      error: 'Failed to track page view'
    });
  }
});

// Track project view
router.post('/track/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { context = {} } = req.body;

    const analytics: AnalyticsService = (req as any).services.analytics;
    
    const eventContext = {
      ...context,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    await analytics.trackProjectView(projectId, eventContext);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking project view:', error);
    res.status(500).json({
      error: 'Failed to track project view'
    });
  }
});

// Track conversion
router.post('/track/conversion', async (req, res) => {
  try {
    const { goalId, value, context = {} } = req.body;
    
    if (!goalId) {
      return res.status(400).json({
        error: 'Goal ID is required'
      });
    }

    const analytics: AnalyticsService = (req as any).services.analytics;
    
    await analytics.trackConversion(goalId, value, context);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({
      error: 'Failed to track conversion'
    });
  }
});

export default router;