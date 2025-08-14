import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Settings, 
  User, 
  Shield, 
  Smartphone,
  Monitor,
  Chrome,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  Eye,
  Code
} from 'lucide-react';
import ModernGoogleSignIn from './ModernGoogleSignIn';
import modernGoogleAuthService from '../services/modern-google-auth';

const GoogleSignInDemo = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [demoStats, setDemoStats] = useState({
    signInAttempts: 0,
    successfulSignIns: 0,
    errorCount: 0,
    averageSignInTime: 0
  });

  useEffect(() => {
    // Get service status
    const status = modernGoogleAuthService.getServiceStatus();
    setServiceStatus(status);

    // Check for existing user
    const user = modernGoogleAuthService.getCurrentUser();
    setCurrentUser(user);

    // Listen for auth changes
    const unsubscribe = modernGoogleAuthService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setDemoStats(prev => ({
          ...prev,
          successfulSignIns: prev.successfulSignIns + 1
        }));
      }
    });

    return unsubscribe;
  }, []);

  const handleSignInSuccess = (user) => {
    setCurrentUser(user);
    setShowSignIn(false);
    console.log('✅ Demo: User signed in successfully', user);
  };

  const handleSignOut = async () => {
    try {
      await modernGoogleAuthService.signOut();
      setCurrentUser(null);
      console.log('✅ Demo: User signed out successfully');
    } catch (error) {
      console.error('Demo: Sign out error', error);
    }
  };

  const handleShowSignIn = () => {
    setShowSignIn(true);
    setDemoStats(prev => ({
      ...prev,
      signInAttempts: prev.signInAttempts + 1
    }));
  };

  const getDeviceIcon = () => {
    if (serviceStatus?.deviceInfo?.isMobile) return <Smartphone className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getBrowserIcon = () => {
    const browser = serviceStatus?.deviceInfo?.browser;
    if (browser === 'Chrome') return <Chrome className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Modern Google Sign-In Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience our enhanced Google authentication system with modern UX patterns, 
            comprehensive error handling, and production-ready features.
          </p>
        </div>

        {/* Current User Status */}
        {currentUser ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-green-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full border-4 border-green-200"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
                  <p className="text-gray-600">{currentUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      {currentUser.role || 'Admin'}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {currentUser.provider}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Authentication Status</span>
                </div>
                <p className="text-sm text-gray-600">Successfully authenticated</p>
                <p className="text-xs text-gray-500 mt-1">
                  Session ID: {currentUser.sessionId?.slice(-8)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Permissions</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(currentUser.permissions || ['read', 'write']).map(permission => (
                    <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getDeviceIcon()}
                  <span className="font-medium">Device Info</span>
                </div>
                <p className="text-sm text-gray-600">
                  {serviceStatus?.deviceInfo?.browser} on {serviceStatus?.deviceInfo?.platform}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {serviceStatus?.deviceInfo?.isMobile ? 'Mobile' : 'Desktop'} • {serviceStatus?.deviceInfo?.language}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Signed In</h2>
              <p className="text-gray-600 mb-6">
                Click the button below to experience our modern Google Sign-In flow
              </p>
              <button
                onClick={handleShowSignIn}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
              >
                <Play className="w-5 h-5" />
                <span>Try Google Sign-In</span>
              </button>
            </div>
          </div>
        )}

        {/* Service Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Service Status</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Firebase Configuration</span>
                <div className="flex items-center space-x-2">
                  {serviceStatus?.configured ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">Configured</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <span className="text-orange-600 font-medium">Demo Mode</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Authentication State</span>
                <div className="flex items-center space-x-2">
                  {serviceStatus?.authenticated ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">Authenticated</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-600 font-medium">Not Authenticated</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Sign-In Method</span>
                <span className="text-gray-600 font-medium capitalize">
                  {serviceStatus?.signInMethod || 'popup'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Active Sessions</span>
                <span className="text-gray-600 font-medium">
                  {serviceStatus?.sessionCount || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Eye className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Demo Statistics</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{demoStats.signInAttempts}</div>
                <div className="text-sm text-blue-600">Sign-In Attempts</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{demoStats.successfulSignIns}</div>
                <div className="text-sm text-green-600">Successful Sign-Ins</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{demoStats.errorCount}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {demoStats.averageSignInTime || '~2s'}
                </div>
                <div className="text-sm text-purple-600">Avg. Sign-In Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Code className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">Enhanced Features</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Enhanced Security</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Email whitelist protection</li>
                <li>• Role-based access control</li>
                <li>• Session management</li>
                <li>• JWT token authentication</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Smartphone className="w-5 h-5 text-green-500" />
                <span className="font-medium">Device Optimization</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mobile-first design</li>
                <li>• Automatic redirect fallback</li>
                <li>• Device detection</li>
                <li>• Browser compatibility</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <RefreshCw className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Error Handling</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatic retry logic</li>
                <li>• Popup blocked detection</li>
                <li>• Network error recovery</li>
                <li>• User-friendly messages</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Eye className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Modern UX</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-step authentication</li>
                <li>• Loading animations</li>
                <li>• Success confirmations</li>
                <li>• Keyboard shortcuts</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Settings className="w-5 h-5 text-red-500" />
                <span className="font-medium">Analytics & Monitoring</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• User activity tracking</li>
                <li>• Performance monitoring</li>
                <li>• Error analytics</li>
                <li>• Device insights</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Globe className="w-5 h-5 text-indigo-500" />
                <span className="font-medium">Production Ready</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Firebase integration</li>
                <li>• Environment configuration</li>
                <li>• Demo mode fallback</li>
                <li>• Comprehensive logging</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Admin Configuration */}
        {serviceStatus && (
          <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4">Current Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Authorized Emails:</span>
                <div className="mt-1 space-y-1">
                  {serviceStatus.adminEmails?.length > 0 ? (
                    serviceStatus.adminEmails.map(email => (
                      <div key={email} className="px-2 py-1 bg-white rounded text-gray-600">
                        {email}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">No restrictions (demo mode)</div>
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Device Information:</span>
                <div className="mt-1 space-y-1 text-gray-600">
                  <div>Browser: {serviceStatus.deviceInfo?.browser}</div>
                  <div>Platform: {serviceStatus.deviceInfo?.platform}</div>
                  <div>Type: {serviceStatus.deviceInfo?.isMobile ? 'Mobile' : 'Desktop'}</div>
                  <div>Language: {serviceStatus.deviceInfo?.language}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sign-In Modal */}
      {showSignIn && (
        <ModernGoogleSignIn 
          onLogin={handleSignInSuccess}
          onClose={() => setShowSignIn(false)}
        />
      )}
    </div>
  );
};

export default GoogleSignInDemo;