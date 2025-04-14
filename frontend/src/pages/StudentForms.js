import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Stack,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
  Tooltip,
  Badge,
  Alert,
  Paper,
  Menu,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  CleaningServices as CleaningIcon,
  Construction as RepairIcon,
  RestartAlt as RescheduleIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  ReceiptLong as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Handyman as RepairIconIcon,
  AttachFile as AttachFileIcon,
  Notifications as NotificationsIcon,
  Sync as SyncIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import StudentSidebar from '../components/StudentSidebar';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const statsData = [
  { 
    title: 'Total Forms', 
    count: '24', 
    trend: '+3 this month', 
    isIncrease: true,
    icon: <TrendingUpIcon sx={{ color: '#10B981' }} />
  },
  { 
    title: 'Pending Forms', 
    count: '5', 
    trend: '2 new', 
    isIncrease: true,
    icon: <BuildIcon sx={{ color: '#FBBF24' }} />
  },
  { 
    title: 'Completed Forms', 
    count: '18', 
    trend: '95% success', 
    isIncrease: true,
    icon: <CleaningIcon sx={{ color: '#10B981' }} />
  },
  { 
    title: 'Scheduled Services', 
    count: '3', 
    trend: 'Next: Today', 
    isIncrease: false,
    icon: <RepairIconIcon sx={{ color: '#3B82F6' }} />
  },
];

const StudentForms = () => {
  // State variables
  const [activeTab, setActiveTab] = useState(0);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openRescheduleDialog, setOpenRescheduleDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  
  const [formData, setFormData] = useState({
    requestType: '',
    description: '',
    scheduledDate: '',
    actualStartTime: '',
    actualEndTime: '',
    filePath: '',
    attachments: [],
    userName: '',
    studentDormNumber: '',
    roomNumber: '',
    buildingName: ''
  });
  
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });

  const { socket, isConnected } = useSocket();
  const [userData, setUserData] = useState({
    _id: '',
    name: '',
    studentDormNumber: '',
    room: { roomNumber: '', building: '' }
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const notificationMenuOpen = Boolean(anchorEl);

  // Fetch forms on component mount and after submission
  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students/forms', {
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
      setForms(data);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Error loading forms');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/students/profile', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }
        const data = await response.json();
        
        console.log('Fetched user data in StudentForms:', data);
        
        // Update user data state
        setUserData(data);
        
        // Update form data with user information
        setFormData(prev => ({
          ...prev,
          userName: data.name,
          studentDormNumber: data.studentDormNumber,
          roomNumber: data.room?.roomNumber || 'Not assigned',
          buildingName: data.room?.building || 'Not assigned'
        }));
      } catch (error) {
        console.error('Error fetching user info:', error);
        toast.error('Error loading user information');
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/students/notifications');
      setNotifications(response.data);
      updateUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Update unread count
  const updateUnreadCount = async () => {
    try {
      const response = await axios.get('/api/students/notifications/unread/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Menu handlers
  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };
  
  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/students/notifications/mark-all-read');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      
      if (socket && isConnected) {
        socket.emit('allNotificationsRead', {
          userId: userData._id
        });
      }
      
      handleNotificationClose();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  // Delete a notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/students/notifications/${notificationId}`);
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

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[StudentForms] Socket not connected, skipping event setup');
      return;
    }

    // Make sure we have a valid user ID before proceeding
    if (!userData || !userData._id) {
      console.log('[StudentForms] No user data available for socket connection');
      return;
    }

    console.log('[StudentForms] Setting up socket event listeners for student ID:', userData._id);
    
    // Important: stringify the user ID to ensure it matches the socket room format
    const userId = userData._id.toString();
    
    // Join room and handle connection issues
    const joinRoom = () => {
      console.log('[StudentForms] Emitting join event with ID:', userId);
      socket.emit('join', userId);
    };
    
    // Initial join
    joinRoom();
    
    // Handle join acknowledgment
    socket.on('joinAcknowledged', (data) => {
      console.log('[StudentForms] Join acknowledged:', data);
      // Refresh forms after successful connection
      fetchForms();
    });

    // Debug connections and handle reconnects
    socket.on('connect', () => {
      console.log('[StudentForms] Socket connected, joining room...');
      joinRoom();
    });

    socket.on('reconnect', () => {
      console.log('[StudentForms] Socket reconnected, rejoining room...');
      joinRoom();
      fetchForms();
    });

    socket.on('disconnect', () => {
      console.log('[StudentForms] Socket disconnected');
    });

    // Rest of your event listeners...
    socket.on('newNotification', (notification) => {
      console.log('[StudentForms] New notification received:', notification);
      
      // Always add this notification to our state
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast for form status notifications
      if (notification.type === 'FORM_APPROVED' || 
          notification.type === 'FORM_DECLINED' || 
          notification.type === 'FORM_ASSIGNED') {
        
        toast.info(notification.content, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        
        // Refresh forms when status notifications arrive
        fetchForms();
      }
    });

    // Listen for form status updates
    socket.on('formStatusUpdate', (data) => {
      console.log('[StudentForms] Form status update received:', data);
      
      // Update the form in the state
      setForms(prev => {
        const updatedForms = prev.map(form => {
          if (form._id === data.formId) {
            console.log(`[StudentForms] Updating form ${form._id} status from ${form.status} to ${data.status}`);
            
            // Create the updated form object with all necessary properties
            return { 
              ...form, 
              status: data.status,
              lastModified: new Date().toISOString()
            };
          }
          return form;
        });
        
        console.log('[StudentForms] Forms after update:', 
          updatedForms.map(f => ({ id: f._id, status: f.status }))
        );
        
        return updatedForms;
      });
      
      // Show toast notification
      const statusMessage = `Your ${data.type || 'request'} form has been ${data.status.toLowerCase()}.`;
      toast.info(statusMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true
      });
    });

    // Listen for general form updates
    socket.on('formUpdate', (data) => {
      console.log('[StudentForms] Form update received:', data);
      
      if (data.formId && data.status) {
        // This is a status update
        setForms(prev => 
          prev.map(form => 
            form._id === data.formId 
              ? { ...form, status: data.status } 
              : form
          )
        );
      } else if (data.type === 'delete' && data.formId) {
        // This is a form deletion
        setForms(prev => prev.filter(form => form._id !== data.formId));
      } else if (data.updatedForm) {
        // This is a complete form update
        setForms(prev => {
          const exists = prev.some(form => form._id === data.updatedForm._id);
          
          if (exists) {
            return prev.map(form => 
              form._id === data.updatedForm._id ? data.updatedForm : form
            );
          } else {
            return [...prev, data.updatedForm];
          }
        });
      }
    });

    // Listen for the direct formStatusUpdated event from AdminForms
    socket.on('formStatusUpdated', (data) => {
      console.log('[StudentForms] Direct formStatusUpdated event received:', data);
      
      // This event comes directly from the admin when they update a form
      if (data && data.formId && data.status) {
        // Update our forms state with the new status
        setForms(prev => 
          prev.map(form => 
            form._id === data.formId ? 
            { 
              ...form, 
              status: data.status,
              lastModified: new Date().toISOString(),
              // If we have full form data, update other fields as well
              ...(data.updatedForm && {
                description: data.updatedForm.description || form.description,
                scheduledDate: data.updatedForm.scheduledDate || form.scheduledDate,
                // Add any other fields that might be updated
              })
            } : 
            form
          )
        );
        
        // Show a prominent toast notification
        const formType = data.type || data.updatedForm?.requestType || 'request';
        const message = `Your ${formType} has been ${data.status.toLowerCase()}`;
        
        // Use different toast styles based on status
        if (data.status === 'Approved') {
          toast.success(message, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
        } else if (data.status === 'Declined') {
          toast.error(message, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
        } else {
          toast.info(message, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true
          });
        }
        
        // After a status update, fetch the latest forms to ensure we have all data
        setTimeout(() => fetchForms(), 1000);
      }
    });

    // Listen for form assignment events
    socket.on('formAssigned', (data) => {
      console.log('[StudentForms] Form assigned event received:', data);
      
      if (data && data.formId && data.updatedForm) {
        // Update the form in the state with assignment information
        setForms(prev => 
          prev.map(form => 
            form._id === data.formId ? 
            { 
              ...form, 
              status: 'Assigned',
              staff: data.updatedForm.staff,
              lastModified: new Date().toISOString()
            } : 
            form
          )
        );
        
        // Show a toast notification about the assignment
        const staffName = data.updatedForm.staff?.name || 'a staff member';
        const formType = data.updatedForm.requestType || 'request';
        
        toast.info(`Your ${formType} has been assigned to ${staffName}`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        
        // Refresh forms to get the latest data
        setTimeout(() => fetchForms(), 1000);
      }
    });

    // Clean up socket listeners when component unmounts
    return () => {
      console.log('[StudentForms] Cleaning up socket event listeners');
      socket.off('newNotification');
      socket.off('formStatusUpdate');
      socket.off('formUpdate');
      socket.off('formStatusUpdated');
      socket.off('formAssigned');
      socket.off('joinAcknowledged');
      socket.off('connect');
      socket.off('reconnect');
      socket.off('disconnect');
    };
  }, [socket, isConnected, userData, fetchForms]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filter forms based on active tab
  const getFilteredForms = () => {
    switch (activeTab) {
      case 0: // All forms
        return forms;
      case 1: // Pending forms
        return forms.filter(form => form.status === 'Pending');
      case 2: // Approved/Scheduled forms
        return forms.filter(form => ['Approved', 'Rescheduled'].includes(form.status));
      case 3: // Completed forms
        return forms.filter(form => form.status === 'Completed');
      default:
        return forms;
    }
  };

  // Handle opening the submit form dialog
  const handleOpenDialog = () => {
    setFormData(prev => ({
      ...prev,
      requestType: '',
      description: '',
      scheduledDate: '',
      actualStartTime: '',
      actualEndTime: '',
      filePath: '',
      attachments: []
    }));
    setOpenDialog(true);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle reschedule inputs
  const handleRescheduleInputChange = (e) => {
    const { name, value } = e.target;
    setRescheduleData({
      ...rescheduleData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.attachments || formData.attachments.length === 0) {
      toast.error('Please attach a file to your request');
      return;
    }

    try {
      // Create form data for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('requestType', formData.requestType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('scheduledDate', formData.scheduledDate);
      formDataToSend.append('actualStartTime', formData.actualStartTime);
      formDataToSend.append('actualEndTime', formData.actualEndTime);
      formDataToSend.append('file', formData.attachments[0]);

      const response = await fetch('/api/students/forms', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit form');
      }
      
      // Add the new form to the state
      setForms(prevForms => [result.form, ...prevForms]);
      
      setOpenDialog(false);
      toast.success('Form submitted successfully');

      // Reset form data while preserving user information
      setFormData(prev => ({
        ...prev,
        requestType: '',
        description: '',
        scheduledDate: '',
        actualStartTime: '',
        actualEndTime: '',
        filePath: '',
        attachments: []
      }));
    } catch (error) {
      console.error('Submit form error:', error);
      toast.error(error.message || 'Error submitting form');
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        filePath: file.name,
        attachments: [file] // Store the actual file
      }));
    }
  };

  // Handle opening the details dialog
  const handleViewDetails = (form) => {
    setSelectedForm(form);
    setOpenDetailsDialog(true);
  };
  
  // Handle reschedule request
  const handleRescheduleRequest = (form) => {
    setSelectedForm(form);
    setRescheduleData({
      newDate: '',
      newTime: '',
      reason: ''
    });
    setOpenRescheduleDialog(true);
  };
  
  // Submit reschedule request
  const handleSubmitReschedule = () => {
    // Validation
    if (!rescheduleData.newDate || !rescheduleData.newTime || !rescheduleData.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // For demo: Update the form
    const updatedForms = forms.map(form => {
      if (form.id === selectedForm.id) {
        return {
          ...form,
          status: 'Rescheduled',
          scheduledDate: rescheduleData.newDate,
          scheduledTime: rescheduleData.newTime,
          rescheduledReason: rescheduleData.reason
        };
      }
      return form;
    });
    
    setForms(updatedForms);
    setOpenRescheduleDialog(false);
    toast.success('Reschedule request submitted successfully');
  };

  // Get status chip color
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Pending':
        return { color: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.1)' };
      case 'Approved':
        return { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' };
      case 'Completed':
        return { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' };
      case 'Rejected':
        return { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
      case 'Rescheduled':
        return { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' };
      default:
        return { color: 'default', bgColor: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  // Get icon based on form type
  const getFormIcon = (type) => {
    switch (type) {
      case 'Cleaning':
        return <CleaningIcon />;
      case 'Maintenance':
        return <BuildIcon />;
      case 'Repair':
        return <RepairIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getRequestTypeIcon = (type) => {
    switch (type) {
      case 'Cleaning':
        return <CleaningIcon sx={{ fontSize: 32, color: '#10B981' }} />;
      case 'Maintenance':
        return <BuildIcon sx={{ fontSize: 32, color: '#FBBF24' }} />;
      case 'Repair':
        return <RepairIcon sx={{ fontSize: 32, color: '#EF4444' }} />;
      default:
        return <ReceiptIcon sx={{ fontSize: 32, color: '#3B82F6' }} />;
    }
  };

  const FormDetailsDialog = ({ open, onClose, form }) => {
    if (!form) return null;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(145deg, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0.05) 100%)',
          borderBottom: '1px solid rgba(25,118,210,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'white'
        }}>
          <InfoIcon sx={{ color: '#3B82F6' }} />
          Form Details
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#1A1A1A' }}>
          {/* User Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              color: '#3B82F6',
              mb: 2,
              borderBottom: '1px solid rgba(59,130,246,0.2)',
              pb: 1
            }}>
              Student Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Name</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  {form.userName || form.user?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Building</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  {form.buildingName || form.room?.building || form.building?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Dorm Number</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  {form.studentDormNumber || form.user?.studentDormNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Room Number</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  {form.roomNumber || form.room?.roomNumber || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Request Details Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              color: '#3B82F6',
              mb: 2,
              borderBottom: '1px solid rgba(59,130,246,0.2)',
              pb: 1
            }}>
              Request Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Request Type</Typography>
                <Typography variant="body1" sx={{ color: 'white', textTransform: 'capitalize' }}>{form.requestType || 'Select Request Type'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Description</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>{form.description || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Scheduled Date</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>{form.scheduledDate ? new Date(form.scheduledDate).toLocaleDateString() : 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Status</Typography>
                <Chip
                  label={form.status}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    backgroundColor: form.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' :
                                   form.status === 'Pending' ? 'rgba(251, 191, 36, 0.1)' :
                                   form.status === 'Declined' ? 'rgba(239, 68, 68, 0.1)' :
                                   'rgba(59, 130, 246, 0.1)',
                    color: form.status === 'Completed' ? '#10B981' :
                           form.status === 'Pending' ? '#FBBF24' :
                           form.status === 'Declined' ? '#EF4444' :
                           '#3B82F6'
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Staff Assignment Section - Only show when assigned */}
          {form.status === 'Assigned' && form.staff && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                color: '#3B82F6',
                mb: 2,
                borderBottom: '1px solid rgba(59,130,246,0.2)',
                pb: 1
              }}>
                Assigned Staff
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Staff Name</Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    {form.staff.name || 'Not available'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Staff Type</Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    {form.staff.typeOfStaff || form.requestType || 'Not available'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Attachment Section */}
          <Box>
            <Typography variant="h6" sx={{ 
              color: '#3B82F6',
              mb: 2,
              borderBottom: '1px solid rgba(59,130,246,0.2)',
              pb: 1
            }}>
              Attachment
            </Typography>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              borderRadius: 1,
              bgcolor: 'rgba(59,130,246,0.1)'
            }}>
              <AttachFileIcon sx={{ color: '#3B82F6' }} />
              <Typography sx={{ color: 'white' }}>{form.filePath || 'No file attached'}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          p: 2,
          background: 'linear-gradient(145deg, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0.05) 100%)',
        }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ 
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderFormCards = (forms) => {
    return forms.map((form) => {
      // Check if the form was recently updated (within the last 30 seconds)
      const isRecentlyUpdated = form.lastModified && 
        (new Date().getTime() - new Date(form.lastModified).getTime() < 30000);
      
      return (
        <Card
          key={form._id}
          sx={{
            mb: 2,
            background: isRecentlyUpdated 
              ? 'linear-gradient(145deg, #141414 0%, #121a24 100%)' 
              : 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            border: isRecentlyUpdated 
              ? '1px solid rgba(59,130,246,0.3)' 
              : '1px solid rgba(255,255,255,0.03)',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            position: 'relative',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              borderColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          {isRecentlyUpdated && (
            <Box sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(59,130,246,0.2)',
              color: '#3B82F6',
              fontSize: '12px',
              fontWeight: 600,
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              <SyncIcon sx={{ fontSize: 16 }} />
              Updated
            </Box>
          )}
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ mb: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: '12px',
                      background: form.requestType === 'Cleaning' ? 'rgba(16, 185, 129, 0.1)' :
                                form.requestType === 'Maintenance' ? 'rgba(251, 191, 36, 0.1)' :
                                'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getRequestTypeIcon(form.requestType)}
                    </Box>
                    <Typography variant="h5" sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {form.requestType || 'Select Request Type'}
                    </Typography>
                  </Box>
                  <Chip
                    label={form.status}
                    size="medium"
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 600,
                      backgroundColor: form.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' :
                                     form.status === 'Pending' ? 'rgba(251, 191, 36, 0.1)' :
                                     form.status === 'Declined' ? 'rgba(239, 68, 68, 0.1)' :
                                     'rgba(59, 130, 246, 0.1)',
                      color: form.status === 'Completed' ? '#10B981' :
                             form.status === 'Pending' ? '#FBBF24' :
                             form.status === 'Declined' ? '#EF4444' :
                             '#3B82F6',
                      border: '1px solid',
                      borderColor: 'currentColor',
                      px: 2
                    }}
                  />
                </Box>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  mb: 2,
                  lineHeight: 1.6
                }}>
                  {form.description.substring(0, 150)}{form.description.length > 150 ? '...' : ''}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  pt: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255,255,255,0.5)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5 
                    }}>
                      <ScheduleIcon sx={{ fontSize: 18 }} />
                      {format(new Date(form.submissionDate), 'MMM dd, yyyy')}
                    </Typography>
                    {form.filePath && (
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255,255,255,0.5)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5 
                      }}>
                        <AttachFileIcon sx={{ fontSize: 18 }} />
                        Attachment
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="text"
                    onClick={() => handleViewDetails(form)}
                    sx={{
                      color: '#3B82F6',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        textDecoration: 'none'
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      );
    });
  };

  const renderFormDetails = () => {
    if (!selectedForm) return null;

    return (
      <DialogContent sx={{ bgcolor: '#1A1A1A' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Request Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Type</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>{selectedForm.requestType}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Status</Typography>
              <Chip
                label={selectedForm.status}
                size="small"
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  backgroundColor: selectedForm.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' :
                                 selectedForm.status === 'Pending' ? 'rgba(251, 191, 36, 0.1)' :
                                 selectedForm.status === 'Declined' ? 'rgba(239, 68, 68, 0.1)' :
                                 'rgba(59, 130, 246, 0.1)',
                  color: selectedForm.status === 'Completed' ? '#10B981' :
                         selectedForm.status === 'Pending' ? '#FBBF24' :
                         selectedForm.status === 'Declined' ? '#EF4444' :
                         '#3B82F6'
                }}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Student Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Name</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>{selectedForm.userName}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Dorm Number</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>{selectedForm.studentDormNumber}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Room Number</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>{selectedForm.roomNumber}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Building</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>{selectedForm.buildingName}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

        <Box>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Request Details</Typography>
          <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>{selectedForm.description}</Typography>
          {selectedForm.filePath && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#3B82F6' }}>
              <AttachFileIcon />
              <Typography variant="body2">Attachment</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    );
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
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              My Forms
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Manage your request submissions
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <IconButton 
              onClick={handleNotificationClick}
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
            <Button
              variant="contained"
              onClick={handleOpenDialog}
              startIcon={<AddIcon />}
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                px: 3,
                py: 1,
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Submit New Form
            </Button>
          </Stack>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsData.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                borderRadius: '16px',
                p: 2.5,
                border: '1px solid rgba(255,255,255,0.03)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Box
                    sx={{ 
                      p: 1,
                      borderRadius: '10px',
                      background: (theme) => `linear-gradient(135deg, ${stat.icon.props.sx.color}20 0%, ${stat.icon.props.sx.color}10 100%)`,
                      color: stat.icon.props.sx.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 600,
                      color: '#fff',
                      mb: 0.5,
                    }}>
                      {stat.count}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      {stat.title}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    ml: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    color: stat.isIncrease ? '#10B981' : '#EF4444',
                    background: stat.isIncrease 
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    px: 1,
                    py: 0.5,
                  }}>
                    {stat.isIncrease ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {stat.trend}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Forms Section */}
        <Card sx={{
          background: 'linear-gradient(145deg, #1A1A1A 0%, #141414 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {/* Tabs Header */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'linear-gradient(145deg, #202020 0%, #1A1A1A 100%)',
          }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 'unset',
                '& .MuiTabs-indicator': {
                  backgroundColor: '#10B981',
                  height: 3,
                  borderRadius: '3px',
                },
                '& .MuiTab-root': {
                  color: '#9CA3AF',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  minHeight: 40,
                  py: 1,
                  '&.Mui-selected': {
                    color: '#10B981',
                  },
                  '&:hover': {
                    color: '#10B981',
                    opacity: 0.8,
                  },
                },
              }}
            >
              <Tab label={`All Forms (${forms.length})`} />
              <Tab label={`Pending (${forms.filter(f => f.status === 'Pending').length})`} />
              <Tab label={`Scheduled (${forms.filter(f => ['Approved', 'Rescheduled'].includes(f.status)).length})`} />
              <Tab label={`Completed (${forms.filter(f => f.status === 'Completed').length})`} />
            </Tabs>
            <Button
              startIcon={<FilterIcon />}
              size="small"
              sx={{
                color: '#9CA3AF',
                minWidth: 'unset',
                ml: 2,
                '&:hover': {
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.1)',
                },
              }}
            >
              Filter
            </Button>
          </Box>

          {/* Forms List */}
          <Box sx={{ 
            maxHeight: 'calc(100vh - 380px)',
            overflow: 'auto',
            background: 'linear-gradient(180deg, #161616 0%, #111111 100%)',
            '&::-webkit-scrollbar': {
              width: '6px',
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(255,255,255,0.2)'
              }
            }
          }}>
            <Stack spacing={1.5} sx={{ p: 2 }}>
              {renderFormCards(getFilteredForms())}
            </Stack>
          </Box>
        </Card>

        {/* All Dialogs */}
        <FormDetailsDialog
          open={openDetailsDialog}
          onClose={() => setOpenDetailsDialog(false)}
          form={selectedForm}
        />
        
        {/* Submit Form Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              minWidth: '500px',
              maxHeight: '90vh',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
            py: 2,
          }}>
            <Typography variant="h6" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              color: '#fff',
            }}>
              <AddIcon sx={{ color: '#10B981' }} />
              Submit New Form
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmitForm} sx={{ mt: 2 }}>
              {/* User Information Section */}
              <Box mb={3}>
                <Typography variant="subtitle1" sx={{ 
                  color: '#10B981', 
                  mb: 2,
                  borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                  pb: 1,
                }}>
                  Student Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Name</Typography>
                    <Typography sx={{ color: '#fff', mt: 0.5 }}>{formData.userName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Dorm Number</Typography>
                    <Typography sx={{ color: '#fff', mt: 0.5 }}>{formData.studentDormNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Room Number</Typography>
                    <Typography sx={{ color: '#fff', mt: 0.5 }}>{formData.roomNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Building</Typography>
                    <Typography sx={{ color: '#fff', mt: 0.5 }}>{formData.buildingName}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Form Type Section */}
              <Box mb={3}>
                <Typography variant="subtitle1" sx={{ 
                  color: '#10B981', 
                  mb: 2,
                  borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                  pb: 1,
                }}>
                  Service Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel sx={{ 
                        color: '#9CA3AF',
                        '&.Mui-focused': {
                          color: '#10B981',
                        }
                      }}>Request Type</InputLabel>
                      <Select
                        name="requestType"
                        value={formData.requestType}
                        onChange={handleInputChange}
                        displayEmpty
                        defaultValue=""
                        renderValue={(selected) => {
                          if (!selected) {
                            return <Typography sx={{ color: '#9CA3AF' }}>Select Request Type</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {selected === 'Cleaning' && <CleaningIcon sx={{ color: '#10B981' }} />}
                              {selected === 'Maintenance' && <BuildIcon sx={{ color: '#FBBF24' }} />}
                              {selected === 'Repair' && <RepairIcon sx={{ color: '#EF4444' }} />}
                              <Typography sx={{ color: '#fff' }}>{selected}</Typography>
                            </Box>
                          );
                        }}
                        sx={{
                          height: '56px',
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
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: '#1A1A1A',
                              borderRadius: '12px',
                              border: '1px solid rgba(255,255,255,0.1)',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                              '& .MuiMenuItem-root': {
                                color: '#fff',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                '&:hover': {
                                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                                },
                                '&.Mui-selected': {
                                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                                  '&:hover': {
                                    bgcolor: 'rgba(16, 185, 129, 0.3)',
                                  }
                                }
                              }
                            }
                          }
                        }}
                      >
                        <MenuItem value="Cleaning" sx={{ color: '#fff' }}>
                          <CleaningIcon sx={{ color: '#10B981' }} />
                          Cleaning
                        </MenuItem>
                        <MenuItem value="Maintenance" sx={{ color: '#fff' }}>
                          <BuildIcon sx={{ color: '#FBBF24' }} />
                          Maintenance
                        </MenuItem>
                        <MenuItem value="Repair" sx={{ color: '#fff' }}>
                          <RepairIcon sx={{ color: '#EF4444' }} />
                          Repair
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      name="description"
                      label="Description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
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
              </Box>

              {/* Schedule Section */}
              <Box mb={3}>
                <Typography variant="subtitle1" sx={{ 
                  color: '#10B981', 
                  mb: 2,
                  borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                  pb: 1,
                }}>
                  Schedule
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="date"
                      name="scheduledDate"
                      label="Preferred Date"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      required
                      InputLabelProps={{ shrink: true }}
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
                      type="time"
                      name="actualStartTime"
                      label="Start Time"
                      value={formData.actualStartTime}
                      onChange={handleInputChange}
                      required
                      InputLabelProps={{ shrink: true }}
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
                      type="time"
                      name="actualEndTime"
                      label="End Time"
                      value={formData.actualEndTime}
                      onChange={handleInputChange}
                      required
                      InputLabelProps={{ shrink: true }}
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
              </Box>

              {/* File Upload Section */}
              <Box mb={3}>
                <Typography variant="subtitle1" sx={{ 
                  color: '#10B981', 
                  mb: 2,
                  borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                  pb: 1,
                }}>
                  File Attachment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="file"
                      name="filePath"
                      onChange={handleFileChange}
                      required
                      InputLabelProps={{ shrink: true }}
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
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            borderTop: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)',
            p: 2.5,
            gap: 2,
          }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              variant="outlined"
              sx={{ 
                color: '#9CA3AF',
                borderColor: 'rgba(156, 163, 175, 0.5)',
                '&:hover': {
                  borderColor: 'rgba(156, 163, 175, 0.8)',
                  background: 'rgba(156, 163, 175, 0.08)',
                },
                minWidth: '100px',
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitForm}
              sx={{
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                },
                minWidth: '100px',
              }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog 
          open={openRescheduleDialog} 
          onClose={() => setOpenRescheduleDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              minWidth: '500px',
              maxHeight: '90vh',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
            py: 2,
          }}>
            <Typography variant="h6" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              color: '#fff',
            }}>
              <RescheduleIcon sx={{ color: '#10B981' }} />
              Request Reschedule
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {/* New Schedule Section */}
              <Box mb={3}>
                <Typography variant="subtitle1" sx={{ 
                  color: '#10B981', 
                  mb: 2,
                  borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                  pb: 1,
                }}>
                  New Schedule
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                  <TextField
                    fullWidth
                    type="date"
                    name="newDate"
                    label="New Date"
                    value={rescheduleData.newDate}
                    onChange={handleRescheduleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
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
                  <TextField
                    fullWidth
                    type="time"
                    name="newTime"
                    label="New Time"
                    value={rescheduleData.newTime}
                    onChange={handleRescheduleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
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
                </Box>
              </Box>

              {/* Reason Section */}
              <Box mb={3}>
                <Typography variant="subtitle1" sx={{ 
                  color: '#10B981', 
                  mb: 2,
                  borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                  pb: 1,
                }}>
                  Reason
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="reason"
                    label="Reason for Reschedule"
                    value={rescheduleData.reason}
                    onChange={handleRescheduleInputChange}
                    required
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
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            borderTop: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)',
            p: 2.5,
            gap: 2,
          }}>
            <Button 
              onClick={() => setOpenRescheduleDialog(false)}
              variant="outlined"
              sx={{ 
                color: '#9CA3AF',
                borderColor: 'rgba(156, 163, 175, 0.5)',
                '&:hover': {
                  borderColor: 'rgba(156, 163, 175, 0.8)',
                  background: 'rgba(156, 163, 175, 0.08)',
                },
                minWidth: '100px',
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitReschedule}
              sx={{
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                },
                minWidth: '100px',
              }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorEl}
        open={notificationMenuOpen}
        onClose={handleNotificationClose}
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
                onClick={() => handleDeleteNotification(notification._id)}
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
                      bgcolor: notification.type === 'FORM_APPROVED' ? '#10B981' :
                              notification.type === 'FORM_DECLINED' ? '#EF4444' :
                              notification.type === 'FORM_ASSIGNED' ? '#3B82F6' :
                              '#10B981',
                      borderRadius: '0 4px 4px 0',
                    }
                  })
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {notification.type === 'FORM_APPROVED' && <CheckCircleIcon fontSize="small" sx={{ color: '#10B981' }} />}
                      {notification.type === 'FORM_DECLINED' && <CancelIcon fontSize="small" sx={{ color: '#EF4444' }} />}
                      {notification.type === 'FORM_ASSIGNED' && <AssignmentIcon fontSize="small" sx={{ color: '#3B82F6' }} />}
                      {notification.type === 'NEW_FORM' && <ReceiptIcon fontSize="small" sx={{ color: '#F59E0B' }} />}
                      <Typography variant="body1" sx={{ 
                        color: '#fff',
                        fontWeight: notification.isRead ? 400 : 600
                      }}>
                        {notification.title}
                      </Typography>
                    </Box>
                  }
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
  );
};

export default StudentForms;
