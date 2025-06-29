
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      
      <div className="container px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
