
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OptimizedAdminRoute from '@/components/OptimizedAdminRoute';
import AdminDashboard from '@/components/AdminDashboard';
import AdminGalleryManager from '@/components/AdminGalleryManager';
import AdminCommentsView from '@/components/AdminCommentsView';
import AdminStatsView from '@/components/AdminStatsView';
import AdminAuditView from '@/components/AdminAuditView';
import AdminUsersView from '@/components/AdminUsersView';
import AdminContentEditor from '@/components/AdminContentEditor';
import NotFound from '@/pages/NotFound';

const Admin: React.FC = () => {
  return (
    <OptimizedAdminRoute>
      <Routes>
        <Route path="/" element={<AdminDashboard />}>
          <Route index element={<AdminGalleryManager />} />
          <Route path="content" element={<AdminContentEditor />} />
          <Route path="comments" element={<AdminCommentsView />} />
          <Route path="stats" element={<AdminStatsView />} />
          <Route path="audit" element={<AdminAuditView />} />
          <Route path="users" element={<AdminUsersView />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </OptimizedAdminRoute>
  );
};

export default Admin;
