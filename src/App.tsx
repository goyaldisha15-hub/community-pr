import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Landing from './pages/Landing';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Register from './pages/Register';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminParticipants from './pages/admin/Participants';
import AdminAttendance from './pages/admin/Attendance';
import AdminReports from './pages/admin/Reports';
import AdminVolunteers from './pages/admin/Volunteers';

// Volunteer Pages
import VolunteerDashboard from './pages/VolunteerDashboard';
import QRScanner from './pages/QRScanner';

// Participant Pages
import ParticipantDashboard from './pages/ParticipantDashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="participants" element={<AdminParticipants />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="volunteers" element={<AdminVolunteers />} />
          </Route>

          {/* Volunteer Routes */}
          <Route path="/volunteer" element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/volunteer/scan/:eventId" element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <QRScanner />
            </ProtectedRoute>
          } />

          {/* Participant Routes */}
          <Route path="/participant" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <ParticipantDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
