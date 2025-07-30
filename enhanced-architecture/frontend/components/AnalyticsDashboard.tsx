import React, { useState, useEffect } from 'react';
import { ProjectAnalytics } from '../../types';

interface AnalyticsDashboardProps {
  projectId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  className?: string;
}

interface SiteAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number }>;
  topProjects: Array<{ projectId: string; views: number }>;
  conversionRate: number;
}

interface RealtimeAnalytics {
  activeUsers: number;
  currentPageViews: Array<{ page: string; count: number }>;
  recentEvents: Array<{
    type: string;
    timestamp: Date;
    properties: Record<string, any>;
  }>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  timeRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  },
  className = ""
}) => {
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics | null>(null);
  const [siteAnalytics, setSiteAnalytics] = useState<SiteAnalytics | null>(null);
  const [realtimeAnalytics, setRealtimeAnalytics] = useState<RealtimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'realtime' | 'project'>('overview');

  useEffect(() => {
    fetchAnalytics();
    
    // Set up real-time updates
    const interval = setInterval(fetchRealtimeAnalytics, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [projectId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = [];

      // Fetch site analytics
      promises.push(
        fetch(`/api/analytics/site?startDate=${timeRange.start.toISOString()}&endDate=${timeRange.end.toISOString()}`)
          .then(res => res.json())
          .then(data => setSiteAnalytics(data))
      );

      // Fetch project analytics if projectId is provided
      if (projectId) {
        promises.push(
          fetch(`/api/analytics/projects/${projectId}?startDate=${timeRange.start.toISOString()}&endDate=${timeRange.end.toISOString()}`)
            .then(res => res.json())
            .then(data => setProjectAnalytics(data))
        );
      }

      // Fetch real-time analytics
      promises.push(fetchRealtimeAnalytics());

      await Promise.all(promises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      const data = await response.json();
      setRealtimeAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch real-time analytics:', err);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-red-600">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Error Loading Analytics</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('realtime')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === 'realtime'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Real-time
            </button>
            {projectId && (
              <button
                onClick={() => setActiveTab('project')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'project'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Project
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && siteAnalytics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Views</p>
                    <p className="text-2xl font-bold">{formatNumber(siteAnalytics.totalViews)}</p>
                  </div>
                  <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Unique Visitors</p>
                    <p className="text-2xl font-bold">{formatNumber(siteAnalytics.uniqueVisitors)}</p>
                  </div>
                  <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Avg. Session</p>
                    <p className="text-2xl font-bold">{formatDuration(siteAnalytics.averageSessionDuration)}</p>
                  </div>
                  <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Bounce Rate</p>
                    <p className="text-2xl font-bold">{formatPercentage(siteAnalytics.bounceRate)}</p>
                  </div>
                  <svg className="w-8 h-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Top Pages and Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pages</h3>
                <div className="space-y-3">
                  {siteAnalytics.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-900 truncate">{page.page}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{formatNumber(page.views)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Projects</h3>
                <div className="space-y-3">
                  {siteAnalytics.topProjects.map((project, index) => (
                    <div key={project.projectId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-900 truncate">{project.projectId}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{formatNumber(project.views)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Tab */}
        {activeTab === 'realtime' && realtimeAnalytics && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Real-time Activity</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Users</p>
                  <p className="text-3xl font-bold">{realtimeAnalytics.activeUsers}</p>
                </div>
                <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            {/* Current Page Views */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Current Page Views</h4>
              <div className="space-y-2">
                {realtimeAnalytics.currentPageViews.map((pageView, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-900">{pageView.page}</span>
                    <span className="text-sm font-medium text-gray-600">{pageView.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Recent Events</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {realtimeAnalytics.recentEvents.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3 py-2">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{event.type}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {Object.keys(event.properties).length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          {JSON.stringify(event.properties, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Project Tab */}
        {activeTab === 'project' && projectAnalytics && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Project Analytics</h3>
            
            {/* Daily Views Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Daily Views</h4>
              <div className="h-64 flex items-end space-x-2">
                {projectAnalytics.dailyViews.map((data, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-t flex-1 min-h-[4px]"
                    style={{
                      height: `${Math.max((data.value / Math.max(...projectAnalytics.dailyViews.map(d => d.value))) * 100, 4)}%`
                    }}
                    title={`${data.date.toLocaleDateString()}: ${data.value} views`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Additional project-specific metrics would go here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;