import React, { useState, useEffect } from 'react';
import AdminLoginGoogle from './components/AdminLoginGoogle';
import AdminDashboard from './components/AdminDashboard';
import googleAuthService from './services/firebase-google-auth';

function AdminAppGoogle() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const currentUser = await googleAuthService.waitForAuth();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const unsubscribe = googleAuthService.onAuthStateChanged((user) => {
      setUser(user);
      if (!loading) {
        // Only update localStorage after initial load
        if (user) {
          localStorage.setItem('adminUser', JSON.stringify(user));
        } else {
          localStorage.removeItem('adminUser');
        }
      }
    });

    return () => unsubscribe();
  }, [loading]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await googleAuthService.signOut();
      setUser(null);
      localStorage.removeItem('adminUser');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setUser(null);
      localStorage.removeItem('adminUser');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {user ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <AdminLoginGoogle onLogin={handleLogin} />
      )}
    </div>
  );
}

export default AdminAppGoogle;