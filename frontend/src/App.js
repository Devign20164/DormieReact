import React, { useState, useEffect, useMemo, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { Box, Switch, FormControlLabel, styled } from '@mui/material';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudent from './pages/AdminStudent';
import AdminBuilding from './pages/AdminBuilding';
import AdminStaff from './pages/AdminStaff';
import AdminBill from './pages/AdminBill';
import AdminHistory from './pages/AdminHistory';
import AdminReport from './pages/AdminReport';
import AdminNews from './pages/AdminNews';
import AdminSettings from './pages/AdminSettings';
import StaffDashboard from './pages/StaffDashboard';
import StaffTenantLog from './pages/StaffTenantLog';
import StaffAssignment from './pages/StaffAssignment';
import StaffSettings from './pages/StaffSettings';
import StudentDashboard from './pages/StudentDashboard';
import AdminMessaging from './pages/AdminMessaging';
import StudentMessaging from './pages/StudentMessaging';
import StudentForm from './pages/StudentForm';
import AdminForm from './pages/AdminForm';
import StudentBill from './pages/StudentBill';
import StudentLog from './pages/StudentLog';
import StudentNews from './pages/StudentNews';
import StudentFAQS from './pages/StudentFAQS.js';
import StudentSettings from './pages/StudentSettings';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Create a context for theme management
export const ThemeContext = createContext({
  mode: 'dark',
  toggleTheme: () => {},
});

// Protected Route component
const ProtectedRoute = ({ children, allowedRole }) => {
  const userRole = localStorage.getItem('userRole');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in and has proper role
    if (!userRole || !userData || !userData._id) {
      setIsAuthenticated(false);
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      navigate('/login');
      return;
    }

    // Verify role matches
    if (userRole !== allowedRole) {
      setIsAuthenticated(false);
      navigate('/login');
      return;
    }

    // Optional: Verify token is still valid by checking with backend
    const verifyToken = async () => {
      try {
        // Skip token verification during initial login flow to prevent redirect loop
        if (sessionStorage.getItem('justLoggedIn') === 'true') {
          sessionStorage.removeItem('justLoggedIn');
          return; // Skip verification on initial login
        }

        // Use the correct endpoint format - fix "student" to "students" for student role
        const endpoint = userRole === 'student' ? 'students' : userRole;
        const response = await fetch(`/api/${endpoint}/profile`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          // Token invalid or expired
          setIsAuthenticated(false);
          localStorage.removeItem('userRole');
          localStorage.removeItem('userData');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error verifying authentication:', error);
        setIsAuthenticated(false);
        navigate('/login');
      }
    };
    
    verifyToken();
  }, [userRole, allowedRole, navigate, userData]);

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

function App() {
  const [mode, setMode] = useState('dark');

  // Force dark mode on app load
  useEffect(() => {
    localStorage.setItem('themeMode', 'dark');
  }, []);

  const themeContextValue = useMemo(() => ({
    mode,
    toggleTheme: () => {
      // Always dark mode, toggle functionality retained but only sets dark mode
      setMode('dark');
      localStorage.setItem('themeMode', 'dark');
    }
  }), [mode]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#3f51b5',
        dark: '#002984',
        contrastText: '#fff',
      },
      secondary: {
        main: '#f50057',
        dark: '#c51162',
        contrastText: '#fff',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
      },
      error: {
        main: '#f44336',
      },
      warning: {
        main: '#ff9800',
      },
      info: {
        main: '#2196f3',
      },
      success: {
        main: '#4caf50',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: '8px 16px',
          },
          contained: {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'medium',
        },
      },
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
    <ThemeProvider theme={theme}>
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
            path="/admin/staff" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminStaff />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/forms" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/bills" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminBill />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/history" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminHistory />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/news" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminNews />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminReport />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminSettings />
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
            path="/staff/tenant-log" 
            element={
              <ProtectedRoute allowedRole="staff">
                <StaffTenantLog />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/staff/assignments" 
            element={
              <ProtectedRoute allowedRole="staff">
                <StaffAssignment />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/staff/settings" 
            element={
              <ProtectedRoute allowedRole="staff">
                <StaffSettings />
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
                <StudentForm />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/student/bills" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentBill />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/student/log"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentLog />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/news"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentNews />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/student/faqs" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentFAQS />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/student/settings" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentSettings />
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
          theme={mode}
      />
    </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App; 