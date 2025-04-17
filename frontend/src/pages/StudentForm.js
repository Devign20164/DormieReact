import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import StudentSidebar from '../components/StudentSidebar';
import NotificationBell from '../components/NotificationBell';

const StudentForm = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [formToCancel, setFormToCancel] = useState(null);
  const [currentForm, setCurrentForm] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Cleaning',
    priority: 'low',
    studentName: '',
    buildingName: '',
    roomNumber: '',
    studentDormNumber: '',
    email: '',
    preferredStartTime: '',
    preferredEndTime: '',
    file: null
  });

  const [submittedForms, setSubmittedForms] = useState([]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/students/profile', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
          
          // Prepopulate form data with user profile information
          setFormData(prev => ({
            ...prev,
            studentName: data.name || '',
            buildingName: data.room?.building || '',
            roomNumber: data.room?.roomNumber || '',
            studentDormNumber: data.studentDormNumber || '',
            email: data.email || '',
          }));
        } else {
          console.error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
    fetchSubmittedForms(); // Fetch forms on component mount
  }, []);

  // Fetch submitted forms from the backend
  const fetchSubmittedForms = async () => {
    try {
      const response = await fetch('/api/students/forms', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmittedForms(data); // Set the fetched forms
      } else {
        console.error('Failed to fetch forms');
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  // Reset form with user data when dialog opens
  const handleOpenDialog = () => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        studentName: userProfile.name || '',
        buildingName: userProfile.room?.building || '',
        roomNumber: userProfile.room?.roomNumber || '',
        studentDormNumber: userProfile.studentDormNumber || '',
        email: userProfile.email || '',
      }));
    }
    setOpenDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData object for file uploads
      const formDataToSend = new FormData();
      
      // Add all form fields to the FormData
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('buildingName', formData.buildingName);
      formDataToSend.append('roomNumber', formData.roomNumber);
      formDataToSend.append('formType', formData.type === 'Cleaning' ? 'Cleaning' : formData.type.charAt(0).toUpperCase() + formData.type.slice(1));
      formDataToSend.append('priority', formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1));
      formDataToSend.append('preferredStartTime', formData.preferredStartTime);
      formDataToSend.append('preferredEndTime', formData.preferredEndTime);
      
      // Add file if it exists
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }
      
      // Make API call to submit form
      const response = await fetch('/api/students/forms', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
        // Don't set Content-Type header, as the browser will set it with the boundary parameter
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Form submitted successfully:', result);
        
        // Refresh the list of forms
        fetchSubmittedForms();
        
        // Reset form and close dialog
        setFormData({
          title: '',
          description: '',
          type: 'Cleaning',
          priority: 'low',
          studentName: '',
          buildingName: '',
          roomNumber: '',
          studentDormNumber: '',
          email: '',
          preferredStartTime: '',
          preferredEndTime: '',
          file: null
        });
        setOpenDialog(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to submit form:', errorData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleViewForm = async (form) => {
    try {
      // Fetch the complete form data from the API
      const response = await fetch(`/api/students/forms/${form.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const formData = await response.json();
        setCurrentForm({
          ...formData,
          // Merge with existing data for compatibility with current UI
          id: formData._id,
          title: formData.title,
          type: formData.formType.toLowerCase(),
          status: formData.status.toLowerCase().replace(' ', '_'),
          date: new Date(formData.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          buildingName: formData.location?.buildingName,
          roomNumber: formData.location?.roomNumber,
          studentDormNumber: formData.studentInfo?.dormNumber,
          email: formData.studentInfo?.email,
          description: formData.description,
          preferredStartTime: formData.preferredTiming?.startTime,
          preferredEndTime: formData.preferredTiming?.endTime
        });
        setViewDialogOpen(true);
      } else {
        console.error('Failed to fetch form details');
      }
    } catch (error) {
      console.error('Error fetching form details:', error);
    }
  };

  const handleCancelForm = async (formId) => {
    setFormToCancel(formId);
    setConfirmDialogOpen(true);
  };

  const confirmCancelForm = async () => {
    try {
      const response = await fetch(`/api/students/forms/${formToCancel}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setViewDialogOpen(false);
        fetchSubmittedForms(); // Refresh the forms list
      } else {
        const errorData = await response.json();
        console.error('Failed to cancel request:', errorData);
      }
    } catch (error) {
      console.error('Error cancelling form:', error);
    } finally {
      setConfirmDialogOpen(false);
      setFormToCancel(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at top right, rgba(255,255,255,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      },
    }}>
      <StudentSidebar />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          pb: 3,
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Service Requests
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Submit and track your service requests
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, alignItems: 'center', gap: 2 }}>
            <NotificationBell userType="student" />
            <Button
              variant="contained"
              onClick={handleOpenDialog}
              startIcon={<AddIcon />}
              sx={{
                background: 'linear-gradient(45deg, #10B981 30%, #059669 90%)',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 3px 5px 2px rgba(16, 185, 129, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #059669 30%, #047857 90%)',
                  boxShadow: '0 3px 5px 2px rgba(16, 185, 129, .4)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Submit New Form
            </Button>
          </Box>
        </Box>

        {/* History Section */}
        <Card sx={{ 
          background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
          borderRadius: '20px',
          p: 3,
          border: '1px solid rgba(255, 255, 255, 0.03)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          mb: 4
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ color: '#10B981' }} />
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                Request History
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {submittedForms.length} requests
            </Typography>
          </Box>

          <List disablePadding>
            {submittedForms.map((form, index) => {
              // Calculate progress percentage based on status
              let progress = 0;
              if (form.status === 'pending') progress = 25;
              else if (form.status === 'in_progress') progress = 75;
              else if (form.status === 'resolved') progress = 100;
              
              return (
                <ListItem 
                  key={form.id}
                  disablePadding
                  sx={{ 
                    display: 'block',
                    py: 2,
                    ...(index < submittedForms.length - 1 && {
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    })
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {form.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                      {form.date}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ 
                        width: '100%', 
                        height: 5, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 5,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: `${progress}%`, 
                          height: '100%', 
                          bgcolor: progress === 100 
                            ? '#10B981' 
                            : progress >= 75 
                            ? '#3B82F6' 
                            : '#F59E0B',
                          transition: 'width 0.5s ease'
                        }}/>
                      </Box>
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: progress === 100 
                          ? '#10B981' 
                          : progress >= 75 
                          ? '#3B82F6' 
                          : '#F59E0B',
                        fontWeight: 500
                      }}
                    >
                      {progress}%
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={form.type}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(16, 185, 129, 0.05)',
                          color: '#10B981',
                          height: '22px',
                          fontSize: '0.7rem',
                        }}
                      />
                      <Chip
                        label={form.status}
                        size="small"
                        sx={{
                          bgcolor: progress === 100 
                            ? 'rgba(16, 185, 129, 0.05)' 
                            : progress >= 75 
                            ? 'rgba(59, 130, 246, 0.05)' 
                            : 'rgba(245, 158, 11, 0.05)',
                          color: progress === 100 
                            ? '#10B981' 
                            : progress >= 75 
                            ? '#3B82F6' 
                            : '#F59E0B',
                          height: '22px',
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <Button
                      size="small"
                      endIcon={<SendIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        color: '#10B981',
                        fontSize: '0.75rem',
                        p: '3px 8px',
                        minWidth: 0,
                        '&:hover': {
                          bgcolor: 'rgba(16, 185, 129, 0.05)',
                        },
                      }}
                      onClick={() => handleViewForm(form)}
                    >
                      View
                    </Button>
                  </Box>
                </ListItem>
              );
            })}
          </List>

          {submittedForms.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                No requests found
              </Typography>
            </Box>
          )}
        </Card>

        {/* Submit Form Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              minWidth: '500px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
          }}>
            Submit a Request
          </DialogTitle>
          
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {/* Student Information Section */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 2,
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ color: '#10B981', mb: 2, fontWeight: 600 }}>
                      Student Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Student Name"
                          name="studentName"
                          value={formData.studentName}
                          onChange={handleInputChange}
                          disabled={!!userProfile}
                          InputProps={{
                            readOnly: !!userProfile
                          }}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              }
                            },
                            '& .Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.7) !important',
                              '-webkit-text-fill-color': 'rgba(255, 255, 255, 0.7) !important'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Student Dorm Number"
                          name="studentDormNumber"
                          value={formData.studentDormNumber}
                          onChange={handleInputChange}
                          disabled={!!userProfile}
                          InputProps={{
                            readOnly: !!userProfile
                          }}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              }
                            },
                            '& .Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.7) !important',
                              '-webkit-text-fill-color': 'rgba(255, 255, 255, 0.7) !important'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Building Name"
                          name="buildingName"
                          value={formData.buildingName}
                          onChange={handleInputChange}
                          disabled={!!userProfile}
                          InputProps={{
                            readOnly: !!userProfile
                          }}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              }
                            },
                            '& .Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.7) !important',
                              '-webkit-text-fill-color': 'rgba(255, 255, 255, 0.7) !important'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Room Number"
                          name="roomNumber"
                          value={formData.roomNumber}
                          onChange={handleInputChange}
                          disabled={!!userProfile}
                          InputProps={{
                            readOnly: !!userProfile
                          }}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              }
                            },
                            '& .Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.7) !important',
                              '-webkit-text-fill-color': 'rgba(255, 255, 255, 0.7) !important'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!!userProfile}
                          InputProps={{
                            readOnly: !!userProfile
                          }}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              }
                            },
                            '& .Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.7) !important',
                              '-webkit-text-fill-color': 'rgba(255, 255, 255, 0.7) !important'
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Preferred Timing Section */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 2,
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ color: '#10B981', mb: 2, fontWeight: 600 }}>
                      Preferred Timing
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Start Time"
                          name="preferredStartTime"
                          type="datetime-local"
                          value={formData.preferredStartTime}
                          onChange={handleInputChange}
                          required
                          size="small"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="End Time"
                          name="preferredEndTime"
                          type="time"
                          value={formData.preferredEndTime ? 
                            (formData.preferredEndTime.includes('T') ? formData.preferredEndTime.split('T')[1] : formData.preferredEndTime) 
                            : ''}
                          onChange={(e) => {
                            const timeOnly = e.target.value;
                            let fullDateTime = timeOnly;
                            
                            // If we have a start date, combine it with this time
                            if (formData.preferredStartTime && formData.preferredStartTime.includes('T')) {
                              const datePart = formData.preferredStartTime.split('T')[0];
                              fullDateTime = `${datePart}T${timeOnly}`;
                            }
                            
                            setFormData(prev => ({
                              ...prev,
                              preferredEndTime: fullDateTime
                            }));
                          }}
                          required
                          size="small"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Task Details Section */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 2,
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ color: '#10B981', mb: 2, fontWeight: 600 }}>
                      Task Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#10B981',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#9CA3AF',
                              '&.Mui-focused': {
                                color: '#10B981',
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ 
                            color: '#9CA3AF',
                            '&.Mui-focused': {
                              color: '#10B981',
                            },
                          }}>
                            Type
                          </InputLabel>
                          <Select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            label="Type"
                            sx={{
                              color: '#fff',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10B981',
                              },
                              '& .MuiSvgIcon-root': {
                                color: '#9CA3AF',
                              },
                            }}
                          >
                            <MenuItem value="Cleaning">Cleaning</MenuItem>
                            <MenuItem value="Maintenance">Maintenance</MenuItem>
                            <MenuItem value="Repair">Repair</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ 
                            color: '#9CA3AF',
                            '&.Mui-focused': {
                              color: '#10B981',
                            },
                          }}>
                            Priority
                          </InputLabel>
                          <Select
                            name="priority"
                            value={formData.priority}
                            onChange={handleInputChange}
                            label="Priority"
                            sx={{
                              color: '#fff',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.1)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(16, 185, 129, 0.5)',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10B981',
                              },
                              '& .MuiSvgIcon-root': {
                                color: '#9CA3AF',
                              },
                            }}
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Box
                          sx={{
                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: 'rgba(16, 185, 129, 0.5)',
                              backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            },
                          }}
                        >
                          <input
                            accept=".png,.jpg,.jpeg,.pdf"
                            style={{ display: 'none' }}
                            id="file-upload"
                            type="file"
                            onChange={handleFileChange}
                          />
                          <label htmlFor="file-upload">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 1 }}>
                                {formData.file ? formData.file.name : 'Upload Supporting Documents'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                (PNG, JPG, or PDF files)
                              </Typography>
                            </Box>
                          </label>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                sx={{ 
                  color: '#9CA3AF',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                endIcon={<SendIcon />}
                sx={{
                  background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                    background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                  },
                }}
              >
                Submit Request
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* View Form Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              minWidth: '500px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            },
          }}
        >
          {currentForm && (
            <>
              <DialogTitle sx={{ 
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6">{currentForm.title}</Typography>
                <Chip
                  label={currentForm.status}
                  size="small"
                  sx={{
                    bgcolor: currentForm.status === 'pending'
                      ? 'rgba(245, 158, 11, 0.1)'
                      : currentForm.status === 'in_progress'
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(16, 185, 129, 0.1)',
                    color: currentForm.status === 'pending'
                      ? '#F59E0B'
                      : currentForm.status === 'in_progress'
                      ? '#3B82F6'
                      : '#10B981',
                    fontWeight: 500,
                  }}
                />
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  {/* Request Info */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 2,
                        mb: 2
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ color: '#10B981', mb: 2, fontWeight: 600 }}>
                        Request Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Type
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {currentForm.type}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Date Submitted
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {currentForm.date}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 1 }}>
                            Description
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {currentForm.description || 'Room maintenance required for the sink and bathroom fixtures.'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Location Info */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 2,
                        mb: 2
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ color: '#10B981', mb: 2, fontWeight: 600 }}>
                        Location Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Building
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {currentForm.buildingName || 'West Hall'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Room Number
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {currentForm.roomNumber || '203B'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Student Dorm Number
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {currentForm.studentDormNumber || 'D2023-456'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {currentForm.email || 'student@example.com'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Status Timeline */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ color: '#10B981', mb: 2, fontWeight: 600 }}>
                        Status Timeline
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ 
                            width: '100%', 
                            height: 8, 
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 5,
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <Box sx={{ 
                              width: currentForm.status === 'resolved' 
                                ? '100%' 
                                : currentForm.status === 'in_progress' 
                                ? '66%' 
                                : '33%',
                              height: '100%', 
                              bgcolor: currentForm.status === 'resolved'
                                ? '#10B981' 
                                : currentForm.status === 'in_progress'
                                ? '#3B82F6' 
                                : '#F59E0B',
                              transition: 'width 0.5s ease'
                            }}/>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              bgcolor: '#F59E0B', 
                              mx: 'auto',
                              mb: 0.5
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                            Submitted
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>
                            {currentForm.date}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              bgcolor: currentForm.status === 'pending' ? 'rgba(255, 255, 255, 0.1)' : '#3B82F6', 
                              mx: 'auto',
                              mb: 0.5
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                            In Progress
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentForm.status === 'pending' ? 'rgba(255, 255, 255, 0.3)' : '#fff', fontWeight: 500 }}>
                            {currentForm.status !== 'pending' ? 'Yesterday' : '--'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              bgcolor: currentForm.status === 'resolved' ? '#10B981' : 'rgba(255, 255, 255, 0.1)', 
                              mx: 'auto',
                              mb: 0.5
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                            Completed
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentForm.status === 'resolved' ? '#fff' : 'rgba(255, 255, 255, 0.3)', fontWeight: 500 }}>
                            {currentForm.status === 'resolved' ? 'Today' : '--'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                {currentForm.status !== 'resolved' && (
                  <Button 
                    variant="text"
                    sx={{ 
                      color: '#EF4444',
                      '&:hover': {
                        background: 'rgba(239, 68, 68, 0.05)',
                      },
                    }}
                    onClick={() => handleCancelForm(currentForm.id)}
                  >
                    Cancel Request
                  </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button 
                  onClick={() => setViewDialogOpen(false)}
                  sx={{ 
                    color: '#9CA3AF',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            color: '#fff',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Cancel Request
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#9CA3AF' }}>
            Are you sure you want to cancel this request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <Button 
            onClick={() => setConfirmDialogOpen(false)} 
            sx={{ 
              color: '#9CA3AF',
              '&:hover': {
                background: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            No, Keep It
          </Button>
          <Button 
            onClick={confirmCancelForm}
            variant="contained"
            sx={{
              bgcolor: '#EF4444',
              color: '#fff',
              '&:hover': {
                bgcolor: '#DC2626',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              },
            }}
          >
            Yes, Cancel Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentForm;
