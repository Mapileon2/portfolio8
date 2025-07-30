import React, { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import firebaseClient from './services/firebase';

const AdminApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = firebaseClient.onAuthStateChanged(async (authUser) => {
      setLoading(true);
      
      if (authUser) {
        try {
          // Verify admin access
          const adminVerification = await firebaseClient.verifyAdmin();
          
          if (adminVerification.isAdmin) {
            setUser(authUser);
            setIsAdmin(true);
          } else {
            // User is authenticated but not admin
            await firebaseClient.signOut();
            setUser(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Admin verification error:', error);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAdmin(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />;
};

export default AdminApp;