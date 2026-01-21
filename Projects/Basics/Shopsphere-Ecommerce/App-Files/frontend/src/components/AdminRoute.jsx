import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return user && user.isAdmin ? children : <Navigate to="/" />;
};

export default AdminRoute;