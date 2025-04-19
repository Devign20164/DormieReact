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
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

// Add styles for pulsing animation
const pulsingAnimationStyle = {
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.4)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(255, 255, 255, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(255, 255, 255, 0)',
    },
  },
  animation: 'pulse 1.5s infinite',
};

const NotificationBell = ({ userType = 'admin', color = '#10B981' }) => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { socket, isConnected, joinRoom } = useSocket();
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Add missing anchorRef
  const anchorRef = useRef(null);
  
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
      // Use different endpoints based on user type
      if (userType === 'admin') {
        await axios.put(`${apiBaseRoute}/notifications/${notificationId}/read`);
      } else if (userType === 'student') {
        // Student route uses /:id/read where id is the notification ID
        await axios.put(`${apiBaseRoute}/notifications/${notificationId}/read`);
      } else if (userType === 'staff') {
        // Assuming staff route is similar to admin's
        await axios.put(`${apiBaseRoute}/notifications/${notificationId}/read`);
      }

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
      // Use different endpoints based on user type
      if (userType === 'admin') {
        await axios.delete(`${apiBaseRoute}/notifications/delete-all`);
      } else if (userType === 'student') {
        // Student route uses PUT for read-all instead of DELETE
        await axios.put(`${apiBaseRoute}/notifications/read-all`);
      } else if (userType === 'staff') {
        // Assuming staff route is similar to admin's
        await axios.delete(`${apiBaseRoute}/notifications/delete-all`);
      }
      
      // Clear notifications from the state
      setNotifications([]);
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
        color="inherit"
        ref={anchorRef}
        onClick={handleClick}
        sx={{
          position: 'relative',
          background: 'linear-gradient(145deg, #1a1a25, #252535)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '10px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 25px rgba(0, 0, 0, 0.6)',
            transform: 'translateY(-2px)',
            background: 'linear-gradient(145deg, #202030, #2c2c40)',
          },
          ...(isPulsing && pulsingAnimationStyle),
        }}
      >
        <Badge
          badgeContent={unreadCount}
          max={99}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#ffffff',
              color: '#000000',
              fontWeight: 'bold',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          <NotificationsIcon sx={{ color: '#ffffff' }} />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="notification-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 5,
          sx: {
            maxWidth: 400,
            minWidth: 340,
            overflow: 'visible',
            background: 'linear-gradient(180deg, #121218, #18181f 10%)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 18,
              width: 10,
              height: 10,
              bgcolor: '#121218',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            },
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'linear-gradient(180deg, #333340, #252530)',
              borderRadius: '10px',
              border: '2px solid rgba(0, 0, 0, 0.1)',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          background: 'linear-gradient(90deg, #151520, #1c1c28)',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
        }}>
          <Box>
            <Typography 
              sx={{ 
                fontWeight: 700, 
                fontSize: '1.1rem', 
                color: '#f8f8f8',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              Notifications
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#aaaabc',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              You have <span style={{ 
                fontWeight: 600, 
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                padding: '1px 6px',
                borderRadius: '10px',
                color: '#ffffff',
              }}>{unreadCount}</span> unread
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAllRead();
              }}
              size="small"
              sx={{
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                textTransform: 'none',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <List
          sx={{
            p: 0,
            overflowY: 'auto',
            maxHeight: 400,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'linear-gradient(180deg, #333340, #252530)',
              borderRadius: '10px',
            },
          }}
        >
          {notifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                background: 'linear-gradient(145deg, #15151d, #1a1a22)',
              }}
            >
              <NotificationsOffIcon sx={{ color: '#3a3a50', fontSize: 40, mb: 2 }} />
              <Typography sx={{ color: '#8888a0' }}>No notifications</Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => {
              const { icon, content } = getNotificationContent(notification);
              return (
                <React.Fragment key={notification._id}>
                  <ListItem
                    onClick={() => handleNotificationClick(notification._id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: notification.isRead ? 'transparent' : 'rgba(35, 35, 50, 0.4)',
                      py: 1.5,
                      borderBottom: index < notifications.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(45, 45, 60, 0.5)',
                        transform: 'translateX(2px)',
                      }
                    }}
                  >
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        background: 'linear-gradient(135deg, #2a2a38, #222230)', 
                        p: 0.8, 
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}>
                        {React.cloneElement(icon, { sx: { color: '#ffffff' } })}
                      </Box>
                    </Box>
                    <ListItemText
                      primary={notification.title}
                      secondary={content}
                      sx={{
                        '.MuiListItemText-primary': { 
                          color: '#ffffff', 
                          fontWeight: notification.isRead ? 400 : 600,
                          fontSize: '0.95rem',
                          mb: 0.5,
                          textShadow: notification.isRead ? 'none' : '0 0 1px rgba(255, 255, 255, 0.3)',
                        },
                        '.MuiListItemText-secondary': { 
                          color: notification.isRead ? '#7f7f95' : '#9a9ab0',
                          fontSize: '0.85rem',
                        }
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: '#6B7280', 
                        ml: 2, 
                        minWidth: 'fit-content',
                        fontSize: '0.7rem',
                        backgroundColor: notification.isRead ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
                        padding: notification.isRead ? '0' : '2px 6px',
                        borderRadius: '8px',
                      }}
                    >
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </Typography>
                  </ListItem>
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