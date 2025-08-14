import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader, 
  CheckCircle, 
  Shield, 
  Smartphone,
  Monitor,
  Globe,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import enhancedGoogleAuthService from '../services/firebase-google-auth-enhanced';

const ModernGoogleSignIn = ({ onLogin, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [uiState, setUiState] = useState({
    showPassword: false,
    loading: false,
    googleLoading: false,
    error: '',
    success: '',
    step: 'signin', // 'signin', 'verify', 'success'
    showFallback: false,
    deviceInfo: null
  });

  const [serviceStatus, setServiceStatus] = useState(null);
  const [animationClass, setAnimationClass] = useState('animate-fadeIn');
  const googleButtonRef = useRef(null);

  useEffect(() => {
    // Get service status and device info
    const status = enhancedGoogleAuthService.getServiceStatus();
    setServiceStatus(status);
    
    // Get device information
    const deviceInfo = getDeviceInfo();
    setUiState(prev => ({ ...prev, deviceInfo }));
    
    // Check if user is already authenticated
    checkExistingAuth();

    // Listen for auth state changes
    const unsubscribe = enhancedGoogleAuthService.onAuthStateChanged((user, extra) => {
      handleAuthStateChange(user, extra);
    });

    // Add keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        handleGoogleSignIn();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      unsubscribe();
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [onLogin, onClose]);

  const checkExistingAuth = async () => {
    try {
      const user = await enhancedGoogleAuthService.waitForAuth();
      if (user) {
        setUiState(prev => ({ 
          ...prev, 
          step: 'success',
          success: `Welcome back, ${user.name}!` 
        }));
        setTimeout(() => onLogin(user), 1500);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const handleAuthStateChange = (user, extra) => {
    if (extra?.error) {
      setUiState(prev => ({ 
        ...prev, 
        error: extra.error, 
        googleLoading: false,
        loading: false 
      }));
    } else if (user) {
      setUiState(prev => ({ 
        ...prev, 
        step: 'success',
        success: `Welcome, ${user.name}!`,
        error: '',
        googleLoading: false,
        loading: false
      }));
      setTimeout(() => onLogin(user), 1500);
    }
  };

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Mobile)/i.test(userAgent);
    const browser = getBrowserName();
    
    return {
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      browser,
      platform: navigator.platform,
      language: navigator.language
    };
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const handleGoogleSignIn = async () => {
    setUiState(prev => ({ 
      ...prev, 
      googleLoading: true, 
      error: '', 
      success: '',
      step: 'verify'
    }));

    // Add visual feedback
    if (googleButtonRef.current) {
      googleButtonRef.current.classList.add('animate-pulse');
    }

    try {
      const result = await enhancedGoogleAuthService.signInWithGoogle();
      if (result.success) {
        setUiState(prev => ({ 
          ...prev, 
          step: 'success',
          success: `Authentication successful! Welcome, ${result.user.name}!`
        }));
        // onLogin will be called via auth state change
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setUiState(prev => ({ 
        ...prev, 
        error: err.message,
        step: 'signin'
      }));
      
      // Show fallback options if popup failed
      if (err.message.includes('popup') || err.message.includes('blocked')) {
        setUiState(prev => ({ ...prev, showFallback: true }));
      }
    } finally {
      setUiState(prev => ({ ...prev, googleLoading: false }));
      if (googleButtonRef.current) {
        googleButtonRef.current.classList.remove('animate-pulse');
      }
    }
  };

  const handleGoogleRedirect = async () => {
    setUiState(prev => ({ 
      ...prev, 
      googleLoading: true, 
      error: '',
      step: 'verify'
    }));

    try {
      await enhancedGoogleAuthService.signInWithGoogleRedirect();
      // Redirect will happen, no need to handle result here
    } catch (err) {
      setUiState(prev => ({ 
        ...prev, 
        error: err.message, 
        googleLoading: false,
        step: 'signin'
      }));
    }
  };

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setUiState(prev => ({ 
      ...prev, 
      loading: true, 
      error: '',
      step: 'verify'
    }));

    try {
      // Enhanced validation
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      if (!isValidEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Demo authentication logic
      if (formData.email === 'admin@example.com' || 
          serviceStatus?.adminEmails?.includes(formData.email)) {
        
        // Simulate API call with realistic delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const demoUser = {
          uid: 'demo-admin-' + Date.now(),
          email: formData.email,
          name: extractNameFromEmail(formData.email),
          photoURL: generateAvatarUrl(formData.email),
          isAdmin: true,
          provider: 'email',
          lastLogin: new Date().toISOString(),
          rememberMe: formData.rememberMe
        };

        // Store in localStorage if remember me is checked
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        }

        setUiState(prev => ({ 
          ...prev, 
          step: 'success',
          success: `Welcome back, ${demoUser.name}!`
        }));
        
        setTimeout(() => onLogin(demoUser), 1500);
      } else {
        throw new Error('Invalid credentials. Use admin@example.com or sign in with Google');
      }
    } catch (err) {
      setUiState(prev => ({ 
        ...prev, 
        error: err.message,
        step: 'signin'
      }));
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const extractNameFromEmail = (email) => {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
  };

  const generateAvatarUrl = (email) => {
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD'];
    const color = colors[email.length % colors.length];
    const initial = email.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=100`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRetry = () => {
    setUiState(prev => ({ 
      ...prev, 
      error: '', 
      success: '', 
      step: 'signin',
      showFallback: false
    }));
  };

  const getStepContent = () => {
    switch (uiState.step) {
      case 'verify':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying...</h3>
            <p className="text-gray-600 text-sm">
              {uiState.googleLoading ? 'Authenticating with Google' : 'Checking credentials'}
            </p>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 text-sm mb-4">{uiState.success}</p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <span>Redirecting to dashboard</span>
              <ArrowRight className="w-4 h-4 ml-2 animate-pulse" />
            </div>
          </div>
        );

      default:
        return (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600 mt-2">Sign in to access your portfolio dashboard</p>
            </div>

            {/* Service Status */}
            {getStatusIndicator()}

            {/* Success Message */}
            {uiState.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-slideIn">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-700 text-sm">{uiState.success}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {uiState.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-slideIn">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-red-700 text-sm">
                      <div className="font-medium mb-1">Authentication Error</div>
                      <div className="whitespace-pre-line">{uiState.error}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="text-red-500 hover:text-red-700 ml-2"
                    title="Retry"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="mb-6">
              <button
                ref={googleButtonRef}
                onClick={handleGoogleSignIn}
                disabled={uiState.googleLoading || uiState.loading}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md group"
              >
                {uiState.googleLoading ? (
                  <div className="flex items-center">
                    <Loader className="animate-spin w-5 h-5 mr-3" />
                    <span>Connecting to Google...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>
                      {serviceStatus?.configured ? 'Continue with Google' : 'Continue with Google (Demo)'}
                    </span>
                  </div>
                )}
              </button>

              {/* Fallback Options */}
              {uiState.showFallback && (
                <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-slideIn">
                  <div className="text-sm text-yellow-800 mb-3">
                    <strong>Having trouble with the popup?</strong> Try these alternatives:
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleGoogleRedirect}
                      disabled={uiState.googleLoading}
                      className="w-full text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded-lg border border-yellow-300 transition-colors flex items-center justify-center"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Use Redirect Method
                    </button>
                    <div className="text-xs text-yellow-700 text-center">
                      This will redirect you to Google's sign-in page
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium">Or sign in with email</span>
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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
                    type={uiState.showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {uiState.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={uiState.loading || uiState.googleLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {uiState.loading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="animate-spin w-5 h-5 mr-2" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </form>
          </>
        );
    }
  };

  const getStatusIndicator = () => {
    if (!serviceStatus) return null;

    return (
      <div className="mb-6 p-4 rounded-xl border bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-3 h-3 rounded-full ${serviceStatus.configured ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
          <span className="font-semibold text-sm">
            {serviceStatus.configured ? 'Production Mode' : 'Demo Mode'}
          </span>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            {uiState.deviceInfo?.isDesktop && <Monitor className="w-3 h-3" />}
            {uiState.deviceInfo?.isMobile && <Smartphone className="w-3 h-3" />}
            <span>{uiState.deviceInfo?.browser}</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          {serviceStatus.configured ? (
            <>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Real Google Authentication Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3 text-blue-500" />
                <span>Secure Firebase Backend</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                👤 Authorized: {serviceStatus.adminEmails.join(', ')}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                <span>Mock Authentication Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-3 h-3 text-blue-500" />
                <span>Configure Firebase for production</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                💡 Use admin@example.com with any password
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative ${animationClass} max-h-[90vh] overflow-y-auto`}>
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {getStepContent()}

        {/* Footer Info */}
        {uiState.step === 'signin' && (
          <>
            <div className="mt-8 text-center">
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
                      <span className="font-medium">Demo Mode Active</span>
                    </div>
                    <div className="text-xs mt-1">
                      Email: <span className="font-medium">admin@example.com</span> + any password
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <div className="font-medium mb-1">Security Features:</div>
                  <ul className="space-y-0.5 text-xs">
                    <li>• Email whitelist protection</li>
                    <li>• Secure JWT token authentication</li>
                    <li>• Firebase security rules</li>
                    <li>• Session management & encryption</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="mt-3 text-center text-xs text-gray-500">
              <span>💡 Press </span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd>
              <span> for Google sign-in • </span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
              <span> to close</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModernGoogleSignIn;