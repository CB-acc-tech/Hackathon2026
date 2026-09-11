import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WellProvider } from './context/WellContext';

import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import InitializePage from './pages/InitializePage';
import SubsurfaceMapPage from './pages/SubsurfaceMapPage';
import DashboardPage from './pages/DashboardPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import AdminPage from './pages/AdminPage';

// Protected Route Wrapper with Auth and RBAC
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
        return <Navigate to="/initialize" replace />;
    }
    return children;
};

export default function App() {
    return (
        <AuthProvider>
            <WellProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />

                        <Route path="/" element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Navigate to="/initialize" replace />} />
                            <Route path="initialize" element={<InitializePage />} />
                            <Route path="subsurface-map" element={<SubsurfaceMapPage />} />
                            <Route path="dashboard" element={<DashboardPage />} />
                            <Route path="knowledge-base" element={<KnowledgeBasePage />} />
                            <Route path="admin" element={
                                <ProtectedRoute allowedRoles={['DATA_ADMIN']}>
                                    <AdminPage />
                                </ProtectedRoute>
                            } />
                        </Route>

                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </WellProvider>
        </AuthProvider>
    );
}
