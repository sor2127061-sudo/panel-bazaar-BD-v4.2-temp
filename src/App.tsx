import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';

import LumenShell from './components/LumenShell';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import AddFund from './pages/AddFund';
import TopupSuccess from './pages/TopupSuccess';
import Orders from './pages/Orders';
import MyKeys from './pages/MyKeys';
import Account from './pages/Account';
import Bundles from './pages/Bundles';
import StockRequest from './pages/StockRequest';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  return (
    <LumenShell>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/topup/:id"     element={<ProductDetail />} />
        <Route path="/bundles"       element={<Bundles />} />
        <Route path="/add-fund"      element={<ProtectedRoute><AddFund /></ProtectedRoute>} />
        <Route path="/topup-success" element={<ProtectedRoute><TopupSuccess /></ProtectedRoute>} />
        <Route path="/orders"        element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/codes"         element={<ProtectedRoute><MyKeys /></ProtectedRoute>} />
        <Route path="/account"       element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/stock-request" element={<ProtectedRoute><StockRequest /></ProtectedRoute>} />
        <Route path="/admin"         element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
      {!isAdmin && <BottomNav />}
    </LumenShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LangProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </LangProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
