import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack,
  Avatar,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Snackbar,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  CleaningServices as CleaningIcon,
  Construction as RepairIcon,
  Person as PersonIcon,
  Room as RoomIcon,
  Apartment as BuildingIcon,
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  Info as InfoIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationsIcon,
  AssignmentInd,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { alpha } from '@mui/material/styles';

const AdminForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { socket, isConnected } = useSocket();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Function to map request type to staff type
  const staffTypeForRequestType = (requestType) => {
    switch(requestType) {
      case 'Cleaning':
        return 'Cleaner';
      case 'Maintenance':
      case 'Repair':
        return 'Maintenance';
      default:
        return 'Maintenance';
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/admin/notifications');
      setNotifications(response.data);
      updateUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Update unread count
  const updateUnreadCount = async () => {
    try {
      const response = await axios.get('/api/admin/notifications/unread/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected || !userData._id) return;

    console.log('Admin joining socket with ID:', userData._id);
    socket.emit('join', userData._id.toString());

    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    socket.on('notificationUpdate', ({ type, notificationId }) => {
      if (type === 'read') {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else if (type === 'delete') {
        setNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
      }
    });

    return () => {
      socket.off('newNotification');
      socket.off('notificationUpdate');
    };
  }, [socket, isConnected, userData._id]);

  // Mark notification as read and delete it
  const handleNotificationClick = async (notificationId) => {
    try {
      await axios.delete(`/api/admin/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      updateUnreadCount();

      if (socket && isConnected) {
        socket.emit('notificationDelete', {
          notificationId,
          userId: userData._id
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Delete all notifications
  const handleMarkAllRead = async () => {
    try {
      const response = await axios.delete('/api/admin/notifications/delete-all');
      
      if (response.data.deletedCount === 0) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        
        if (socket && isConnected) {
          socket.emit('allNotificationsDeleted', {
            userId: userData._id
          });
        }
      }
      
      handleClose();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  // Menu handlers
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch all forms
  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/forms', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }

      const data = await response.json();
      console.log('All forms data:', data.map(form => ({
        id: form._id,
        actualStartTime: form.actualStartTime,
        scheduledDate: form.scheduledDate
      })));
      setForms(data);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Error loading forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  // Socket.IO event handlers for form updates
  useEffect(() => {
    if (!socket || !isConnected || !userData._id) return;

    socket.emit('join', userData._id.toString());

    // Listen for new form submissions
    socket.on('newForm', (form) => {
      console.log('New form received:', form);
      
      // Ensure the form has all required fields with defaults
      const processedForm = {
        _id: form._id || '',
        description: form.description || '',
        status: form.status || 'Pending',
        requestType: form.requestType || '',
        userName: form.userName || form.user?.name || '',
        roomNumber: form.roomNumber || form.room?.roomNumber || '',
        buildingName: form.buildingName || form.building?.name || '',
        submissionDate: form.submissionDate || new Date().toISOString(),
        actualStartTime: form.actualStartTime || null,
        scheduledDate: form.scheduledDate || null,
        filePath: form.filePath || null,
        studentDormNumber: form.studentDormNumber || form.user?.studentDormNumber || '',
      };

      // Add the new form to the beginning of the list
      setForms(prev => {
        // Check if form already exists to prevent duplicates
        const exists = prev.some(f => f._id === processedForm._id);
        if (exists) {
          return prev.map(f => f._id === processedForm._id ? processedForm : f);
        }
        return [processedForm, ...prev];
      });
      
      // Show notification for new form with proper name handling
      toast.info(`New ${processedForm.requestType || 'request'} Submitted`);
    });

    // Listen for form status updates
    socket.on('formUpdate', ({ formId, status, updatedForm }) => {
      console.log('Form update received:', { formId, status, updatedForm });
      setForms(prev => prev.map(form => 
        form._id === formId ? { 
          ...form,
          ...updatedForm,
          status: status || updatedForm?.status || form.status
        } : form
      ));
    });

    // Listen for form assignment updates
    socket.on('formAssigned', ({ formId, staffId, updatedForm }) => {
      console.log('Form assigned:', { formId, staffId, updatedForm });
      setForms(prev => prev.map(form => 
        form._id === formId ? { 
          ...form,
          ...updatedForm,
          staff: updatedForm.staff,
          status: 'Assigned'
        } : form
      ));
      
      toast.success(`Form successfully assigned to staff`);
    });

    // Clean up socket listeners
    return () => {
      socket.off('newForm');
      socket.off('formUpdate');
      socket.off('formAssigned');
    };
  }, [socket, isConnected, userData._id]);

  const handleUpdateStatus = async (formId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/forms/${formId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update form status');
      }

      // Update the forms state with the returned updated form
      setForms(forms.map(form => 
        form._id === formId ? data.form : form
      ));
      
      // Explicitly emit the socket event from the client as well for redundancy
      if (socket && isConnected) {
        console.log(`Emitting formStatusUpdated event for form ${formId} with status ${newStatus}`);
        
        // Find the updated form with complete data
        const updatedForm = forms.find(form => form._id === formId);
        
        if (updatedForm) {
          socket.emit('formStatusUpdated', {
            formId,
            status: newStatus,
            updatedForm: data.form || updatedForm,
            type: updatedForm.requestType
          });
        }
      }
      
      toast.success('Form status updated successfully');
    } catch (error) {
      console.error('Error updating form status:', error);
      toast.error(error.message || 'Error updating form status');
    }
  };

  const getRequestTypeIcon = (type) => {
    switch (type) {
      case 'Cleaning':
        return <CleaningIcon sx={{ fontSize: 24, color: '#10B981' }} />;
      case 'Maintenance':
        return <BuildIcon sx={{ fontSize: 24, color: '#FBBF24' }} />;
      case 'Repair':
        return <RepairIcon sx={{ fontSize: 24, color: '#EF4444' }} />;
      default:
        return <AssignmentIcon sx={{ fontSize: 24, color: '#3B82F6' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'Pending':
        return { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.1)' };
      case 'Declined':
        return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'Approved':
        return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
      default:
        return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
    }
  };

  const filteredForms = forms.filter(form => {
    if (selectedStatus === 'all') return true;
    return form.status === selectedStatus;
  });

  const handleOpenFormDetails = (form) => {
    console.log('Opening form details:', {
      id: form._id,
      actualStartTime: form.actualStartTime,
      actualStartTimeType: typeof form.actualStartTime,
      scheduledDate: form.scheduledDate,
      submissionDate: form.submissionDate,
      fullForm: form
    });
    setSelectedForm(form);
    setOpenFormDialog(true);
  };

  const handleCloseFormDetails = () => {
    setOpenFormDialog(false);
    setSelectedForm(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not specified';
      return format(date, 'MMM dd, yyyy ');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not specified';
    }
  };

  const renderFormCard = (form) => (
    <Card
      key={form._id}
      sx={{
        background: 'linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        mb: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          borderColor: 'rgba(255,255,255,0.1)'
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Grid container alignItems="center" spacing={3}>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.04)',
                width: 48,
                height: 48,
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {getRequestTypeIcon(form.requestType)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                    {form.requestType} Request
                  </Typography>
                  <Chip
                    label={form.status}
                    size="small"
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 600,
                      px: 1,
                      backgroundColor: getStatusColor(form.status).bg,
                      color: getStatusColor(form.status).color,
                      border: '1px solid',
                      borderColor: 'currentColor'
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                  {(form.description || '').substring(0, 120)}...
                </Typography>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <PersonIcon sx={{ fontSize: 16 }} />
                    {form.userName}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <RoomIcon sx={{ fontSize: 16 }} />
                    {form.roomNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <CalendarIcon sx={{ fontSize: 16 }} />
                    {form.submissionDate ? format(new Date(form.submissionDate), 'MMM dd, yyyy') : 'No date'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={() => handleOpenFormDetails(form)}
                startIcon={<InfoIcon />}
                size="small"
                sx={{
                  bgcolor: 'rgba(59,130,246,0.1)',
                  color: '#3B82F6',
                  '&:hover': {
                    bgcolor: 'rgba(59,130,246,0.2)'
                  }
                }}
              >
                Details
              </Button>
              {form.status === 'Pending' && (
                <>
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateStatus(form._id, 'Approved')}
                    startIcon={<DoneIcon />}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(16,185,129,0.1)',
                      color: '#10B981',
                      '&:hover': {
                        bgcolor: 'rgba(16,185,129,0.2)'
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateStatus(form._id, 'Declined')}
                    startIcon={<CloseIcon />}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(239,68,68,0.1)',
                      color: '#EF4444',
                      '&:hover': {
                        bgcolor: 'rgba(239,68,68,0.2)'
                      }
                    }}
                  >
                    Decline
                  </Button>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const stats = [
    { label: 'Total Forms', count: forms.length, color: '#3B82F6', icon: <AssignmentIcon /> },
    { label: 'Pending', count: forms.filter(f => f.status === 'Pending').length, color: '#FBBF24', icon: <AccessTimeIcon /> },
    { label: 'Approved', count: forms.filter(f => f.status === 'Approved').length, color: '#10B981', icon: <DoneIcon /> },
    { label: 'Declined', count: forms.filter(f => f.status === 'Declined').length, color: '#EF4444', icon: <CloseIcon /> }
  ];

  // Fetch available staff based on form type
  const fetchAvailableStaff = async (formType) => {
    try {
      setStaffLoading(true);
      setStaffError('');
      
      console.log('Fetching staff for form type:', formType);
      
      // Get all staff members
      const response = await axios.get('/api/admin/staff');
      console.log('All available staff:', response.data);
      
      // Convert the formType to appropriate staffType
      const requiredStaffType = staffTypeForRequestType(formType);
      console.log('Required staff type:', requiredStaffType);
      
      // Filter staff based on type and status
      const staff = response.data.filter(staff => {
        const matches = staff.typeOfStaff === requiredStaffType && staff.status === 'Available';
        console.log(`Staff ${staff.name} (${staff.typeOfStaff}) matches: ${matches}`);
        return matches;
      });
      
      console.log('Filtered available staff:', staff);
      
      setAvailableStaff(staff);
      
      if (staff.length === 0) {
        setStaffError(`No available ${requiredStaffType} staff members found for ${formType} requests`);
      }
    } catch (error) {
      console.error('Error fetching available staff:', error);
      setStaffError('Failed to load available staff');
    } finally {
      setStaffLoading(false);
    }
  };

  // Assign staff to form
  const handleAssignStaff = async () => {
    if (!selectedForm || !selectedStaffId) {
      setAssignError('Please select a form and staff member');
      return;
    }
    
    setIsAssigning(true);
    setAssignError('');
    
    try {
      console.log(`Assigning staff ${selectedStaffId} to form ${selectedForm._id}`);
      const response = await axios.post(`/api/admin/forms/${selectedForm._id}/assign`, {
        staffId: selectedStaffId
      });
      
      console.log('Assignment response:', response.data);
      
      // Update the form in the forms array
      const updatedForms = forms.map(form => 
        form._id === selectedForm._id ? 
        { ...form, assignedTo: response.data.staff, status: 'Assigned' } : 
        form
      );
      
      setForms(updatedForms);
      setAssignDialogOpen(false);
      setSnackbar({ 
        open: true, 
        message: `Form successfully assigned to ${response.data.staff.name}`, 
        severity: 'success' 
      });
      
    } catch (error) {
      console.error('Error assigning staff:', error);
      let errorMessage = 'Failed to assign staff';
      
      if (error.response) {
        errorMessage = error.response.data.message || 'Server error during assignment';
        console.error('Response error:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response received from server';
        console.error('Request error:', error.request);
      }
      
      setAssignError(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  // Open assign staff dialog
  const handleOpenAssignDialog = () => {
    if (selectedForm) {
      console.log('Opening assign dialog for form type:', selectedForm.requestType);
      fetchAvailableStaff(selectedForm.requestType);
      setAssignDialogOpen(true);
    }
  };

  // Close assign staff dialog
  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedStaffId('');
    setStaffError('');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AdminSidebar />
      <Box sx={{ 
        flexGrow: 1,
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0A0A0A'
      }}>
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ 
                color: 'white', 
                fontWeight: 700,
                fontSize: '1.8rem'
              }}>
                Request Forms
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.6)',
                mt: 0.5
              }}>
                Manage and review student request forms
              </Typography>
            </Box>
            <IconButton 
              onClick={handleClick}
              sx={{ 
                color: '#6B7280',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.1)',
                }
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  width: 360,
                  maxHeight: 400,
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  '& .MuiList-root': {
                    padding: 0,
                  },
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>Notifications</Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#10B981', 
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={handleMarkAllRead}
                >
                  Mark all as read
                </Typography>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.03)' }} />
              <List sx={{
                maxHeight: 300,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.2)'
                  }
                }
              }}>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <ListItem
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification._id)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                        position: 'relative',
                        ...(notification.isRead ? {} : {
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            bgcolor: '#10B981',
                            borderRadius: '0 4px 4px 0',
                          }
                        })
                      }}
                    >
                      <ListItemText
                        primary={notification.title}
                        secondary={notification.content}
                        primaryTypographyProps={{
                          color: '#fff',
                          fontWeight: notification.isRead ? 400 : 600
                        }}
                        secondaryTypographyProps={{
                          color: '#6B7280',
                          sx: { 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#6B7280',
                          ml: 2,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </Typography>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No notifications"
                      primaryTypographyProps={{
                        color: '#6B7280',
                        textAlign: 'center'
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </Menu>
          </Box>
          <Grid container spacing={2}>
            {stats.map((stat) => (
              <Grid item xs={3} key={stat.label}>
                <Card sx={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ 
                        bgcolor: `${stat.color}15`,
                        width: 40,
                        height: 40
                      }}>
                        {React.cloneElement(stat.icon, { sx: { color: stat.color, fontSize: 20 } })}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: 'white', 
                          fontWeight: 600,
                          fontSize: '1.25rem'
                        }}>
                          {stat.count}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255,255,255,0.5)'
                        }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Main Content */}
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tabs */}
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'rgba(255,255,255,0.05)',
            bgcolor: 'rgba(255,255,255,0.02)'
          }}>
            <Tabs 
              value={currentTab}
              onChange={(e, newValue) => {
                setCurrentTab(newValue);
                setSelectedStatus(['all', 'Pending', 'Approved', 'Declined'][newValue]);
              }}
              sx={{
                px: 3,
                '& .MuiTabs-indicator': {
                  backgroundColor: '#3B82F6'
                }
              }}
            >
              <Tab 
                label="All Forms" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-selected': { color: '#3B82F6' }
                }}
              />
              <Tab 
                label="Pending" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-selected': { color: '#FBBF24' }
                }}
              />
              <Tab 
                label="Approved" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-selected': { color: '#10B981' }
                }}
              />
              <Tab 
                label="Declined" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-selected': { color: '#EF4444' }
                }}
              />
            </Tabs>
          </Box>

          {/* Forms List */}
          <Box sx={{ 
            flexGrow: 1,
            overflow: 'auto',
            p: 3
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={40} />
              </Box>
            ) : filteredForms.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: 'rgba(255,255,255,0.5)'
              }}>
                <AssignmentIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6">
                  No {selectedStatus !== 'all' ? selectedStatus.toLowerCase() : ''} forms found
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedStatus === 'all' 
                    ? 'Forms submitted by students will appear here'
                    : `No ${selectedStatus.toLowerCase()} forms to display`}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {filteredForms.map(renderFormCard)}
              </Stack>
            )}
          </Box>
        </Box>
      </Box>

      {/* Form Details Dialog */}
      <Dialog 
        open={openFormDialog} 
        onClose={handleCloseFormDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
          }
        }}
      >
        {selectedForm && (
          <>
            <DialogTitle sx={{ 
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(59,130,246,0.1)',
                width: 48,
                height: 48
              }}>
                {getRequestTypeIcon(selectedForm.requestType)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {selectedForm.requestType} Request Details
                </Typography>
                <Chip
                  label={selectedForm.status}
                  size="small"
                  sx={{
                    mt: 1,
                    borderRadius: '8px',
                    fontWeight: 600,
                    px: 1,
                    backgroundColor: getStatusColor(selectedForm.status).bg,
                    color: getStatusColor(selectedForm.status).color,
                    border: '1px solid',
                    borderColor: 'currentColor'
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Student Information */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2.5,
                    borderRadius: '12px',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: '#3B82F6',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <PersonIcon sx={{ fontSize: 20 }} />
                      Student Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                          Student Name
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {selectedForm.userName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                          Student ID
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {selectedForm.studentDormNumber || 'Not available'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                          Room Number
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {selectedForm.roomNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                          Building
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {selectedForm.buildingName}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Staff Information - Only show when assigned */}
                {selectedForm.assignedTo && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 2.5,
                      borderRadius: '12px',
                      bgcolor: 'rgba(16,185,129,0.05)',
                      border: '1px solid rgba(16,185,129,0.1)',
                      mb: 2
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: '#10B981',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <AssignmentInd sx={{ fontSize: 20 }} />
                        Assigned Staff
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                            Staff Name
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {selectedForm.assignedTo.name || 'Not available'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                            Staff Type
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {selectedForm.assignedTo.typeOfStaff || 'Not available'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                )}

                {/* Request Details */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2.5,
                    borderRadius: '12px',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: '#3B82F6',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <AssignmentIcon sx={{ fontSize: 20 }} />
                      Request Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                          Description
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap' }}>
                          {selectedForm.description}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                          Submission Date
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {formatDate(selectedForm.submissionDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                          Preferred Start Time
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {console.log('Rendering time:', selectedForm.actualStartTime)}
                          {selectedForm.actualStartTime || 'Not specified'}
                        </Typography>
                      </Grid>
                      {selectedForm.filePath && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                            Attachment
                          </Typography>
                          <Button
                            startIcon={<AttachFileIcon />}
                            sx={{ 
                              color: '#3B82F6',
                              textTransform: 'none',
                              '&:hover': { bgcolor: 'rgba(59,130,246,0.1)' }
                            }}
                          >
                            View Attachment
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3, 
              borderTop: '1px solid rgba(255,255,255,0.05)',
              gap: 1
            }}>
              {selectedForm.status === 'Pending' && (
                <>
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleUpdateStatus(selectedForm._id, 'Approved');
                      handleCloseFormDetails();
                    }}
                    startIcon={<DoneIcon />}
                    sx={{
                      bgcolor: 'rgba(16,185,129,0.1)',
                      color: '#10B981',
                      '&:hover': {
                        bgcolor: 'rgba(16,185,129,0.2)'
                      }
                    }}
                  >
                    Approve Request
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleUpdateStatus(selectedForm._id, 'Declined');
                      handleCloseFormDetails();
                    }}
                    startIcon={<CloseIcon />}
                    sx={{
                      bgcolor: 'rgba(239,68,68,0.1)',
                      color: '#EF4444',
                      '&:hover': {
                        bgcolor: 'rgba(239,68,68,0.2)'
                      }
                    }}
                  >
                    Decline Request
                  </Button>
                </>
              )}
              {selectedForm.status === 'Approved' && !selectedForm.assignedTo && (
                <Button
                  variant="contained"
                  onClick={handleOpenAssignDialog}
                  startIcon={<AssignmentInd />}
                  sx={{
                    bgcolor: 'rgba(59,130,246,0.1)',
                    color: '#3B82F6',
                    '&:hover': {
                      bgcolor: 'rgba(59,130,246,0.2)'
                    }
                  }}
                >
                  Assign Staff
                </Button>
              )}
              <Button
                onClick={handleCloseFormDetails}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            color: '#fff',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            width: '500px',
            maxWidth: '95vw',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentInd sx={{ color: '#3B82F6' }} />
            <Typography color="white">Assign Staff</Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setAssignDialogOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, borderTop: 'none', borderBottom: 'none' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom color="white">
              Assigning staff for request: {selectedForm?.requestType}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedForm?.description?.substring(0, 100)}
              {selectedForm?.description?.length > 100 ? '...' : ''}
            </Typography>
          </Box>
          
          <FormControl fullWidth error={!!assignError || !!staffError} sx={{ mb: 2 }}>
            <InputLabel id="staff-select-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>Select Staff</InputLabel>
            <Select
              labelId="staff-select-label"
              value={selectedStaffId || ''}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              label="Select Staff"
              disabled={staffLoading}
              sx={{ 
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.1)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(59,130,246,0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3B82F6'
                },
                '.MuiSvgIcon-root': {
                  color: 'rgba(255,255,255,0.7)'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    '& .MuiMenuItem-root': {
                      '&:hover': {
                        bgcolor: 'rgba(59,130,246,0.1)'
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(59,130,246,0.2)',
                        '&:hover': {
                          bgcolor: 'rgba(59,130,246,0.3)'
                        }
                      }
                    }
                  }
                }
              }}
            >
              {staffLoading ? (
                <MenuItem disabled>Loading staff...</MenuItem>
              ) : availableStaff.length === 0 ? (
                <MenuItem disabled>No matching staff available</MenuItem>
              ) : (
                availableStaff.map(staff => (
                  <MenuItem key={staff._id} value={staff._id}>
                    {staff.name} - {staff.typeOfStaff}
                  </MenuItem>
                ))
              )}
            </Select>
            {staffError && <FormHelperText error>{staffError}</FormHelperText>}
            {assignError && <FormHelperText error>{assignError}</FormHelperText>}
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <Button 
            onClick={() => setAssignDialogOpen(false)}
            variant="outlined"
            sx={{ 
              mr: 1,
              color: 'rgba(255,255,255,0.7)',
              borderColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.2)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssignStaff}
            variant="contained"
            disabled={isAssigning || !selectedStaffId}
            startIcon={isAssigning ? <CircularProgress size={20} color="inherit" /> : <AssignmentInd />}
            sx={{ 
              position: 'relative',
              fontWeight: 'bold',
              bgcolor: 'rgba(59,130,246,0.1)',
              color: '#3B82F6',
              '&:hover': {
                bgcolor: 'rgba(59,130,246,0.2)'
              },
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.3)',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            {isAssigning ? 'Assigning...' : 'Assign Staff'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
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

export default AdminForms;
