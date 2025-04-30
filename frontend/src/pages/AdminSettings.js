import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Switch,
  Button,
  Divider,
  TextField,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stack,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Snackbar,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ColorLens as ColorLensIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Language as LanguageIcon,
  Dashboard as DashboardIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import { ThemeContext } from '../App';

const AdminSettings = () => {
  const { mode } = useContext(ThemeContext);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Admin profile settings based on adminModel.js
  const [profileSettings, setProfileSettings] = useState({
    name: '',
    role: 'Admin',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Fetch admin profile on component mount
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        setLoading(true);
        
        // First try getting the user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (userData && userData.name) {
          // Pre-fill form with localStorage data
          setProfileSettings(prevSettings => ({
            ...prevSettings,
            name: userData.name || '',
            role: userData.role || 'Admin'
          }));
        }
        
        // Then fetch from API for most up-to-date data
        const response = await fetch('/api/admin/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Check for HTML response which indicates a routing issue
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("text/html") !== -1) {
          throw new Error("Server returned HTML instead of JSON. API endpoint may not exist.");
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile data');
        }
        
        const data = await response.json();
        setProfileSettings(prevSettings => ({
          ...prevSettings,
          name: data.name || '',
          role: data.role || 'Admin'
        }));
        
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        setError('Failed to load profile data: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchAdminProfile();
  }, []);
  
  // Generic handler for profile settings form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const validatePasswordForm = () => {
    if (!profileSettings.currentPassword) {
      setSnackbar({
        open: true,
        message: 'Current password is required',
        severity: 'error'
      });
      return false;
    }
    
    if (!profileSettings.newPassword) {
      setSnackbar({
        open: true,
        message: 'New password is required',
        severity: 'error'
      });
      return false;
    }
    
    if (profileSettings.newPassword !== profileSettings.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New password and confirmation do not match',
        severity: 'error'
      });
      return false;
    }
    
    if (profileSettings.newPassword.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long',
        severity: 'error'
      });
      return false;
    }
    
    return true;
  };
  
  const handleSave = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      // Update password
      const passwordResponse = await fetch('/api/admin/update-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: profileSettings.currentPassword,
          newPassword: profileSettings.newPassword
        })
      });
      
      // Check for HTML response which indicates a routing issue
      const contentType = passwordResponse.headers.get("content-type");
      if (contentType && contentType.indexOf("text/html") !== -1) {
        throw new Error("Server returned HTML instead of JSON. API endpoint may not exist.");
      }
      
      const passwordData = await passwordResponse.json();
      
      if (!passwordResponse.ok) {
        throw new Error(passwordData.message || 'Failed to update password');
      }
      
      // Update name if changed
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (profileSettings.name !== userData.name) {
        const nameResponse = await fetch('/api/admin/update-profile', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: profileSettings.name
          })
        });
        
        // Check for HTML response
        const nameContentType = nameResponse.headers.get("content-type");
        if (nameContentType && nameContentType.indexOf("text/html") !== -1) {
          throw new Error("Server returned HTML instead of JSON. API endpoint may not exist.");
        }
        
        const nameData = await nameResponse.json();
        
        if (!nameResponse.ok) {
          throw new Error(nameData.message || 'Failed to update profile');
        }
        
        // Update localStorage with new name
        const updatedUserData = {
          ...userData,
          name: profileSettings.name
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      }
      
      // Reset password fields
      setProfileSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setSnackbar({
        open: true,
        message: 'Profile settings saved successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to update profile. Please try again.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Helper function to render form fields with consistent styling
  const renderTextField = (name, label, value, handler, type = 'text', required = false) => (
    <TextField
      fullWidth
      name={name}
      label={label}
      value={value}
      onChange={handler}
      type={type}
      required={required}
      variant="outlined"
      margin="normal"
      sx={{
        '& .MuiOutlinedInput-root': {
          color: mode === 'dark' ? '#fff' : '#333',
          '& fieldset': {
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          },
          '&:hover fieldset': {
            borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.8)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#10B981',
          },
        },
        '& .MuiInputLabel-root': {
          color: mode === 'dark' ? '#9CA3AF' : '#666',
          '&.Mui-focused': {
            color: '#10B981',
          },
        },
      }}
    />
  );
  
  const renderSettingsCard = (title, icon, content) => (
    <Card
      sx={{
        background: mode === 'dark' 
          ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: '20px',
        p: 3,
        mb: 3,
        border: mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.03)'
          : '1px solid rgba(16, 185, 129, 0.15)',
        boxShadow: mode === 'dark'
          ? '0 4px 20px rgba(0,0,0,0.2)'
          : '0 4px 20px rgba(16, 185, 129, 0.08)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: mode === 'dark'
            ? '0 8px 25px rgba(0,0,0,0.3)'
            : '0 8px 25px rgba(16, 185, 129, 0.12)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5px',
          height: '100%',
          background: '#10B981',
          borderTopLeftRadius: '20px',
          borderBottomLeftRadius: '20px',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
          p: 1, 
          borderRadius: '12px',
          display: 'flex',
          mr: 2
        }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ color: mode === 'dark' ? '#fff' : '#333', fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ 
        my: 2, 
        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }} />
      {content}
    </Card>
  );
  
  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: mode === 'dark' 
        ? 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)' 
        : 'linear-gradient(145deg, #f0f9f4 0%, #e6f7ee 100%)',
      color: mode === 'dark' ? '#fff' : '#333',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: mode === 'dark'
          ? 'radial-gradient(circle at top right, rgba(255,255,255,0.03) 0%, transparent 70%)'
          : 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05) 0%, transparent 80%)',
        pointerEvents: 'none',
      },
    }}>
      <AdminSidebar />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'none',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          pb: 3,
          borderBottom: mode === 'dark' 
            ? '1px solid rgba(255,255,255,0.03)' 
            : '1px solid rgba(16, 185, 129, 0.1)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: mode === 'dark' ? '#fff' : '#333',
              textShadow: mode === 'dark' 
                ? '0 2px 4px rgba(0,0,0,0.2)' 
                : '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              Admin Profile
            </Typography>
            <Typography variant="body2" sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#6c757d', 
              mt: 1 
            }}>
              Manage your admin account information and password
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <NotificationBell userType="admin" color="#10B981" />
          </Stack>
        </Box>
        
        {/* Profile Settings Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: '#10B981' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Card
            sx={{
              background: mode === 'dark' 
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)' 
                : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              borderRadius: '20px',
              p: 3,
              mb: 3,
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid rgba(16, 185, 129, 0.15)',
              boxShadow: mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.2)'
                : '0 4px 20px rgba(16, 185, 129, 0.08)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                boxShadow: mode === 'dark'
                  ? '0 8px 25px rgba(0,0,0,0.3)'
                  : '0 8px 25px rgba(16, 185, 129, 0.12)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '5px',
                height: '100%',
                background: '#10B981',
                borderTopLeftRadius: '20px',
                borderBottomLeftRadius: '20px',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                p: 1, 
                borderRadius: '12px',
                display: 'flex',
                mr: 2
              }}>
                <PersonIcon sx={{ color: '#10B981' }} />
              </Box>
              <Typography variant="h6" sx={{ color: mode === 'dark' ? '#fff' : '#333', fontWeight: 600 }}>
                Admin Profile
              </Typography>
            </Box>
            <Divider sx={{ 
              my: 2, 
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: mode === 'dark' ? '#9CA3AF' : '#666' }}>
                  Account Information
                </Typography>
                {renderTextField('name', 'Admin Name', profileSettings.name, handleInputChange, 'text', true)}
                
                <TextField
                  fullWidth
                  disabled
                  name="role"
                  label="Role"
                  value={profileSettings.role}
                  variant="outlined"
                  margin="normal"
                  helperText="Admin role cannot be changed"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                      '& fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? '#9CA3AF' : '#666',
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: mode === 'dark' ? '#9CA3AF' : '#666' }}>
                  Change Password
                </Typography>
                <TextField
                  fullWidth
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  label="Current Password"
                  value={profileSettings.currentPassword}
                  onChange={handleInputChange}
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? 
                          <VisibilityOffIcon sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d' }} /> : 
                          <VisibilityIcon sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d' }} />
                        }
                      </IconButton>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: mode === 'dark' ? '#fff' : '#333',
                      '& fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.8)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? '#9CA3AF' : '#666',
                      '&.Mui-focused': {
                        color: '#10B981',
                      },
                    },
                  }}
                />
                
                <TextField
                  fullWidth
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  label="New Password"
                  value={profileSettings.newPassword}
                  onChange={handleInputChange}
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? 
                          <VisibilityOffIcon sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d' }} /> : 
                          <VisibilityIcon sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d' }} />
                        }
                      </IconButton>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: mode === 'dark' ? '#fff' : '#333',
                      '& fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.8)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? '#9CA3AF' : '#666',
                      '&.Mui-focused': {
                        color: '#10B981',
                      },
                    },
                  }}
                />
                
                {renderTextField('confirmPassword', 'Confirm New Password', profileSettings.confirmPassword, handleInputChange, 'password')}
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    Your admin password is used for accessing the system. Make sure to use a strong password with at least 8 characters including numbers and special characters.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Card>
        )}
        
        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          mt: 4
        }}>
          <Button 
            variant="outlined" 
            disabled={saving || loading}
            sx={{ 
              mr: 2,
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: mode === 'dark' ? '#fff' : '#333',
              '&:hover': {
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            sx={{ 
              backgroundColor: '#10B981',
              '&:hover': {
                backgroundColor: '#059669',
              },
              '&.Mui-disabled': {
                backgroundColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.5)',
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
        
      </Box>
      
      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSettings;
