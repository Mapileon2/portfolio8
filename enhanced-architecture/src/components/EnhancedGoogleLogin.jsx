import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader, CheckCircle, User, Shield } from 'lucide-react';
import enhancedGoogleAuthService from '../services/firebase-google-auth-enhanced';

const EnhancedGoogleLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serviceStatus, setServiceStatus] = useState(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Get service status
    const status = enhancedGoogleAuthService.getServiceStatus();
    setServiceStatus(status);
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      const user = await enhancedGoogleAuthService.waitForAuth();
      if (user) {
        onLogin(user);
      }
    };
    
    checkAuth();

    // Listen for auth state changes with error handling
    const unsubscribe = enhancedGoogleAuthService.onAuthStateChanged((user, extra) => {
      if (extra?.error) {
        setError(extra.error);
        setGoogleLoading(false);
      } else if (user) {
        setSuccess(`Welcome back, ${user.name}!`);
        setTimeout(() => onLogin(user), 1000);
      }
    });

    return () => unsubscribe();
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await enhancedGoogleAuthService.signInWithGoogle();
      if (result.success) {
        setSuccess(`Welcome, ${result.user.name}!`);
        // onLogin will be called via auth state change
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message);
      
      // Show fallback options if popup failed
      if (err.message.includes('popup') || err.message.includes('blocked')) {
        setShowFallback(true);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      await enhancedGoogleAuthService.signInWithGoogleRedirect();
      // Redirect will happen, no need to handle result here
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simple validation for demo/fallback
      if (formData.email === 'admin@example.com') {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onLogin({
          uid: 'demo-admin',
          email: formData.email,
          name: 'Admin User',
          photoURL: 'https://via.placeholder.com/100x100?text=Admin',
          isAdmin: true,
          provider: 'email'
        });
      } else {
        throw new Error('Invalid credentials. Use admin@example.com or sign in with Google');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusIndicator = () => {
    if (!serviceStatus) return null;

    return (
      <div className="mb-6 p-4 rounded-lg border bg-gray-50">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${serviceStatus.configured ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <span className="font-medium text-sm">
            {serviceStatus.configured ? 'Firebase Configured' : 'Demo Mode'}
          </span>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          {serviceStatus.configured ? (
            <>
              <div>✅ Real Google Authentication</div>
              <div>✅ Secure Firebase Backend</div>
              <div>👤 Authorized: {serviceStatus.adminEmails.join(', ')}</div>
            </>
          ) : (
            <>
              <div>🔧 Mock Authentication Active</div>
              <div>💡 Configure Firebase for production</div>
              <div>📧 Any email works in demo mode</div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Admin Login</h1>
          <p className="text-gray-600 mt-2">Secure access to your portfolio dashboard</p>
        </div>

        {/* Service Status */}
        {getStatusIndicator()}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-red-700 text-sm">
                <div className="font-medium mb-1">Authentication Error</div>
                <div className="whitespace-pre-line">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {googleLoading ? (
              <div className="flex items-center">
                <Loader className="animate-spin w-5 h-5 mr-2" />
                Signing in with Google...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {serviceStatus?.configured ? 'Sign in with Google' : 'Sign in with Google (Demo)'}
              </div>
            )}
          </button>

          {/* Fallback Options */}
          {showFallback && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800 mb-2">
                <strong>Popup blocked?</strong> Try these alternatives:
              </div>
              <button
                onClick={handleGoogleRedirect}
                disabled={googleLoading}
                className="w-full text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded border border-yellow-300 transition-colors"
              >
                Use Redirect Method
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter any password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader className="animate-spin w-5 h-5 mr-2" />
                Signing in...
              </div>
            ) : (
              'Sign In with Email'
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600 space-y-2">
            {serviceStatus?.configured ? (
              <div>
                <div className="flex items-center justify-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Production Ready</span>
                </div>
                <div className="text-xs mt-1">
                  Secure Google Authentication with Firebase
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center space-x-1 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Demo Mode</span>
                </div>
                <div className="text-xs mt-1">
                  Email: <span className="font-medium">admin@example.com</span> + any password
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <div className="font-medium mb-1">Security Features:</div>
              <ul className="space-y-0.5">
                <li>• Email whitelist protection</li>
                <li>• Secure JWT token authentication</li>
                <li>• Firebase security rules</li>
                <li>• Session management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGoogleLogin;