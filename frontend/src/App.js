import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudent from './pages/AdminStudent';
import AdminBuilding from './pages/AdminBuilding';
import StaffDashboard from './pages/StaffDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminMessaging from './pages/AdminMessaging';
import StudentMessaging from './pages/StudentMessaging';
import StudentForms from './pages/StudentForms';
import AdminForms from './pages/AdminForms';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const theme = createTheme({
  // Add your theme customization here
});

// Protected Route component
const ProtectedRoute = ({ children, allowedRole }) => {
  const userRole = localStorage.getItem('userRole');
  
  if (!userRole) {
    return <Navigate to="/login" />;
  }

  if (userRole !== allowedRole) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/students" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminStudent />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/messages" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminMessaging />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/buildings" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminBuilding />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/staff-dashboard" 
              element={
                <ProtectedRoute allowedRole="staff">
                  <StaffDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/student-dashboard" 
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/student/messages" 
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentMessaging />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/student/forms" 
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentForms />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/forms" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminForms />
                </ProtectedRoute>
              } 
            />

            

            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Catch all other routes and redirect to login */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App; 