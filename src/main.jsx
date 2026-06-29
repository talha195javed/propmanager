import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Features from './Features.jsx'
import Pricing from './Pricing.jsx'
import About from './About.jsx'
import Login from './Login.jsx'
import Signup from './Signup.jsx'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import Properties from './admin/Properties'
import PropertyAdd from './admin/PropertyAdd'
import PropertyDetail from './admin/PropertyDetail'
import UnitDetail from './admin/UnitDetail'
import Tenants from './admin/Tenants'
import TenantDetail from './admin/TenantDetail'
import Payments from './admin/Payments'
import Settings from './admin/Settings'
import Owners from './admin/Owners'
import OwnerDetail from './admin/OwnerDetail'
import Lease from './admin/Lease'
import LeaseDetail from './admin/LeaseDetail'
import Maintenance from './admin/Maintenance'
import MaintenanceDetail from './admin/MaintenanceDetail'
import Tasks from './admin/Tasks'
import Messages from './admin/Messages'
import ProtectedRoute from './ProtectedRoute'
import { AuthProvider } from './AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="properties/new" element={<PropertyAdd />} />
          <Route path="properties/:id" element={<PropertyDetail />} />
          <Route path="properties/:id/units/:unitId" element={<UnitDetail />} />
          <Route path="owners" element={<Owners />} />
          <Route path="owners/:id" element={<OwnerDetail />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="tenants/:id" element={<TenantDetail />} />
          <Route path="lease" element={<Lease />} />
          <Route path="lease/:id" element={<LeaseDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="maintenance/:id" element={<MaintenanceDetail />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
