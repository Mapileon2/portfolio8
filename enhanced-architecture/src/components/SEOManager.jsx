import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  Image, 
  FileText, 
  Link, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Eye,
  Save,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const SEOManager = () => {
  const [seoData, setSeoData] = useState({
    metaTags: {
      title: '',
      description: '',
      keywords: '',
      author: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: ''
    },
    structuredData: {
      type: 'Person',
      name: '',
      jobTitle: '',
      url: '',
      sameAs: [],
      image: '',
      description: ''
    },
    sitemap: {
      lastGenerated: null,
      urls: []
    },
    robotsTxt: '',
    analytics: {
      googleAnalyticsId: '',
      googleSearchConsole: '',
      bingWebmaster: ''
    }
  });

  const [activeTab, setActiveTab] = useState('meta');
  const [loading, setLoading] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [seoIssues, setSeoIssues] = useState([]);

  useEffect(() => {
    loadSEOData();
  }, []);

  useEffect(() => {
    calculateSEOScore();
  }, [seoData]);

  const loadSEOData = async () => {
    setLoading(true);
    try {
      // Load SEO data from Firebase
      const response = await fetch('/api/firebase/sections');
      const sections = await response.json();
      
      if (sections.seo) {
        setSeoData(prev => ({ ...prev, ...sections.seo }));
      }
    } catch (error) {
      console.error('Error loading SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSEOData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/firebase/sections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseClient.getIdToken()}`
        },
        body: JSON.stringify({ seo: seoData })
      });

      if (response.ok) {
        alert('SEO settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving SEO data:', error);
      alert('Error saving SEO settings');
    } finally {
      setLoading(false);
    }
  };

  const calculateSEOScore = () => {
    let score = 0;
    const issues = [];

    // Meta tags scoring
    if (seoData.metaTags.title) {
      score += 15;
      if (seoData.metaTags.title.length >= 30 && seoData.metaTags.title.length <= 60) {
        score += 5;
      } else {
        issues.push({
          type: 'warning',
          message: 'Title should be between 30-60 characters',
          category: 'Meta Tags'
        });
      }
    } else {
      issues.push({
        type: 'error',
        message: 'Missing page title',
        category: 'Meta Tags'
      });
    }

    if (seoData.metaTags.description) {
      score += 15;
      if (seoData.metaTags.description.length >= 120 && seoData.metaTags.description.length <= 160) {
        score += 5;
      } else {
        issues.push({
          type: 'warning',
          message: 'Meta description should be between 120-160 characters',
          category: 'Meta Tags'
        });
      }
    } else {
      issues.push({
        type: 'error',
        message: 'Missing meta description',
        category: 'Meta Tags'
      });
    }

    if (seoData.metaTags.keywords) score += 10;

    // Open Graph scoring
    if (seoData.metaTags.ogTitle) score += 10;
    if (seoData.metaTags.ogDescription) score += 10;
    if (seoData.metaTags.ogImage) score += 10;

    // Twitter Card scoring
    if (seoData.metaTags.twitterTitle) score += 5;
    if (seoData.metaTags.twitterDescription) score += 5;
    if (seoData.metaTags.twitterImage) score += 5;

    // Structured Data scoring
    if (seoData.structuredData.name) score += 10;
    if (seoData.structuredData.jobTitle) score += 5;
    if (seoData.structuredData.url) score += 5;

    // Analytics scoring
    if (seoData.analytics.googleAnalyticsId) score += 5;

    setSeoScore(Math.min(score, 100));
    setSeoIssues(issues);
  };

  const generateSitemap = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seo/generate-sitemap', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await firebaseClient.getIdToken()}`
        }
      });

      if (response.ok) {
        const sitemap = await response.json();
        setSeoData(prev => ({
          ...prev,
          sitemap: {
            lastGenerated: new Date().toISOString(),
            urls: sitemap.urls
          }
        }));
        alert('Sitemap generated successfully!');
      }
    } catch (error) {
      console.error('Error generating sitemap:', error);
      alert('Error generating sitemap');
    } finally {
      setLoading(false);
    }
  };

  const previewSEO = () => {
    const preview = {
      title: seoData.metaTags.title,
      description: seoData.metaTags.description,
      url: window.location.origin
    };

    // Open preview in new window
    const previewWindow = window.open('', '_blank', 'width=600,height=400');
    previewWindow.document.write(`
      <html>
        <head>
          <title>SEO Preview</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .preview { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .title { color: #1a0dab; font-size: 18px; text-decoration: none; }
            .url { color: #006621; font-size: 14px; }
            .description { color: #545454; font-size: 13px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h2>Google Search Preview</h2>
          <div class="preview">
            <a href="#" class="title">${preview.title}</a>
            <div class="url">${preview.url}</div>
            <div class="description">${preview.description}</div>
          </div>
        </body>
      </html>
    `);
  };

  const handleMetaChange = (field, value) => {
    setSeoData(prev => ({
      ...prev,
      metaTags: {
        ...prev.metaTags,
        [field]: value
      }
    }));
  };

  const handleStructuredDataChange = (field, value) => {
    setSeoData(prev => ({
      ...prev,
      structuredData: {
        ...prev.structuredData,
        [field]: value
      }
    }));
  };

  const handleAnalyticsChange = (field, value) => {
    setSeoData(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'meta', label: 'Meta Tags', icon: FileText },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'structured', label: 'Structured Data', icon: Search },
    { id: 'sitemap', label: 'Sitemap', icon: Link },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SEO Manager</h2>
          <p className="text-gray-600">Optimize your portfolio for search engines</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={previewSEO}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          <button
            onClick={saveSEOData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* SEO Score */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SEO Score</h3>
          <div className="flex items-center space-x-2">
            <div className={`text-2xl font-bold ${
              seoScore >= 80 ? 'text-green-600' : 
              seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {seoScore}/100
            </div>
            <div className={`w-4 h-4 ${
              seoScore >= 80 ? 'text-green-600' : 
              seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {seoScore >= 80 ? <CheckCircle /> : <AlertCircle />}
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              seoScore >= 80 ? 'bg-green-600' : 
              seoScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${seoScore}%` }}
          ></div>
        </div>

        {seoIssues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Issues to Fix:</h4>
            {seoIssues.map((issue, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertCircle className={`w-4 h-4 mt-0.5 ${
                  issue.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <div>
                  <span className="text-sm font-medium text-gray-700">{issue.category}:</span>
                  <span className="text-sm text-gray-600 ml-1">{issue.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Meta Tags Tab */}
          {activeTab === 'meta' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Title
                </label>
                <input
                  type="text"
                  value={seoData.metaTags.title}
                  onChange={(e) => handleMetaChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Portfolio - Full Stack Developer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {seoData.metaTags.title.length}/60 characters (optimal: 30-60)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={seoData.metaTags.description}
                  onChange={(e) => handleMetaChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Experienced full-stack developer specializing in React, Node.js, and modern web technologies. View my portfolio and get in touch."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {seoData.metaTags.description.length}/160 characters (optimal: 120-160)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={seoData.metaTags.keywords}
                  onChange={(e) => handleMetaChange('keywords', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="full stack developer, react, node.js, javascript, portfolio"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate keywords with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={seoData.metaTags.author}
                  onChange={(e) => handleMetaChange('author', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Name"
                />
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Open Graph (Facebook)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Title
                    </label>
                    <input
                      type="text"
                      value={seoData.metaTags.ogTitle}
                      onChange={(e) => handleMetaChange('ogTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Description
                    </label>
                    <textarea
                      value={seoData.metaTags.ogDescription}
                      onChange={(e) => handleMetaChange('ogDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Image URL
                    </label>
                    <input
                      type="url"
                      value={seoData.metaTags.ogImage}
                      onChange={(e) => handleMetaChange('ogImage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yoursite.com/og-image.jpg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Twitter Card</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Type
                    </label>
                    <select
                      value={seoData.metaTags.twitterCard}
                      onChange={(e) => handleMetaChange('twitterCard', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="summary">Summary</option>
                      <option value="summary_large_image">Summary Large Image</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Title
                    </label>
                    <input
                      type="text"
                      value={seoData.metaTags.twitterTitle}
                      onChange={(e) => handleMetaChange('twitterTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Description
                    </label>
                    <textarea
                      value={seoData.metaTags.twitterDescription}
                      onChange={(e) => handleMetaChange('twitterDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Structured Data Tab */}
          {activeTab === 'structured' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Person Schema</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={seoData.structuredData.name}
                      onChange={(e) => handleStructuredDataChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={seoData.structuredData.jobTitle}
                      onChange={(e) => handleStructuredDataChange('jobTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Full Stack Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={seoData.structuredData.url}
                      onChange={(e) => handleStructuredDataChange('url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sitemap Tab */}
          {activeTab === 'sitemap' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">XML Sitemap</h3>
                <button
                  onClick={generateSitemap}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Generate Sitemap</span>
                </button>
              </div>

              {seoData.sitemap.lastGenerated && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Last generated: {new Date(seoData.sitemap.lastGenerated).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {seoData.sitemap.urls.length} URLs included
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Sitemap URLs:</h4>
                {seoData.sitemap.urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{url}</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={seoData.analytics.googleAnalyticsId}
                  onChange={(e) => handleAnalyticsChange('googleAnalyticsId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GA-XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Search Console
                </label>
                <input
                  type="text"
                  value={seoData.analytics.googleSearchConsole}
                  onChange={(e) => handleAnalyticsChange('googleSearchConsole', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Verification code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bing Webmaster Tools
                </label>
                <input
                  type="text"
                  value={seoData.analytics.bingWebmaster}
                  onChange={(e) => handleAnalyticsChange('bingWebmaster', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Verification code"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SEOManager;