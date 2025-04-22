import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Divider,
  Alert,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Done as DoneIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { format } from 'date-fns';
import StaffSidebar from '../components/StaffSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { toast } from 'react-toastify';

const StaffAssignment = () => {
  // State variables
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formDetailOpen, setFormDetailOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned');
  const [completionNotes, setCompletionNotes] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0
  });

  // Handle attachment download
  const handleAttachmentClick = (file) => {
    try {
      const fileUrl = file.fileUrl || `/uploads/${file.filename || file.fileName}`;
      const fullUrl = `${process.env.REACT_APP_API_URL || ''}${fileUrl}`;
      fetch(fullUrl, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
          return res.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const name = file.originalname || file.fileName || file.filename || 'download';
          link.download = name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('File download started');
        })
        .catch(err => {
          console.error('Download error:', err);
          toast.error('Failed to download file');
        });
    } catch (err) {
      console.error('Error in handleAttachmentClick:', err);
      toast.error('Error downloading file');
    }
  };

  // Fetch assigned forms
  useEffect(() => {
    const fetchAssignedForms = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/staff/forms', {
          withCredentials: true
        });
        
        if (response.data && response.data.forms) {
          setForms(response.data.forms);
          setStats(response.data.stats || {
            total: response.data.forms.length,
            assigned: response.data.forms.filter(f => f.status === 'Assigned').length,
            inProgress: response.data.forms.filter(f => f.status === 'In Progress').length,
            completed: response.data.forms.filter(f => f.status === 'Completed').length
          });
        } else {
          setForms([]);
          setStats({
            total: 0,
            assigned: 0,
            inProgress: 0,
            completed: 0
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assigned forms:', err);
        setError(err.response?.data?.message || 'Failed to fetch assigned forms');
        setLoading(false);
        toast.error('Failed to load your assignments');
      }
    };

    fetchAssignedForms();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filter forms based on active tab
  const filteredForms = forms.filter(form => {
    switch (activeTab) {
      case 'assigned':
        return form.status === 'Assigned';
      case 'inProgress':
        return form.status === 'In Progress';
      case 'completed':
        return form.status === 'Completed';
      default:
        return true;
    }
  });

  // Open form detail dialog
  const handleOpenFormDetail = (form) => {
    setSelectedForm(form);
    setFormDetailOpen(true);
  };

  // Close form detail dialog
  const handleCloseFormDetail = () => {
    setFormDetailOpen(false);
    setSelectedForm(null);
    setCompletionNotes('');
  };

  // Start working on a form
  const handleStartForm = async (formId) => {
    try {
      setStatusLoading(true);
      
      const response = await axios.put(`/api/staff/forms/${formId}/status`, {
        status: 'In Progress',
        notes: 'Work started by staff'
      }, {
        withCredentials: true
      });
      
      if (response.data) {
        // Update local forms state
        setForms(prevForms => 
          prevForms.map(form => form._id === formId ? response.data : form)
        );
        
        // Update stats
        setStats(prev => ({
          ...prev,
          assigned: Math.max(0, prev.assigned - 1),
          inProgress: prev.inProgress + 1
        }));
        
        toast.success('Form status updated to In Progress');
        
        // Close dialog if open
        if (formDetailOpen) {
          handleCloseFormDetail();
        }
      }
    } catch (err) {
      console.error('Error updating form status:', err);
      toast.error(err.response?.data?.message || 'Failed to update form status');
    } finally {
      setStatusLoading(false);
    }
  };

  // Complete a form
  const handleCompleteForm = async (formId) => {
    try {
      setStatusLoading(true);
      
      const response = await axios.put(`/api/staff/forms/${formId}/status`, {
        status: 'Completed',
        notes: completionNotes || 'Work completed by staff'
      }, {
        withCredentials: true
      });
      
      if (response.data) {
        // Update local forms state
        setForms(prevForms => 
          prevForms.map(form => form._id === formId ? response.data : form)
        );
        
        // Update stats
        setStats(prev => ({
          ...prev,
          inProgress: Math.max(0, prev.inProgress - 1),
          completed: prev.completed + 1
        }));
        
        toast.success('Form status updated to Completed');
        
        // Close dialog
        handleCloseFormDetail();
      }
    } catch (err) {
      console.error('Error completing form:', err);
      toast.error(err.response?.data?.message || 'Failed to complete form');
    } finally {
      setStatusLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'Assigned': '#8B5CF6',  // Purple
      'In Progress': '#EC4899', // Pink
      'Completed': '#10B981',  // Green
    };
    return statusColors[status] || '#6B7280'; // Default gray
  };

  // Get form type color
  const getFormTypeColor = (type) => {
    const typeColors = {
      'Cleaning': '#3B82F6',   // Blue
      'Maintenance': '#F59E0B', // Amber
      'Repair': '#EF4444',     // Red
    };
    return typeColors[type] || '#6B7280'; // Default gray
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
      <StaffSidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 4,
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
              My Assignments
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Manage and track your maintenance tasks
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <NotificationBell userType="staff" color="#3B82F6" />
          </Stack>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
            <CircularProgress sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ 
            my: 2, 
            bgcolor: 'rgba(239, 68, 68, 0.1)', 
            color: '#EF4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px',
                  p: 3,
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                  },
                }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>Assigned</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 600, 
                      color: '#fff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}>
                      {stats.assigned}
                    </Typography>
                    <AssignmentIcon sx={{ ml: 2, color: '#8B5CF6' }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px',
                  p: 3,
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                  },
                }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>In Progress</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 600, 
                      color: '#fff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}>
                      {stats.inProgress}
                    </Typography>
                    <PlayArrowIcon sx={{ ml: 2, color: '#EC4899' }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px',
                  p: 3,
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                  },
                }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>Completed</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 600, 
                      color: '#fff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}>
                      {stats.completed}
                    </Typography>
                    <DoneIcon sx={{ ml: 2, color: '#10B981' }} />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px',
                  p: 3,
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                  },
                }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>Total Assignments</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 600, 
                      color: '#fff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}>
                      {stats.total}
                    </Typography>
                    <InfoIcon sx={{ ml: 2, color: '#6B7280' }} />
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs for filtering forms */}
            <Paper sx={{ 
              mb: 3, 
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              }
            }}>
              <Tabs 
                value={activeTab}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    height: '3px',
                    borderRadius: '3px 3px 0 0',
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    py: 1.5,
                    '&:hover': {
                      color: 'rgba(255, 255, 255, 0.8)',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&.Mui-selected': {
                      color: '#ffffff',
                      fontWeight: 600,
                    },
                  }
                }}
              >
                <Tab 
                  label={`Assigned (${stats.assigned})`} 
                  value="assigned" 
                  icon={<AssignmentIcon />} 
                  iconPosition="start"
                />
                <Tab 
                  label={`In Progress (${stats.inProgress})`} 
                  value="inProgress" 
                  icon={<PlayArrowIcon />} 
                  iconPosition="start"
                />
                <Tab 
                  label={`Completed (${stats.completed})`} 
                  value="completed" 
                  icon={<CheckCircleIcon />} 
                  iconPosition="start"
                />
              </Tabs>
            </Paper>

            {/* Form List */}
            {filteredForms.length === 0 ? (
              <Alert severity="info" sx={{ 
                my: 2,
                bgcolor: 'rgba(255, 255, 255, 0.05)', 
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                No {activeTab === 'assigned' ? 'assigned' : activeTab === 'inProgress' ? 'in progress' : 'completed'} forms found.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {filteredForms.map(form => (
                  <Grid item xs={12} md={6} lg={4} key={form._id}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                      },
                      overflow: 'hidden',
                    }}>
                      <Box sx={{ 
                        height: 8, 
                        bgcolor: getFormTypeColor(form.formType),
                      }} />
                      
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        {/* Form Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Chip 
                            label={form.formType} 
                            size="small"
                            sx={{ 
                              bgcolor: `${getFormTypeColor(form.formType)}20`, 
                              color: getFormTypeColor(form.formType),
                              fontWeight: 'bold', 
                              border: `1px solid ${getFormTypeColor(form.formType)}40`
                            }} 
                          />
                          <Chip 
                            label={form.status} 
                            size="small"
                            sx={{ 
                              bgcolor: `${getStatusColor(form.status)}20`, 
                              color: getStatusColor(form.status),
                              fontWeight: 'bold',
                              border: `1px solid ${getStatusColor(form.status)}40`
                            }} 
                          />
                        </Box>
                        
                        {/* Form Title */}
                        <Typography variant="h6" sx={{ 
                          mb: 1,
                          color: '#fff',
                          fontWeight: 600
                        }}>
                          {form.title || `${form.formType} Request`}
                        </Typography>
                        
                        {/* Student Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {form.student?.name || 'Unknown Student'}
                          </Typography>
                        </Box>
                        
                        {/* Location */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationIcon fontSize="small" sx={{ mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {form.student?.room?.building?.name 
                              ? `${form.student.room.building.name}, Room ${form.student.room.roomNumber}` 
                              : 'Location unavailable'}
                          </Typography>
                        </Box>
                        
                        {/* Schedule */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EventIcon fontSize="small" sx={{ mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {form.preferredStartTime 
                              ? format(new Date(form.preferredStartTime), 'MMM d, yyyy') 
                              : 'Schedule unavailable'}
                          </Typography>
                        </Box>
                        
                        {/* Time */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {form.preferredStartTime 
                              ? format(new Date(form.preferredStartTime), 'h:mm a') 
                              : 'Time unavailable'}
                            {form.endTime && ` - ${format(new Date(form.endTime), 'h:mm a')}`}
                          </Typography>
                        </Box>
                        
                        {/* Description Preview */}
                        <Typography variant="body2" sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          color: 'rgba(255,255,255,0.5)'
                        }}>
                          {form.description || 'No description provided.'}
                        </Typography>
                      </CardContent>
                      
                      {/* Actions */}
                      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => handleOpenFormDetail(form)}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              borderColor: '#3B82F6',
                              color: '#3B82F6',
                              bgcolor: 'rgba(59, 130, 246, 0.1)'
                            }
                          }}
                        >
                          View Details
                        </Button>
                        
                        {form.status === 'Assigned' && (
                          <Button 
                            variant="contained" 
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleStartForm(form._id)}
                            disabled={statusLoading}
                            sx={{
                              bgcolor: '#3B82F6',
                              '&:hover': {
                                bgcolor: '#2563EB',
                              },
                              '&.Mui-disabled': {
                                bgcolor: 'rgba(59, 130, 246, 0.3)',
                              }
                            }}
                          >
                            {statusLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Start'}
                          </Button>
                        )}
                        
                        {form.status === 'In Progress' && (
                          <Button 
                            variant="contained" 
                            size="small"
                            startIcon={<DoneIcon />}
                            onClick={() => handleOpenFormDetail(form)}
                            disabled={statusLoading}
                            sx={{
                              bgcolor: '#10B981',
                              '&:hover': {
                                bgcolor: '#059669',
                              },
                              '&.Mui-disabled': {
                                bgcolor: 'rgba(16, 185, 129, 0.3)',
                              }
                            }}
                          >
                            {statusLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Complete'}
                          </Button>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {/* Form Detail Dialog */}
            <Dialog 
              open={formDetailOpen} 
              onClose={handleCloseFormDetail}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  color: '#fff',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                }
              }}
            >
              {selectedForm && (
                <>
                  {/* Status color strip */}
                  <Box sx={{ 
                    height: 6, 
                    background: `linear-gradient(90deg, ${getStatusColor(selectedForm.status)}80, ${getStatusColor(selectedForm.status)}40)`
                  }} />
                  
                  {/* Header with title, chips and close button */}
                  <Box sx={{ 
                    p: 3,
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(10, 10, 10, 0.5)',
                  }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                        {selectedForm.title || `${selectedForm.formType} Request`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={selectedForm.formType} 
                          size="small"
                          sx={{ 
                            bgcolor: `${getFormTypeColor(selectedForm.formType)}20`, 
                            color: getFormTypeColor(selectedForm.formType),
                            border: `1px solid ${getFormTypeColor(selectedForm.formType)}40`
                          }} 
                        />
                        <Chip 
                          label={selectedForm.status} 
                          size="small"
                          sx={{ 
                            bgcolor: `${getStatusColor(selectedForm.status)}20`, 
                            color: getStatusColor(selectedForm.status),
                            border: `1px solid ${getStatusColor(selectedForm.status)}40`
                          }} 
                        />
                      </Box>
                    </Box>
                    <IconButton 
                      onClick={handleCloseFormDetail}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        '&:hover': {
                          color: 'rgba(255, 255, 255, 0.9)',
                          bgcolor: 'rgba(255, 255, 255, 0.05)'
                        }
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </IconButton>
                  </Box>
                  
                  {/* Main content with simple 2-column layout */}
                  <Box sx={{ 
                    p: 0,
                    background: 'linear-gradient(145deg, #0F0F0F 0%, #0A0A0A 100%)',
                  }}>
                    <Grid container>
                      {/* Left column - Student info & Status history */}
                      <Grid item xs={12} md={5} sx={{ 
                        p: { xs: 3, md: 3.5 },
                        borderRight: { md: '1px solid rgba(255,255,255,0.05)' }
                      }}>
                        {/* Student Information */}
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="subtitle1" sx={{ 
                            color: '#fff', 
                            fontWeight: 600,
                            fontSize: '1rem',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}>
                            <PersonIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} /> 
                            Student Information
                          </Typography>
                          
                          <Paper sx={{ 
                            p: 2.5,
                            background: 'rgba(15, 23, 42, 0.3)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                          }}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
                                Name
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {selectedForm.student?.name || 'Unknown'}
                              </Typography>
                            </Box>
                            
                            <Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
                                Location
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {selectedForm.student?.room?.building?.name
                                  ? `${selectedForm.student.room.building.name}, Room ${selectedForm.student.room.roomNumber}`
                                  : 'Location unavailable'
                                }
                              </Typography>
                            </Box>
                          </Paper>
                        </Box>
                        
                        {/* Status History */}
                        <Box>
                          <Typography variant="subtitle1" sx={{ 
                            color: '#fff', 
                            fontWeight: 600,
                            fontSize: '1rem',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}>
                            <InfoIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} /> 
                            Status Timeline
                          </Typography>
                          
                          <Paper sx={{ 
                            p: 2.5,
                            background: 'rgba(15, 23, 42, 0.3)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                          }}>
                            {selectedForm.statusHistory && selectedForm.statusHistory.length > 0 ? (
                              <Box sx={{ position: 'relative' }}>
                                {/* Timeline line */}
                                <Box sx={{ 
                                  position: 'absolute',
                                  left: 10,
                                  top: 6,
                                  bottom: 6,
                                  width: 1,
                                  bgcolor: 'rgba(255,255,255,0.05)',
                                }} />
                                
                                {[...selectedForm.statusHistory].reverse().map((history, index) => (
                                  <Box key={index} sx={{ 
                                    position: 'relative',
                                    pl: 4,
                                    pb: index < selectedForm.statusHistory.length - 1 ? 3 : 0 
                                  }}>
                                    {/* Status icon */}
                                    <Box sx={{ 
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      width: 20,
                                      height: 20,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '50%',
                                      bgcolor: history.status === 'Completed' 
                                        ? 'rgba(16, 185, 129, 0.2)' 
                                        : history.status === 'In Progress' 
                                          ? 'rgba(236, 72, 153, 0.2)' 
                                          : 'rgba(255, 255, 255, 0.1)',
                                      zIndex: 1,
                                    }}>
                                      {history.status === 'Completed' ? (
                                        <CheckCircleIcon fontSize="small" sx={{ fontSize: 16, color: '#10B981' }} />
                                      ) : history.status === 'In Progress' ? (
                                        <PlayArrowIcon fontSize="small" sx={{ fontSize: 16, color: '#EC4899' }} />
                                      ) : (
                                        <InfoIcon fontSize="small" sx={{ fontSize: 16, color: '#9CA3AF' }} />
                                      )}
                                    </Box>
                                    
                                    {/* Status content */}
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                        {history.status}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                                        {history.changedAt ? format(new Date(history.changedAt), 'MMM d, yyyy - h:mm a') : 'Date unknown'}
                                      </Typography>
                                      {history.notes && (
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                          {history.notes}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                No status history available.
                              </Typography>
                            )}
                          </Paper>
                        </Box>
                      </Grid>
                      
                      {/* Right column - Request details & Schedule */}
                      <Grid item xs={12} md={7} sx={{ 
                        p: { xs: 3, md: 3.5 },
                        borderTop: { xs: '1px solid rgba(255,255,255,0.05)', md: 'none' }
                      }}>
                        {/* Request Details */}
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="subtitle1" sx={{ 
                            color: '#fff', 
                            fontWeight: 600,
                            fontSize: '1rem',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}>
                            <DescriptionIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} /> 
                            Request Details
                          </Typography>
                          
                          <Paper sx={{ 
                            p: 2.5,
                            background: 'rgba(15, 23, 42, 0.3)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                            mb: 4,
                          }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
                              {selectedForm.description || 'No description provided.'}
                            </Typography>
                          </Paper>
                        </Box>
                        
                        {/* Attachments Section */}
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="subtitle1" sx={{
                            color: '#3B82F6', mb: 2, fontWeight: 600,
                            borderBottom: '1px solid rgba(59, 130, 246, 0.2)', pb: 1,
                            display: 'flex', alignItems: 'center', gap: 1
                          }}>
                            <AttachFileIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} />
                            Attachments
                          </Typography>
                          {selectedForm.attachments && selectedForm.attachments.length > 0 ? (
                            <Box sx={{ mb: 2 }}>
                              <Paper sx={{
                                bgcolor: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden'
                              }}>
                                {selectedForm.attachments.map((file, index) => (
                                  <Box key={index} sx={{
                                    ...(index !== 0 && { borderTop: '1px solid rgba(255,255,255,0.05)' })
                                  }}>
                                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', width: 40, height: 40 }}>
                                        <InsertDriveFileIcon />
                                      </Avatar>
                                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {file.originalname || file.fileName || file.filename || 'Attachment'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                          {new Date(file.uploadDate || Date.now()).toLocaleDateString()}
                                        </Typography>
                                      </Box>
                                      <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={() => handleAttachmentClick(file)} sx={{
                                        bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#fff',
                                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' }, borderRadius: '8px'
                                      }}>
                                        Download
                                      </Button>
                                    </Box>
                                  </Box>
                                ))}
                              </Paper>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <BlockIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                No attachments provided
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        
                        {/* Schedule Information */}
                        <Box sx={{ mb: selectedForm.status === 'In Progress' ? 4 : 0 }}>
                          <Typography variant="subtitle1" sx={{ 
                            color: '#fff', 
                            fontWeight: 600,
                            fontSize: '1rem',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}>
                            <EventIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} /> 
                            Schedule Information
                          </Typography>
                          
                          <Paper sx={{ 
                            p: 2.5,
                            background: 'rgba(15, 23, 42, 0.3)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                          }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
                                    Date
                                  </Typography>
                                  <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                    {selectedForm.preferredStartTime 
                                      ? format(new Date(selectedForm.preferredStartTime), 'MMMM d, yyyy')
                                      : 'Not specified'
                                    }
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
                                    Time
                                  </Typography>
                                  <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                    {selectedForm.preferredStartTime 
                                      ? format(new Date(selectedForm.preferredStartTime), 'h:mm a')
                                      : 'Not specified'
                                    }
                                    {selectedForm.endTime && ` - ${format(new Date(selectedForm.endTime), 'h:mm a')}`}
                                  </Typography>
                                </Box>
                              </Grid>
                              {selectedForm.duration && (
                                <Grid item xs={12}>
                                  <Box>
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
                                      Estimated Duration
                                    </Typography>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                      {selectedForm.duration} minutes
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                        </Box>
                        
                        {/* If the form is in progress, show completion form */}
                        {selectedForm.status === 'In Progress' && (
                          <Box sx={{ mt: 4 }}>
                            <Typography variant="subtitle1" sx={{ 
                              color: '#fff', 
                              fontWeight: 600,
                              fontSize: '1rem',
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}>
                              <CheckCircleIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} /> 
                              Mark as Complete
                            </Typography>
                            
                            <Paper sx={{ 
                              p: 2.5,
                              background: 'rgba(15, 23, 42, 0.3)',
                              borderRadius: '12px',
                              border: '1px solid rgba(255, 255, 255, 0.03)',
                            }}>
                              <TextField
                                label="Completion Notes"
                                multiline
                                rows={3}
                                fullWidth
                                value={completionNotes}
                                onChange={e => setCompletionNotes(e.target.value)}
                                placeholder="Provide notes about the completed work..."
                                variant="outlined"
                                sx={{ 
                                  mb: 2,
                                  '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': {
                                      borderColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                    '&:hover fieldset': {
                                      borderColor: 'rgba(255, 255, 255, 0.25)',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                  },
                                  '& .MuiInputLabel-root': {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                  },
                                  '& .MuiInputLabel-root.Mui-focused': {
                                    color: 'rgba(255, 255, 255, 0.9)',
                                  },
                                }}
                                InputProps={{
                                  sx: { 
                                    color: 'white',
                                    '&::placeholder': {
                                      color: 'rgba(255, 255, 255, 0.5)'
                                    }
                                  }
                                }}
                              />
                              
                              <Button
                                variant="contained"
                                startIcon={<CheckCircleIcon />}
                                fullWidth
                                onClick={() => handleCompleteForm(selectedForm._id)}
                                disabled={statusLoading}
                                sx={{
                                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                                  color: '#ffffff',
                                  '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                  },
                                  '&.Mui-disabled': {
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    color: 'rgba(255, 255, 255, 0.3)'
                                  }
                                }}
                              >
                                {statusLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Mark as Completed'}
                              </Button>
                            </Paper>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Footer with actions */}
                  <Box sx={{ 
                    px: 3.5, 
                    py: 2.5, 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                  }}>
                    <Button 
                      onClick={handleCloseFormDetail}
                      variant="outlined"
                      sx={{ 
                        color: 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        px: 3,
                        '&:hover': {
                          color: '#fff',
                          borderColor: 'rgba(255,255,255,0.3)',
                          bgcolor: 'rgba(255,255,255,0.05)'
                        }
                      }}
                    >
                      Close
                    </Button>
                    
                    {selectedForm.status === 'Assigned' && (
                      <Button 
                        variant="contained" 
                        startIcon={<PlayArrowIcon />}
                        onClick={() => handleStartForm(selectedForm._id)}
                        disabled={statusLoading}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          px: 3,
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&.Mui-disabled': {
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            color: 'rgba(255, 255, 255, 0.3)'
                          }
                        }}
                      >
                        {statusLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Start Work'}
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </Dialog>
          </>
        )}
      </Box>
    </Box>
  );
};

export default StaffAssignment;
