import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const NotificationBell = ({ userType = 'admin', color = '#10B981' }) => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { socket, isConnected, joinRoom } = useSocket();
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Reference to the notification sound
  const notificationSoundRef = useRef(new Audio('/notification.mp3'));
  // Used to track seen notifications
  const processedNotifications = useRef(new Set());

  // Play notification sound
  const playNotificationSound = () => {
    try {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(err => {
        console.log('Sound play error (probably user has not interacted with page yet):', err);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Pulse animation function
  const triggerPulse = () => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1000); // Pulse for 1 second
  };

  // Add connection status logging
  useEffect(() => {
    if (isConnected) {
      console.log('Socket connected successfully');
    } else {
      console.log('Socket not connected');
    }
  }, [isConnected]);

  // Determine the API base route based on user type
  const apiBaseRoute = userType === 'admin' 
    ? '/api/admin' 
    : userType === 'staff' 
      ? '/api/staff' 
      : '/api/students';

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${apiBaseRoute}/notifications`);
      console.log('Fetched notifications:', response.data.length);
      
      // Process and deduplicate
      const notifs = response.data;
      notifs.forEach(notif => {
        processedNotifications.current.add(notif._id);
      });
      
      setNotifications(notifs);
      
      // Count unread notifications accurately
      const unreadNotifs = notifs.filter(notif => !notif.isRead);
      console.log('Unread notifications count:', unreadNotifs.length);
      setUnreadCount(unreadNotifs.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Handle new notification event
  const handleNewNotification = (notification) => {
    console.log('Processing new notification:', notification);
    
    // Ignore if not for this user
    if (notification.recipient.id !== userData._id) {
      console.log('Notification not for current user, ignoring');
      return;
    }
    
    // Check if already processed to avoid duplicates
    if (processedNotifications.current.has(notification._id)) {
      console.log('Notification already processed, ignoring:', notification._id);
      return;
    }
    
    // Mark as processed
    processedNotifications.current.add(notification._id);
    
    // Add to list and update counter
    setNotifications(prev => [notification, ...prev]);
    
    if (!notification.isRead) {
      console.log('Incrementing unread count for new notification');
      setUnreadCount(prev => prev + 1);
      
      // Sound and visual notification for messages
      if (notification.type === 'MESSAGE') {
        playNotificationSound();
        triggerPulse();
      }
    }
  };

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected || !userData._id) {
      console.log('Socket connection prerequisites not met');
      return;
    }

    console.log('Setting up notification listeners');
    
    // Clean up existing listeners
    socket.off('newNotification');
    socket.off('notificationUpdate');

    // Join user's room if needed
    joinRoom(userData._id);

    // Listen for new notifications
    socket.on('newNotification', handleNewNotification);

    // Listen for notification updates
    socket.on('notificationUpdate', ({ type, notificationId, userId }) => {
      console.log('Notification update:', type, notificationId);
      
      // Skip if not for this user
      if (userId && userId !== userData._id) return;
      
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
        setNotifications(prev => {
          // Check if notification was unread before removing
          const wasUnread = prev.some(notif => 
            notif._id === notificationId && !notif.isRead
          );
          
          if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          
          return prev.filter(notif => notif._id !== notificationId);
        });
      } else if (type === 'readAll' || type === 'deleteAll') {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    // Clean up
    return () => {
      console.log('Cleaning up notification listeners');
      socket.off('newNotification');
      socket.off('notificationUpdate');
    };
  }, [socket, isConnected, userData._id, joinRoom]);

  // Initial fetch when socket is connected or user data changes
  useEffect(() => {
    if (socket && isConnected && userData._id) {
      console.log('Fetching notifications after connection established');
      fetchNotifications();
    }
  }, [socket, isConnected, userData._id]);

  // Regular polling as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (userData._id) {
        fetchNotifications();
      }
    }, 60000); // Check every minute as a fallback
    
    return () => clearInterval(interval);
  }, [userData._id]);

  // Menu handlers
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Mark notification as read and delete it
  const handleNotificationClick = async (notificationId) => {
    try {
      await axios.delete(`${apiBaseRoute}/notifications/${notificationId}`);
      
      // Remove the notification from the list
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Emit socket event for real-time update
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
      console.log('Attempting to delete all notifications...');
      const response = await axios.delete(`${apiBaseRoute}/notifications/delete-all`);
      console.log('Delete all response:', response.data);
      
      // Clear all notifications
      setNotifications([]);
      
      // Reset unread count explicitly
      setUnreadCount(0);
      
      // Emit socket event for real-time update
      if (socket && isConnected) {
        socket.emit('allNotificationsDeleted', {
          userId: userData._id
        });
      }
      
      handleClose();
    } catch (error) {
      console.error('Error deleting all notifications:', error.response?.data || error);
    }
  };

  return (
    <>
      <IconButton 
        onClick={handleClick}
        sx={{ 
          color: '#6B7280',
          transition: 'all 0.3s ease',
          animation: isPulsing ? 'pulse 1s infinite' : 'none',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)',
            },
            '70%': {
              transform: 'scale(1.1)',
              boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)',
            },
            '100%': {
              transform: 'scale(1)',
              boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)',
            },
          },
          '&:hover': {
            color: color,
            background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`,
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
              color: color, 
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
                      bgcolor: color,
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
    </>
  );
};

export default NotificationBell; 