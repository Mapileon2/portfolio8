import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Settings, 
  FileText, 
  Image, 
  Users, 
  MessageSquare, 
  Eye, 
  Edit3, 
  Save, 
  Upload,
  Download,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import firebaseClient from '../services/firebase';
import EnhancedCaseStudyCreator from './EnhancedCaseStudyCreator';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    analytics: null,
    recentActivity: [],
    systemHealth: null,
    realTimeData: {},
    frontendConnected: false
  });
  const [livePreview, setLivePreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');

  // Content management states
  const [caseStudies, setCaseStudies] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [sections, setSections] = useState({});
  const [projects, setProjects] = useState([]);
  
  // Case Study Creator states
  const [showCaseStudyCreator, setShowCaseStudyCreator] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState(null);

  useEffect(() => {
    loadDashboardData();
    setupRealTimeUpdates();
    testFrontendConnection();
  }, []);

  const setupRealTimeUpdates = () => {
    const interval = setInterval(async () => {
      try {
        const realTimeRes = await fetch('/api/analytics/realtime');
        const realTimeData = await realTimeRes.json();
        
        setDashboardData(prev => ({
          ...prev,
          realTimeData: realTimeData.data || {}
        }));
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  };

  const testFrontendConnection = async () => {
    try {
      const response = await fetch('/frontend/case-study.html');
      setDashboardData(prev => ({
        ...prev,
        frontendConnected: response.ok
      }));
    } catch (error) {
      console.error('Frontend connection test failed:', error);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, caseStudiesRes, carouselRes, sectionsRes] = await Promise.all([
        fetch('/api/analytics/summary?days=30'),
        firebaseClient.getCaseStudies(),
        firebaseClient.getCarouselImages(),
        firebaseClient.getSections()
      ]);

      const analytics = await analyticsRes.json();
      
      setDashboardData(prev => ({
        ...prev,
        analytics,
        systemHealth: { status: 'healthy', uptime: '99.9%' }
      }));

      setCaseStudies(caseStudiesRes.caseStudies || []);
      setCarouselImages(carouselRes.images || []);
      setSections(sectionsRes || {});

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLogout = async () => {
    try {
      await firebaseClient.signOut();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.analytics?.totalEvents?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Case Studies</p>
              <p className="text-2xl font-bold text-gray-900">{caseStudies.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Images</p>
              <p className="text-2xl font-bold text-gray-900">{carouselImages.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Visitors</p>
              <p className="text-2xl font-bold text-blue-600">
                {dashboardData.realTimeData?.activeVisitors || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${dashboardData.frontendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={dashboardData.frontendConnected ? 'text-green-600' : 'text-red-600'}>
              {dashboardData.frontendConnected ? 'Frontend Connected' : 'Frontend Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={previewDevice}
                  onChange={(e) => setPreviewDevice(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                  <option value="mobile">Mobile</option>
                </select>
                <button
                  onClick={() => setLivePreview(!livePreview)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    livePreview 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {livePreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {livePreview ? (
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src="/frontend/case-study.html"
                  className={`w-full border-0 ${
                    previewDevice === 'mobile' ? 'h-96 max-w-sm mx-auto' :
                    previewDevice === 'tablet' ? 'h-96 max-w-2xl mx-auto' :
                    'h-96'
                  }`}
                  title="Frontend Preview"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Click "Show Preview" to see your frontend live</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('case-studies')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Case Study</p>
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Upload Image</p>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">View Analytics</p>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Settings</p>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );

  const renderCaseStudiesManager = () => (
    <CaseStudiesManager 
      caseStudies={caseStudies}
      setCaseStudies={setCaseStudies}
      showNotification={showNotification}
    />
  );

  const renderMediaManager = () => (
    <MediaManager 
      images={carouselImages}
      setImages={setCarouselImages}
      showNotification={showNotification}
    />
  );

  const renderAnalytics = () => (
    <AnalyticsPanel 
      analytics={dashboardData.analytics}
      showNotification={showNotification}
    />
  );

  const renderSettings = () => (
    <SettingsPanel 
      sections={sections}
      setSections={setSections}
      showNotification={showNotification}
    />
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'case-studies', label: 'Case Studies', icon: FileText },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500' : 
          notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
        } text-white`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
             notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
             <AlertCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Portfolio Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            
            {!loading && (
              <>
                {activeTab === 'dashboard' && renderDashboardOverview()}
                {activeTab === 'case-studies' && renderCaseStudiesManager()}
                {activeTab === 'media' && renderMediaManager()}
                {activeTab === 'analytics' && renderAnalytics()}
                {activeTab === 'settings' && renderSettings()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Case Study Creator */}
      <EnhancedCaseStudyCreator
        isOpen={showCaseStudyCreator}
        onClose={() => {
          setShowCaseStudyCreator(false);
          setEditingCaseStudy(null);
        }}
        onSave={handleSaveCaseStudy}
        editingStudy={editingCaseStudy}
      />
    </div>
  );
};

// Case Studies Manager Component
const CaseStudiesManager = ({ caseStudies, setCaseStudies, showNotification }) => {

  const handleSaveCaseStudy = async (studyData) => {
    try {
      let result;
      if (editingCaseStudy) {
        // Update existing case study
        result = await firebaseClient.updateCaseStudy(editingCaseStudy.id, studyData);
        setCaseStudies(prev => prev.map(study => 
          study.id === editingCaseStudy.id ? { ...study, ...studyData } : study
        ));
        await triggerFrontendUpdate('case-studies', 'update', { id: editingCaseStudy.id, ...studyData });
        showNotification('Case study updated and frontend synced successfully', 'success');
      } else {
        // Create new case study
        result = await firebaseClient.createCaseStudy(studyData);
        setCaseStudies(prev => [result, ...prev]);
        await triggerFrontendUpdate('case-studies', 'create', result);
        showNotification('Case study created and frontend updated successfully', 'success');
      }
      
      setShowCaseStudyCreator(false);
      setEditingCaseStudy(null);
    } catch (error) {
      console.error('Error saving case study:', error);
      showNotification('Error saving case study', 'error');
    }
  };

  const triggerFrontendUpdate = async (type, action, data) => {
    try {
      await fetch('/api/frontend/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action, data, timestamp: Date.now() })
      });
    } catch (error) {
      console.warn('Frontend update failed:', error);
    }
  };

  const handleEditCaseStudy = (study) => {
    setEditingCaseStudy(study);
    setShowCaseStudyCreator(true);
  };

  const handleCreateNewCaseStudy = () => {
    setEditingCaseStudy(null);
    setShowCaseStudyCreator(true);
  };

  const handleDeleteCaseStudy = async (id) => {
    if (!confirm('Are you sure you want to delete this case study?')) return;
    
    try {
      await firebaseClient.deleteCaseStudy(id);
      setCaseStudies(prev => prev.filter(study => study.id !== id));
      await triggerFrontendUpdate('case-studies', 'delete', { id });
      showNotification('Case study deleted and frontend updated successfully', 'success');
    } catch (error) {
      console.error('Error deleting case study:', error);
      showNotification('Error deleting case study', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Case Studies</h2>
        <button
          onClick={handleCreateNewCaseStudy}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Case Study</span>
        </button>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseStudies.map((study) => (
          <div key={study.id} className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {study.projectTitle}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {study.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {new Date(study.createdAt).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditCaseStudy(study)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCaseStudy(study.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};



// Media Manager Component
const MediaManager = ({ images, setImages, showNotification }) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const result = await firebaseClient.uploadImage(file, {
        type: 'carousel',
        folder: 'portfolio/carousel'
      });

      const newImage = await firebaseClient.addCarouselImage({
        url: result.image.url,
        publicId: result.image.publicId,
        caption: '',
        thumbnail: result.image.thumbnail
      });

      setImages(prev => [newImage, ...prev]);
      showNotification('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification('Error uploading image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (imageId, publicId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await firebaseClient.deleteCarouselImage(imageId);
      if (publicId) {
        await firebaseClient.deleteImage(publicId);
      }
      setImages(prev => prev.filter(img => img.id !== imageId));
      showNotification('Image deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting image:', error);
      showNotification('Error deleting image', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center space-x-2">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <div key={image.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={image.thumbnail || image.url}
                alt={image.caption}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-2 truncate">
                {image.caption || 'No caption'}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {new Date(image.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleImageDelete(image.id, image.publicId)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Analytics Panel Component
const AnalyticsPanel = ({ analytics, showNotification }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Views</h3>
          <div className="space-y-2">
            {analytics?.topPages?.map((page, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{page.page}</span>
                <span className="text-sm font-medium text-gray-900">{page.views}</span>
              </div>
            )) || <p className="text-gray-500">No data available</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Projects</h3>
          <div className="space-y-2">
            {analytics?.topProjects?.map((project, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{project.projectId}</span>
                <span className="text-sm font-medium text-gray-900">{project.views}</span>
              </div>
            )) || <p className="text-gray-500">No data available</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Stats</h3>
          <div className="space-y-2">
            {analytics?.browserStats?.map((browser, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{browser.browser}</span>
                <span className="text-sm font-medium text-gray-900">{browser.count}</span>
              </div>
            )) || <p className="text-gray-500">No data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component
const SettingsPanel = ({ sections, setSections, showNotification }) => {
  const [editingSections, setEditingSections] = useState(sections);

  const handleSave = async () => {
    try {
      await firebaseClient.updateSections(editingSections);
      setSections(editingSections);
      showNotification('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Error saving settings', 'error');
    }
  };

  const handleSectionChange = (sectionKey, field, value) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(editingSections).map(([sectionKey, section]) => (
          <div key={sectionKey} className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            
            {typeof section === 'object' && section !== null ? (
              <div className="space-y-4">
                {Object.entries(section).map(([field, value]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {typeof value === 'string' && value.length > 100 ? (
                      <textarea
                        value={value}
                        onChange={(e) => handleSectionChange(sectionKey, field, e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleSectionChange(sectionKey, field, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={section || ''}
                onChange={(e) => setEditingSections(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;