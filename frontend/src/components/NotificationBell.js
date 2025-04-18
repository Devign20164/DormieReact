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
  Message as MessageIcon,
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
      console.log(`[NotificationBell] Fetching notifications for ${userType} with ID:`, userData._id);
      const response = await axios.get(`${apiBaseRoute}/notifications`);
      
      // Process and deduplicate
      const notifs = response.data;
      console.log(`[NotificationBell] Found ${notifs.length} notifications for ${userType} ${userData._id}`);
      
      notifs.forEach(notif => {
        processedNotifications.current.add(notif._id);
      });
      
      setNotifications(notifs);
      
      // Count unread notifications accurately
      const unreadNotifs = notifs.filter(notif => !notif.isRead);
      console.log(`[NotificationBell] ${unreadNotifs.length} unread notifications for ${userType}`);
      setUnreadCount(unreadNotifs.length);
    } catch (error) {
      console.error(`[NotificationBell] Error fetching notifications for ${userType}:`, error);
    }
  };

  // Handle new notification event
  const handleNewNotification = (notification) => {
    console.log(`[NotificationBell] Processing new notification for ${userType}:`, notification);
    
    // Skip notifications that have already been processed
    if (processedNotifications.current.has(notification._id)) {
      console.log(`[NotificationBell] Notification already processed for ${userType}, ignoring:`, notification._id);
      return;
    }
    
    // Check if notification is for this user specifically or for their role
    const isForThisUser = 
      // Notification has specific recipient ID that matches this user
      (notification.recipient.id && notification.recipient.id === userData._id) ||
      // Notification is for all admins and this user is an admin
      (notification.recipient.model === 'Admin' && userType === 'admin') ||
      // Notification is for all staff and this user is staff
      (notification.recipient.model === 'Staff' && userType === 'staff') ||
      // Notification is for a specific user and this is a student
      (notification.recipient.model === 'User' && userType === 'student' && notification.recipient.id === userData._id);
      
    if (!isForThisUser) {
      console.log(`[NotificationBell] Notification not for current ${userType}, ignoring`);
      return;
    }
    
    console.log(`[NotificationBell] Adding new notification for ${userType}`);
    
    // Mark as processed
    processedNotifications.current.add(notification._id);
    
    // Add to list and update counter
    setNotifications(prev => [notification, ...prev]);
    
    if (!notification.isRead) {
      console.log(`[NotificationBell] Incrementing unread count for ${userType}`);
      setUnreadCount(prev => prev + 1);
      
      // Play sound and trigger pulse for messages and system notifications
      if (notification.type === 'MESSAGE' || notification.type === 'SYSTEM') {
        playNotificationSound();
        triggerPulse();
      }
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    if (userData._id) {
      console.log(`[NotificationBell] Initial fetch for ${userType} ${userData._id}`);
      fetchNotifications();
    }
  }, [userData._id]);

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected || !userData._id) {
      console.log(`[NotificationBell] Socket connection prerequisites not met for ${userType}:`, {
        hasSocket: !!socket,
        isConnected,
        userId: userData._id
      });
      return;
    }

    const setupSocketListeners = () => {
      console.log(`[NotificationBell] Setting up notification listeners for ${userType}:`, userData._id);
      
      // Clean up existing listeners
      socket.off('newNotification');
      socket.off('notificationUpdate');

      // Join user's room
      joinRoom(userData._id);
      console.log(`[NotificationBell] ${userType} joined room:`, userData._id);

      // Listen for new notifications
      socket.on('newNotification', (notification) => {
        console.log(`[NotificationBell] ${userType} received new notification:`, notification);
        handleNewNotification(notification);
      });
    };

    // Initial setup
    setupSocketListeners();

    // Cleanup function
    return () => {
      console.log(`[NotificationBell] Cleaning up socket listeners for ${userType}`);
      if (socket) {
        socket.off('newNotification');
        socket.off('notificationUpdate');
      }
    };
  }, [socket, isConnected, userData._id]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await axios.put(`${apiBaseRoute}/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${apiBaseRoute}/notifications/mark-all-read`);
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      handleClose();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationContent = (notification) => {
    switch (notification.type) {
      case 'MESSAGE':
        return {
          icon: <MessageIcon sx={{ color: '#3B82F6' }} />,
          content: notification.content
        };
      case 'SYSTEM':
        return {
          icon: <NotificationsIcon sx={{ color: '#10B981' }} />,
          content: notification.content
        };
      default:
        return {
          icon: <NotificationsIcon sx={{ color: '#6B7280' }} />,
          content: notification.content
        };
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          animation: isPulsing ? 'pulse 1s cubic-bezier(0, 0, 0.2, 1)' : 'none',
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
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ color }} />
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
            backgroundColor: '#1F2937',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Typography
              variant="button"
              sx={{
                color: '#10B981',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Typography>
          )}
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                sx={{ 
                  '.MuiListItemText-primary': { 
                    color: '#9CA3AF',
                    textAlign: 'center'
                  }
                }}
              />
            </ListItem>
          ) : (
            notifications.map((notification, index) => {
              const { icon, content } = getNotificationContent(notification);
              return (
                <React.Fragment key={notification._id}>
                  <ListItem
                    onClick={() => handleNotificationClick(notification._id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: notification.isRead ? 'transparent' : 'rgba(16, 185, 129, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <Box sx={{ mr: 2 }}>{icon}</Box>
                    <ListItemText
                      primary={notification.title}
                      secondary={content}
                      sx={{
                        '.MuiListItemText-primary': { color: '#fff' },
                        '.MuiListItemText-secondary': { color: '#9CA3AF' }
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: '#6B7280', ml: 2, minWidth: 'fit-content' }}
                    >
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </Typography>
                  </ListItem>
                  {index < notifications.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  )}
                </React.Fragment>
              );
            })
          )}
        </List>
      </Menu>
    </>
  );
};

export default NotificationBell; 