import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Mail, 
  ArrowLeft,
  Loader
} from 'lucide-react';
import firebaseClient from '../services/firebase';

const EnhancedAuthLogin = ({ onLoginSuccess }) => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'forgot', 'reset'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    resetEmail: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = firebaseClient.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const adminVerification = await firebaseClient.verifyAdmin();
          if (adminVerification.isAdmin) {
            onLoginSuccess?.(user);
          }
        } catch (error) {
          console.error('Admin verification error:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [onLoginSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // Sign in with Firebase
      const user = await firebaseClient.signIn(formData.email, formData.password);
      
      // Verify admin access
      const adminVerification = await firebaseClient.verifyAdmin();
      
      if (!adminVerification.isAdmin) {
        await firebaseClient.signOut();
        throw new Error('Admin access required');
      }

      setSuccess('Login successful! Redirecting...');
      
      // Call success callback
      setTimeout(() => {
        onLoginSuccess?.(user);
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Sign in with Google
      const user = await firebaseClient.signInWithGoogle();
      
      // Verify admin access
      const adminVerification = await firebaseClient.verifyAdmin();
      
      if (!adminVerification.isAdmin) {
        await firebaseClient.signOut();
        throw new Error('Admin access required. Please contact the administrator to grant access to your Google account.');
      }

      setSuccess('Google login successful! Redirecting...');
      
      // Call success callback
      setTimeout(() => {
        onLoginSuccess?.(user);
      }, 1000);

    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.resetEmail) {
        throw new Error('Please enter your email address');
      }

      await firebaseClient.sendPasswordResetEmail(formData.resetEmail);
      setSuccess('Password reset email sent! Check your inbox and follow the instructions.');
      
      // Switch back to login after 3 seconds
      setTimeout(() => {
        setCurrentView('login');
        setSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLoginView = () => (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Admin</h1>
        <p className="text-gray-600">Enter your credentials to access the admin panel</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Success</h3>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Google Sign-In Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full mb-4 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-3"
      >
        {loading ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>

      {/* Forgot Password Link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setCurrentView('forgot')}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          Forgot your password?
        </button>
      </div>

      {/* Simple Login Fallback */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setFormData({ email: 'admin@example.com', password: 'any', resetEmail: '' });
            setError('');
            setSuccess('');
          }}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 border border-gray-300 px-4 py-2 rounded-lg"
        >
          Try Simple Login
        </button>
      </div>

      {/* Return to Portfolio */}
      <div className="mt-6 text-center">
        <a
          href="/frontend/case-study.html"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Return to portfolio
        </a>
      </div>
    </>
  );

  const renderForgotPasswordView = () => (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-gray-600">Enter your email to receive a password reset link</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Email Sent</h3>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Reset Form */}
      <form onSubmit={handleForgotPassword} className="space-y-6">
        <div>
          <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="resetEmail"
            name="resetEmail"
            value={formData.resetEmail}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter your email address"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>Send Reset Email</span>
            </>
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setCurrentView('login')}
          disabled={loading}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to login
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {currentView === 'login' && renderLoginView()}
          {currentView === 'forgot' && renderForgotPasswordView()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Secured by Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuthLogin;