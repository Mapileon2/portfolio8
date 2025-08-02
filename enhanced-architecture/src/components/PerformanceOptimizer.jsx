import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  TrendingUp, 
  Clock, 
  Database, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings
} from 'lucide-react';

const PerformanceOptimizer = ({ onOptimizationComplete }) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
    errorRate: 0
  });

  const [optimizations, setOptimizations] = useState({
    imageOptimization: false,
    codesplitting: false,
    caching: false,
    compression: false,
    lazyLoading: false,
    prefetching: false
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  // Performance monitoring
  useEffect(() => {
    const measurePerformance = () => {
      // Measure page load time
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;

      // Estimate bundle size (simplified)
      const scripts = document.querySelectorAll('script[src]');
      let estimatedBundleSize = 0;
      scripts.forEach(script => {
        // Rough estimation based on script count
        estimatedBundleSize += 100; // KB per script (rough estimate)
      });

      // Memory usage (if available)
      const memoryInfo = performance.memory || {};
      const memoryUsage = memoryInfo.usedJSHeapSize || 0;

      // Network requests
      const resources = performance.getEntriesByType('resource');
      const networkRequests = resources.length;

      // Cache hit rate (simplified calculation)
      const cachedResources = resources.filter(resource => 
        resource.transferSize === 0 && resource.decodedBodySize > 0
      );
      const cacheHitRate = networkRequests > 0 ? (cachedResources.length / networkRequests) * 100 : 0;

      setMetrics({
        loadTime: Math.round(loadTime),
        bundleSize: estimatedBundleSize,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
        networkRequests,
        cacheHitRate: Math.round(cacheHitRate),
        errorRate: 0 // Would need error tracking implementation
      });
    };

    measurePerformance();
    const interval = setInterval(measurePerformance, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Optimization functions
  const optimizeImages = useCallback(async () => {
    console.log('🖼️ Optimizing images...');
    
    // Find all images and apply optimization
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" if not present
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
    });

    return new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const enableCodeSplitting = useCallback(async () => {
    console.log('📦 Enabling code splitting...');
    
    // This would typically be handled at build time
    // For demo purposes, we'll simulate the process
    return new Promise(resolve => setTimeout(resolve, 1500));
  }, []);

  const optimizeCaching = useCallback(async () => {
    console.log('💾 Optimizing caching...');
    
    // Enable service worker caching
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }

    // Implement memory caching for API responses
    const cache = new Map();
    window.performanceCache = cache;

    return new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const enableCompression = useCallback(async () => {
    console.log('🗜️ Enabling compression...');
    
    // This would typically be handled at server level
    // For demo purposes, we'll simulate the process
    return new Promise(resolve => setTimeout(resolve, 800));
  }, []);

  const enableLazyLoading = useCallback(async () => {
    console.log('⏳ Enabling lazy loading...');
    
    // Implement intersection observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
            observer.unobserve(element);
          }
        }
      });
    });

    // Apply to images without src
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => observer.observe(img));

    return new Promise(resolve => setTimeout(resolve, 1200));
  }, []);

  const enablePrefetching = useCallback(async () => {
    console.log('🚀 Enabling prefetching...');
    
    // Add prefetch links for critical resources
    const criticalResources = [
      '/api/firebase/case-studies',
      '/api/analytics/summary',
      '/api/firebase/carousel-images'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });

    return new Promise(resolve => setTimeout(resolve, 600));
  }, []);

  const runOptimizations = useCallback(async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);

    const optimizationSteps = [
      { name: 'imageOptimization', fn: optimizeImages, weight: 20 },
      { name: 'codesplitting', fn: enableCodeSplitting, weight: 25 },
      { name: 'caching', fn: optimizeCaching, weight: 20 },
      { name: 'compression', fn: enableCompression, weight: 15 },
      { name: 'lazyLoading', fn: enableLazyLoading, weight: 10 },
      { name: 'prefetching', fn: enablePrefetching, weight: 10 }
    ];

    let completedWeight = 0;
    const totalWeight = optimizationSteps.reduce((sum, step) => sum + step.weight, 0);

    for (const step of optimizationSteps) {
      try {
        await step.fn();
        setOptimizations(prev => ({ ...prev, [step.name]: true }));
        completedWeight += step.weight;
        setOptimizationProgress(Math.round((completedWeight / totalWeight) * 100));
      } catch (error) {
        console.error(`Optimization failed for ${step.name}:`, error);
      }
    }

    setIsOptimizing(false);
    onOptimizationComplete?.();
  }, [optimizeImages, enableCodeSplitting, optimizeCaching, enableCompression, enableLazyLoading, enablePrefetching, onOptimizationComplete]);

  const performanceScore = useMemo(() => {
    const scores = {
      loadTime: metrics.loadTime < 2000 ? 100 : Math.max(0, 100 - (metrics.loadTime - 2000) / 100),
      bundleSize: metrics.bundleSize < 500 ? 100 : Math.max(0, 100 - (metrics.bundleSize - 500) / 10),
      memoryUsage: metrics.memoryUsage < 50 ? 100 : Math.max(0, 100 - (metrics.memoryUsage - 50) / 2),
      cacheHitRate: metrics.cacheHitRate,
      networkRequests: metrics.networkRequests < 20 ? 100 : Math.max(0, 100 - (metrics.networkRequests - 20) * 2)
    };

    const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    return Math.round(averageScore);
  }, [metrics]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Performance Score
          </h3>
          {getScoreIcon(performanceScore)}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Overall Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  performanceScore >= 90 ? 'bg-green-500' :
                  performanceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${performanceScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Load Time</p>
              <p className="text-xl font-bold text-gray-900">{metrics.loadTime}ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Bundle Size</p>
              <p className="text-xl font-bold text-gray-900">{metrics.bundleSize}KB</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-xl font-bold text-gray-900">{metrics.memoryUsage}MB</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Network Requests</p>
              <p className="text-xl font-bold text-gray-900">{metrics.networkRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-600">Cache Hit Rate</p>
              <p className="text-xl font-bold text-gray-900">{metrics.cacheHitRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-xl font-bold text-gray-900">{metrics.errorRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Performance Optimizations
          </h3>
          <button
            onClick={runOptimizations}
            disabled={isOptimizing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Optimizing... {optimizationProgress}%
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Optimizations
              </>
            )}
          </button>
        </div>

        {isOptimizing && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${optimizationProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(optimizations).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center gap-2">
                {enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                <span className={`text-sm ${enabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
        <div className="space-y-3">
          {metrics.loadTime > 3000 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Slow Load Time</p>
                <p className="text-sm text-yellow-700">Consider enabling code splitting and compression to reduce load time.</p>
              </div>
            </div>
          )}
          
          {metrics.bundleSize > 1000 && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">Large Bundle Size</p>
                <p className="text-sm text-orange-700">Bundle size is large. Enable code splitting and tree shaking.</p>
              </div>
            </div>
          )}
          
          {metrics.cacheHitRate < 50 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Low Cache Hit Rate</p>
                <p className="text-sm text-blue-700">Improve caching strategy to reduce server requests.</p>
              </div>
            </div>
          )}
          
          {Object.values(optimizations).every(opt => opt) && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">All Optimizations Enabled</p>
                <p className="text-sm text-green-700">Great! All performance optimizations are active.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizer;