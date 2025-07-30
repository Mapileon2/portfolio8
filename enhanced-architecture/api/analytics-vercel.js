// Analytics API for Vercel deployment
const fs = require('fs');
const path = require('path');

// Mock analytics data for development/demo
const getMockAnalytics = () => ({
  summary: {
    totalViews: 15420,
    uniqueVisitors: 8750,
    avgSessionDuration: 245,
    bounceRate: 0.35,
    topPages: [
      { path: '/', views: 5420, uniqueViews: 3200 },
      { path: '/projects', views: 3200, uniqueViews: 2100 },
      { path: '/about', views: 2800, uniqueViews: 1900 }
    ],
    trends: {
      viewsChange: 12.5,
      visitorsChange: 8.3,
      durationChange: -2.1
    },
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    }
  },
  realtime: {
    activeVisitors: Math.floor(Math.random() * 50) + 10,
    currentPageViews: {
      '/': Math.floor(Math.random() * 20) + 5,
      '/projects': Math.floor(Math.random() * 15) + 3,
      '/about': Math.floor(Math.random() * 10) + 2
    },
    recentEvents: [
      {
        type: 'pageview',
        path: '/projects',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        userAgent: 'Mozilla/5.0...',
        country: 'US'
      },
      {
        type: 'pageview',
        path: '/',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        userAgent: 'Mozilla/5.0...',
        country: 'CA'
      }
    ],
    timestamp: new Date().toISOString()
  }
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    const urlPath = url.replace('/api/analytics', '') || '/';
    
    if (urlPath === '/summary' && method === 'GET') {
      const days = parseInt(req.query?.days) || 30;
      const mockData = getMockAnalytics();
      
      res.status(200).json({
        success: true,
        data: mockData.summary
      });
      
    } else if (urlPath === '/realtime' && method === 'GET') {
      const mockData = getMockAnalytics();
      
      res.status(200).json({
        success: true,
        data: mockData.realtime
      });
      
    } else if (urlPath === '/track' && method === 'POST') {
      const { event, properties = {} } = req.body;
      
      if (!event) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Event name is required'
          }
        });
      }

      // In a real implementation, you would store this data
      console.log('Analytics event tracked:', { event, properties });
      
      res.status(200).json({
        success: true,
        message: 'Event tracked successfully'
      });
      
    } else if (urlPath === '/pageview' && method === 'POST') {
      const { path: pagePath, title, referrer } = req.body;
      
      if (!pagePath) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Page path is required'
          }
        });
      }

      // In a real implementation, you would store this data
      console.log('Page view tracked:', { pagePath, title, referrer });
      
      res.status(200).json({
        success: true,
        message: 'Page view tracked successfully'
      });
      
    } else {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Analytics endpoint not found'
        }
      });
    }
    
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process analytics request'
      }
    });
  }
};