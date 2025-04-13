import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Grid,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Circle as CircleIcon,
  Person as PersonIcon,
  MenuBook as MenuBookIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import StudentSidebar from '../components/StudentSidebar';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const statsData = [
  { title: 'Courses Enrolled', count: '5', trend: '+1', isIncrease: true },
  { title: 'Assignments Due', count: '3', trend: '-2', isIncrease: false },
  { title: 'Messages', count: '12', trend: '+4', isIncrease: true },
  { title: 'Attendance Rate', count: '95%', trend: '+2%', isIncrease: true },
];

const StudentDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { socket, isConnected } = useSocket();

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

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected || !userData._id) return;

    // Join socket room with student ID
    socket.emit('join', userData._id);

    // Listen for new notifications
    socket.on('newNotification', (notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for notification updates
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

    // Clean up socket listeners
    return () => {
      socket.off('newNotification');
      socket.off('notificationUpdate');
    };
  }, [socket, isConnected, userData._id]);

  // Mark notification as read and delete it
  const handleNotificationClick = async (notificationId) => {
    try {
      const response = await axios.delete(`/api/students/notifications/${notificationId}`);
      
      if (response.status === 200) {
        // Remove the notification from the list
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // Emit socket event for real-time update
        if (socket && isConnected) {
          socket.emit('notificationDelete', {
            notificationId,
            userId: userData._id
          });
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please try again.');
    }
  };

  // Delete all notifications
  const handleDeleteAllNotifications = async () => {
    try {
    //   // Ask for confirmation
    //   if (!window.confirm('Are you sure you want to delete all notifications?')) {
    //     return;
    //   }

      console.log('Attempting to delete all notifications...');
      const response = await axios.delete('/api/students/notifications/delete-all');
      console.log('Delete all response:', response.data);
      
      // Clear all notifications from state
      setNotifications([]);
      setUnreadCount(0);
      
      // Emit socket event for real-time update
      if (socket && isConnected) {
        socket.emit('allNotificationsDeleted', {
          userId: userData._id
        });
      }
      
      // Close the menu
      handleClose();
      
      // Show success message
    //   alert(`Successfully deleted ${response.data.deletedCount} notifications`);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete notifications';
      alert(errorMessage);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Menu handlers
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
              Welcome back, {userData.name || 'Student'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Here's what's happening with your dormitory today.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
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
                  onClick={handleDeleteAllNotifications}
                >
                  Mark All as read
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
          </Stack>
        </Box>

         {/* Stats Grid */}
         <Grid container spacing={3}>
          {statsData.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
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
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  {stat.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 600, 
                    color: '#fff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}>
                    {stat.count}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: stat.isIncrease ? '#10B981' : '#EF4444',
                    background: stat.isIncrease 
                      ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                      : 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)',
                    borderRadius: '10px',
                    px: 1.5,
                    py: 0.5,
                    backdropFilter: 'blur(4px)',
                  }}>
                    {stat.isIncrease ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.5, color: 'inherit' }}>
                      {stat.trend}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ 
            color: '#fff',
            fontWeight: 600,
            mb: 3,
          }}>
            Recent Activity
          </Typography>
          <Card sx={{
            p: 3,
            background: 'linear-gradient(145deg, rgba(31,41,55,0.5) 0%, rgba(17,24,39,0.5) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 2,
          }}>
            <Stack spacing={2}>
              <Typography sx={{ color: '#6B7280' }}>
                No recent activity to display
              </Typography>
            </Stack>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentDashboard; 