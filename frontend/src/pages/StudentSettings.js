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
  School as SchoolIcon,
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
import StudentSidebar from '../components/StudentSidebar';
import axios from 'axios';

// Color constants matching StudentSidebar.js
const GREEN_MAIN = "#10B981";
const GREEN_DARK = "#059669";
const GREEN_DARKER = "#047857";

const StudentSettings = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [studentData, setStudentData] = useState(null);
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

  // Fetch student data on component mount
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch student profile
        const profileRes = await axios.get('/api/students/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setStudentData(profileRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load student data. Please try again later.');
        setLoading(false);
      }
    };

    fetchStudentData();
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
        '/api/students/update-password',
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
      <StudentSidebar />
      
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
            <CircularProgress sx={{ color: GREEN_MAIN }} />
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
                    src={studentData.profilePicture} 
                    alt={studentData.name}
                    sx={{ 
                      width: 80, 
                      height: 80,
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      color: GREEN_MAIN,
                      border: `2px solid ${GREEN_MAIN}`,
                    }}
                  >
                    {studentData.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {studentData.name}
                    </Typography>
                    <Chip 
                      label={studentData.studentDormNumber || 'No Dorm Number'} 
                      size="small"
                      icon={<BadgeIcon fontSize="small" />}
                      sx={{ 
                        bgcolor: 'rgba(16, 185, 129, 0.1)', 
                        color: GREEN_MAIN,
                        mt: 1,
                        '& .MuiChip-icon': { color: GREEN_MAIN }
                      }} 
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Personal Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<EmailIcon sx={{ color: GREEN_MAIN }} />}
                      label="Email"
                      value={studentData.email}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<PhoneIcon sx={{ color: GREEN_MAIN }} />}
                      label="Contact"
                      value={studentData.contactInfo || 'Not provided'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<SchoolIcon sx={{ color: GREEN_MAIN }} />}
                      label="Course Year"
                      value={studentData.courseYear || 'Not provided'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<ApartmentIcon sx={{ color: GREEN_MAIN }} />}
                      label="Room"
                      value={studentData.room?.roomNumber || 'Not assigned'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<HomeIcon sx={{ color: GREEN_MAIN }} />}
                      label="Address"
                      value={studentData.address || 'Not provided'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<PersonIcon sx={{ color: GREEN_MAIN }} />}
                      label="Gender"
                      value={studentData.gender || 'Not specified'}
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Parent/Guardian Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<PersonIcon sx={{ color: GREEN_MAIN }} />}
                      label="Father's Name"
                      value={studentData.fatherName || 'Not provided'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<PhoneIcon sx={{ color: GREEN_MAIN }} />}
                      label="Father's Contact"
                      value={studentData.fatherContact || 'Not provided'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<PersonIcon sx={{ color: GREEN_MAIN }} />}
                      label="Mother's Name"
                      value={studentData.motherName || 'Not provided'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      icon={<PhoneIcon sx={{ color: GREEN_MAIN }} />}
                      label="Mother's Contact"
                      value={studentData.motherContact || 'Not provided'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoItem
                      icon={<HomeIcon sx={{ color: GREEN_MAIN }} />}
                      label="Parents' Address"
                      value={studentData.parentsAddress || 'Not provided'}
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.6)">
                    Account created: {formatDate(studentData.createdAt)}
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.6)">
                    Last updated: {formatDate(studentData.updatedAt)}
                  </Typography>
                </Box>
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
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1 
                }}>
                  <VpnKeyIcon sx={{ color: GREEN_MAIN }} />
                  Change Password
                </Typography>
                
                {passwordError && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {passwordError}
                  </Alert>
                )}
                
                <form onSubmit={handlePasswordUpdate}>
                  <Stack spacing={3}>
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel 
                        htmlFor="current-password" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': { color: GREEN_MAIN }
                        }}
                      >
                        Current Password
                      </InputLabel>
                      <OutlinedInput
                        id="current-password"
                        name="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('currentPassword')}
                              edge="end"
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        }
                        sx={{
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: GREEN_MAIN,
                          },
                        }}
                        label="Current Password"
                      />
                    </FormControl>
                    
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel 
                        htmlFor="new-password" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': { color: GREEN_MAIN }
                        }}
                      >
                        New Password
                      </InputLabel>
                      <OutlinedInput
                        id="new-password"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('newPassword')}
                              edge="end"
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        }
                        sx={{
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: GREEN_MAIN,
                          },
                        }}
                        label="New Password"
                      />
                    </FormControl>
                    
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel 
                        htmlFor="confirm-password" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': { color: GREEN_MAIN }
                        }}
                      >
                        Confirm Password
                      </InputLabel>
                      <OutlinedInput
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                              edge="end"
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        }
                        sx={{
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: GREEN_MAIN,
                          },
                        }}
                        label="Confirm Password"
                      />
                    </FormControl>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={passwordLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={passwordLoading}
                        sx={{
                          bgcolor: GREEN_MAIN,
                          '&:hover': {
                            bgcolor: GREEN_DARK,
                          },
                        }}
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </Box>
                  </Stack>
                </form>
                
                <Box 
                  sx={{ 
                    mt: 4,
                    p: 2,
                    background: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                  }}
                >
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
                    <strong>Password Requirements:</strong>
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
                    <Typography component="li" variant="body2" color="rgba(255, 255, 255, 0.7)">
                      Minimum 6 characters long
                    </Typography>
                    <Typography component="li" variant="body2" color="rgba(255, 255, 255, 0.7)">
                      For security, use a mix of letters, numbers, and special characters
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
      
      {/* Success/Error Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&.MuiAlert-standardSuccess': {
              bgcolor: 'rgba(16, 185, 129, 0.9)',
              color: '#fff',
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper component for displaying information items
const InfoItem = ({ icon, label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography 
      variant="caption" 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        color: 'rgba(255, 255, 255, 0.6)',
        mb: 0.5, 
        gap: 0.5 
      }}
    >
      {icon}
      {label}
    </Typography>
    <Typography 
      variant="body1" 
      noWrap 
      sx={{ 
        pl: 3.5,
        color: value === 'Not provided' || value === 'Not assigned' || value === 'Not specified' 
          ? 'rgba(255, 255, 255, 0.5)' 
          : '#fff'
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default StudentSettings;
