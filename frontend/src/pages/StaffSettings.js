import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Avatar,
  TextField,
  Button,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Stack,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  OutlinedInput,
  Tooltip,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  VpnKey as VpnKeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Badge as BadgeIcon,
  Apartment as ApartmentIcon,
} from '@mui/icons-material';
import StaffSidebar from '../components/StaffSidebar';
import axios from 'axios';

// Color constants matching StaffSidebar.js
const BLUE_MAIN = "#3B82F6";
const BLUE_DARK = "#2563EB";
const BLUE_DARKER = "#1D4ED8";

const StaffSettings = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch staff data on component mount
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        
        // Fetch staff profile
        const profileRes = await axios.get('/api/staff/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setStaffData(profileRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching staff data:', err);
        setError('Failed to load staff data. Please try again later.');
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
    
    // Clear previous errors when user starts typing
    if (passwordError) {
      setPasswordError(null);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = (field) => {
    if (field === 'currentPassword') {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (field === 'newPassword') {
      setShowNewPassword(!showNewPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      
      const response = await axios.put(
        '/api/staff/update-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Reset form after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSnackbar({
        open: true,
        message: 'Password updated successfully',
        severity: 'success',
      });
      
      setPasswordLoading(false);
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(
        err.response?.data?.message || 'Failed to update password. Please try again.'
      );
      setPasswordLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
    }}>
      <StaffSidebar />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          overflowX: 'auto',
        }}
      >
        {/* Header */}
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
          Account Settings
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress sx={{ color: BLUE_MAIN }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Profile Information */}
            <Grid item xs={12} md={7}>
              <Card 
                sx={{ 
                  p: 3, 
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.8) 0%, rgba(10, 10, 10, 0.8) 100%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                  <Avatar 
                    src={staffData?.profilePicture} 
                    alt={staffData?.name}
                    sx={{ 
                      width: 80, 
                      height: 80,
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: BLUE_MAIN,
                      border: `2px solid ${BLUE_MAIN}`,
                    }}
                  >
                    {staffData?.name ? staffData.name.charAt(0) : 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {staffData?.name || 'Staff Name'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                      {staffData?.position || 'Staff Position'}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem 
                      icon={<PersonIcon />} 
                      label="Full Name" 
                      value={staffData?.name || 'N/A'} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem 
                      icon={<EmailIcon />} 
                      label="Email" 
                      value={staffData?.email || 'N/A'} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem 
                      icon={<PhoneIcon />} 
                      label="Contact Number" 
                      value={staffData?.phone || 'N/A'} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem 
                      icon={<WorkIcon />} 
                      label="Position" 
                      value={staffData?.position || 'N/A'} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem 
                      icon={<BadgeIcon />} 
                      label="Staff ID" 
                      value={staffData?.staffId || 'N/A'} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem 
                      icon={<ApartmentIcon />} 
                      label="Assigned Building" 
                      value={staffData?.assignedBuilding || 'N/A'} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoItem 
                      icon={<HomeIcon />} 
                      label="Address" 
                      value={staffData?.address || 'N/A'} 
                    />
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Password Change */}
            <Grid item xs={12} md={5}>
              <Card 
                sx={{ 
                  p: 3, 
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.8) 0%, rgba(10, 10, 10, 0.8) 100%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Change Password
                </Typography>

                <form onSubmit={handlePasswordUpdate}>
                  <Stack spacing={3}>
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel htmlFor="current-password">Current Password</InputLabel>
                      <OutlinedInput
                        id="current-password"
                        name="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('currentPassword')}
                              edge="end"
                            >
                              {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        }
                        label="Current Password"
                      />
                    </FormControl>

                    <FormControl variant="outlined" fullWidth>
                      <InputLabel htmlFor="new-password">New Password</InputLabel>
                      <OutlinedInput
                        id="new-password"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('newPassword')}
                              edge="end"
                            >
                              {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        }
                        label="New Password"
                      />
                    </FormControl>

                    <FormControl variant="outlined" fullWidth>
                      <InputLabel htmlFor="confirm-password">Confirm New Password</InputLabel>
                      <OutlinedInput
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        }
                        label="Confirm New Password"
                      />
                    </FormControl>

                    {passwordError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {passwordError}
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={passwordLoading}
                      sx={{
                        bgcolor: BLUE_MAIN,
                        '&:hover': {
                          bgcolor: BLUE_DARK,
                        },
                        py: 1.5,
                      }}
                    >
                      {passwordLoading ? (
                        <CircularProgress size={24} sx={{ color: '#fff' }} />
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </Stack>
                </form>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

// Helper component for displaying info items
const InfoItem = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
    <Box sx={{ 
      color: BLUE_MAIN,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: '8px',
      bgcolor: 'rgba(59, 130, 246, 0.1)',
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="body2" sx={{ color: '#94A3B8', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

export default StaffSettings;
