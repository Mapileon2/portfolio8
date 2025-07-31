import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import googleAuthService from '../services/firebase-google-auth';

const FirebaseVerification = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const testSuites = [
    {
      name: 'Firebase Configuration',
      endpoint: '/api/firebase-test/config-check',
      method: 'GET'
    },
    {
      name: 'Firebase Health Check',
      endpoint: '/api/firebase-test/health',
      method: 'GET'
    },
    {
      name: 'Database Operations',
      endpoint: '/api/firebase-test/test-database',
      method: 'GET'
    },
    {
      name: 'Authentication Test',
      endpoint: '/api/firebase-test/test-auth',
      method: 'GET',
      requiresAuth: true
    },
    {
      name: 'JWT Token Verification',
      endpoint: '/api/firebase-test/verify-token',
      method: 'POST',
      requiresAuth: true
    }
  ];

  useEffect(() => {
    // Check current user
    const user = googleAuthService.getCurrentUser();
    setCurrentUser(user);
    
    // Listen for auth changes
    const unsubscribe = googleAuthService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const runTest = async (test) => {
    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      // Add auth header if required
      if (test.requiresAuth && currentUser) {
        const token = await googleAuthService.getIdToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      let body = undefined;
      if (test.method === 'POST' && test.endpoint.includes('verify-token')) {
        const token = await googleAuthService.getIdToken();
        body = JSON.stringify({ token });
      }

      const response = await fetch(test.endpoint, {
        method: test.method,
        headers,
        body
      });

      const data = await response.json();

      return {
        success: response.ok && data.success,
        status: response.status,
        data: data,
        error: !response.ok ? data.error : null
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        data: null,
        error: { message: error.message }
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const results = [];

    for (const test of testSuites) {
      // Skip auth tests if not authenticated
      if (test.requiresAuth && !currentUser) {
        results.push({
          ...test,
          success: false,
          status: 'skipped',
          message: 'Requires authentication - please sign in first',
          data: null
        });
        continue;
      }

      const result = await runTest(test);
      results.push({
        ...test,
        ...result,
        message: result.success 
          ? 'Test passed successfully' 
          : result.error?.message || 'Test failed'
      });
    }

    setTests(results);
    setLoading(false);
  };

  const handleSignIn = async () => {
    try {
      await googleAuthService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleAuthService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const getStatusIcon = (test) => {
    if (test.status === 'skipped') {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
    return test.success 
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (test) => {
    if (test.status === 'skipped') return 'border-yellow-200 bg-yellow-50';
    return test.success 
      ? 'border-green-200 bg-green-50' 
      : 'border-red-200 bg-red-50';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🔥 Firebase & JWT Verification
          </h2>
          <p className="text-gray-600">
            Test Firebase initialization, authentication, and JWT token verification
          </p>
        </div>

        {/* Authentication Status */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${currentUser ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="font-medium">
                {currentUser ? `Signed in as ${currentUser.email}` : 'Not authenticated'}
              </span>
            </div>
            <div className="space-x-2">
              {currentUser ? (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span>{loading ? 'Running Tests...' : 'Run All Tests'}</span>
          </button>
        </div>

        {/* Test Results */}
        <div className="p-6">
          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Click "Run All Tests" to start Firebase verification
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(test)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(test)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{test.name}</h3>
                        <span className="text-sm text-gray-500">
                          {test.method} {test.endpoint}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                      
                      {test.data && (
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                            View Details
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {tests.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {tests.filter(t => t.success).length} of {tests.length} tests passed
              </div>
              <div className="flex space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{tests.filter(t => t.success).length} Passed</span>
                </span>
                <span className="flex items-center space-x-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>{tests.filter(t => !t.success && t.status !== 'skipped').length} Failed</span>
                </span>
                <span className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>{tests.filter(t => t.status === 'skipped').length} Skipped</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseVerification;