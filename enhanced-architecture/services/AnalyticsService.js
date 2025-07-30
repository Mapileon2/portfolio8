const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');

class AnalyticsService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.dataFile = path.join(__dirname, '../data/analytics.json');
    this.events = [];
    this.pageViews = new Map();
    this.visitors = new Set();
    
    this.loadData();
    this.startPeriodicSave();
  }

  async loadData() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      const parsed = JSON.parse(data);
      this.events = parsed.events || [];
      this.pageViews = new Map(parsed.pageViews || []);
      this.visitors = new Set(parsed.visitors || []);
    } catch (error) {
      console.log('No existing analytics data found, starting fresh');
      await this.ensureDataDirectory();
    }
  }

  async ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  async saveData() {
    try {
      await this.ensureDataDirectory();
      const data = {
        events: this.events.slice(-1000), // Keep last 1000 events
        pageViews: Array.from(this.pageViews.entries()),
        visitors: Array.from(this.visitors),
        lastSaved: new Date().toISOString()
      };
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  startPeriodicSave() {
    // Save data every 5 minutes
    setInterval(() => {
      this.saveData();
    }, 5 * 60 * 1000);
  }

  trackEvent(type, properties = {}, context = {}) {
    const event = {
      id: this.generateId(),
      type,
      properties,
      context,
      timestamp: new Date().toISOString(),
      ip: context.ip,
      userAgent: context.userAgent
    };

    this.events.push(event);
    
    // Track unique visitors
    if (context.ip) {
      this.visitors.add(context.ip);
    }

    // Track page views
    if (type === 'page_view' && properties.page) {
      const current = this.pageViews.get(properties.page) || 0;
      this.pageViews.set(properties.page, current + 1);
    }

    // Clear cache for real-time data
    this.cache.del('analytics_summary');
    this.cache.del('popular_pages');
    
    console.log(`📊 Analytics: ${type} tracked`);
  }

  trackPageView(page, context = {}) {
    this.trackEvent('page_view', { page }, context);
  }

  trackProjectView(projectId, context = {}) {
    this.trackEvent('project_view', { projectId }, context);
  }

  getAnalyticsSummary(days = 30) {
    const cacheKey = `analytics_summary_${days}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEvents = this.events.filter(event => 
      new Date(event.timestamp) > cutoffDate
    );

    const summary = {
      totalEvents: recentEvents.length,
      uniqueVisitors: new Set(recentEvents.map(e => e.context?.ip).filter(Boolean)).size,
      pageViews: recentEvents.filter(e => e.type === 'page_view').length,
      projectViews: recentEvents.filter(e => e.type === 'project_view').length,
      topPages: this.getTopPages(recentEvents),
      topProjects: this.getTopProjects(recentEvents),
      dailyStats: this.getDailyStats(recentEvents),
      browserStats: this.getBrowserStats(recentEvents)
    };

    this.cache.set(cacheKey, summary);
    return summary;
  }

  getTopPages(events = null, limit = 10) {
    const pageViewEvents = (events || this.events).filter(e => e.type === 'page_view');
    const pageCounts = {};
    
    pageViewEvents.forEach(event => {
      const page = event.properties?.page || 'unknown';
      pageCounts[page] = (pageCounts[page] || 0) + 1;
    });

    return Object.entries(pageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([page, views]) => ({ page, views }));
  }

  getTopProjects(events = null, limit = 10) {
    const projectEvents = (events || this.events).filter(e => e.type === 'project_view');
    const projectCounts = {};
    
    projectEvents.forEach(event => {
      const projectId = event.properties?.projectId || 'unknown';
      projectCounts[projectId] = (projectCounts[projectId] || 0) + 1;
    });

    return Object.entries(projectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([projectId, views]) => ({ projectId, views }));
  }

  getDailyStats(events = null, days = 7) {
    const recentEvents = events || this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return eventDate > cutoff;
    });

    const dailyStats = {};
    
    recentEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, events: 0, pageViews: 0, uniqueVisitors: new Set() };
      }
      
      dailyStats[date].events++;
      if (event.type === 'page_view') {
        dailyStats[date].pageViews++;
      }
      if (event.context?.ip) {
        dailyStats[date].uniqueVisitors.add(event.context.ip);
      }
    });

    return Object.values(dailyStats).map(day => ({
      ...day,
      uniqueVisitors: day.uniqueVisitors.size
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getBrowserStats(events = null) {
    const allEvents = events || this.events;
    const browserCounts = {};
    
    allEvents.forEach(event => {
      const userAgent = event.context?.userAgent || '';
      const browser = this.parseBrowser(userAgent);
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });

    return Object.entries(browserCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([browser, count]) => ({ browser, count }));
  }

  parseBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Other';
  }

  getRealtimeStats() {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const recentEvents = this.events.filter(event => 
      new Date(event.timestamp) > fiveMinutesAgo
    );

    return {
      activeUsers: new Set(recentEvents.map(e => e.context?.ip).filter(Boolean)).size,
      recentEvents: recentEvents.slice(-20).reverse(),
      currentPageViews: this.getTopPages(recentEvents, 5)
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Cleanup old data
  cleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.events = this.events.filter(event => 
      new Date(event.timestamp) > thirtyDaysAgo
    );
    
    this.saveData();
    console.log('📊 Analytics data cleaned up');
  }
}

module.exports = AnalyticsService;