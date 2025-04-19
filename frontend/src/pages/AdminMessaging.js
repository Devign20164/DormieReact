import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Divider,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, Search as SearchIcon, DoneAll as DoneAllIcon, Check as CheckIcon, Pending as PendingIcon } from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { format } from 'date-fns';

const AdminMessaging = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { socket, isConnected } = useSocket();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isTypingRef = React.useRef(false);
  const typingTimeoutRef = React.useRef(null);
  const [typingUsers, setTypingUsers] = useState({});

  // Fetch all students
  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    }
  }, []);

  // Start new conversation
  const startConversation = async (studentId) => {
    try {
      const response = await axios.post('/api/admin/conversations', {
        participantId: studentId
      });

      // Update conversations list if this is a new conversation
      setConversations(prev => {
        const exists = prev.some(conv => conv._id === response.data._id);
        if (!exists) {
          return [...prev, response.data];
        }
        return prev;
      });

      // Select the conversation and fetch messages
      handleChatSelect(response.data);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation');
    }
  };

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/conversations/${conversationId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      // Clear typing indicator
      handleTyping(false);
      
      const messageText = message.trim();
      setMessage('');  // Clear input field immediately for better UX
      
      // Find the recipient from the selected chat
      const recipient = selectedChat.participants.find(p => p.id !== userData._id);
      if (!recipient) {
        console.error('[AdminMessaging] No recipient found in conversation');
        return;
      }
      
      console.log('[AdminMessaging] Sending message to recipient:', recipient.id);
      
      // Make API call to save the message
      const response = await axios.post('/api/admin/messages', {
        conversationId: selectedChat._id,
        content: messageText,
      });

      // Add the new message to the messages list
      setMessages(prev => [...prev, response.data]);
      
      // Force scroll to bottom
      setTimeout(() => {
        const messageContainer = document.querySelector('.message-container');
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }, 100);
      
      // Update conversations list with new message
      setConversations(prev => prev.map(conv => 
        conv._id === selectedChat._id
          ? { ...conv, lastMessage: response.data }
          : conv
      ));
      
      // Ensure recipient ID is a string
      const recipientId = recipient.id.toString();
      
      // Make sure socket is connected
      if (socket && isConnected) {
        console.log('[AdminMessaging] Emitting newMessage event via socket for message:', response.data._id);
        
        // Emit message to both the individual room and broadcast
        socket.emit('newMessage', {
          message: response.data,
          conversationId: selectedChat._id,
          recipientId: recipientId
        });
        
        // Verify message delivery
        socket.emit('verifyMessageDelivery', {
          messageId: response.data._id,
          recipientId: recipientId
        });
      } else {
        console.error('[AdminMessaging] Socket not connected, attempting to connect');
        // Try to reconnect socket
        if (socket) {
          socket.connect();
          setTimeout(() => {
            if (socket.connected) {
              console.log('[AdminMessaging] Reconnected, now emitting message');
              socket.emit('newMessage', {
                message: response.data,
                conversationId: selectedChat._id,
                recipientId: recipientId
              });
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('[AdminMessaging] Error sending message:', error);
      
      // Show the error to the user
      setError('Failed to send message');
      
      // Restore the message text so the user can try again
      setMessage(message);
    }
  };
  
  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (!selectedChat || !socket || !isConnected) return;
    
    // Only emit if typing status changed
    if (isTyping !== isTypingRef.current) {
      isTypingRef.current = isTyping;
      socket.emit('typing', {
        conversationId: selectedChat._id,
        isTyping
      });
    }
  };

  // Handle message input change with typing indicator
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicator with debounce
    if (value.trim().length > 0) {
      handleTyping(true);
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 2000);
    } else {
      handleTyping(false);
    }
  };

  // Render message status indicator
  const renderMessageStatus = (message) => {
    if (message.sender.id !== userData._id) return null;
    
    if (message.isRead) {
      return <DoneAllIcon fontSize="small" sx={{ color: '#3B82F6', ml: 1 }} />;
    } else if (message.delivered) {
      return <CheckIcon fontSize="small" sx={{ color: 'text.secondary', ml: 1 }} />;
    } else {
      return <PendingIcon fontSize="small" sx={{ color: 'text.secondary', ml: 1 }} />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'h:mm a');
  };

  // Handle selecting a chat
  const handleChatSelect = (conversation) => {
    setSelectedChat(conversation);
    
    // When selecting a new chat, clear typing state from any previous chat
    setTypingUsers({});
    
    // Reset any typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Join conversation room for real-time updates
    if (socket) {
      // If we were in a previous conversation, leave that room
      if (selectedChat && selectedChat._id !== conversation._id) {
        socket.emit('leaveConversation', { conversationId: selectedChat._id });
      }
      
      // Join the new conversation room
      socket.emit('joinConversation', { conversationId: conversation._id });
      socket.emit('activeInConversation', { conversationId: conversation._id });
      
      // Explicitly register for messages in this conversation
      socket.emit('listenToConversation', { conversationId: conversation._id });
      
      console.log('[AdminMessaging] Joined conversation room:', conversation._id);
    }
    
    // Fetch messages for this conversation
    fetchMessages(conversation._id);
    
    // Mark all messages as read immediately
    if (conversation.unreadCount && conversation.unreadCount > 0) {
      // Update the conversation in state to show 0 unread
      setConversations(prev => prev.map(conv =>
        conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
      ));
      
      // Mark messages as read on the server
      if (socket && isConnected) {
        socket.emit('markConversationSeen', { conversationId: conversation._id });
      }
    }
  };

  // Force socket connection when component mounts
  useEffect(() => {
    console.log('[AdminMessaging] Component mounted - ensuring socket connection');
    if (socket && !isConnected) {
      console.log('[AdminMessaging] Forcing socket reconnection on component mount');
      socket.connect();
    } else if (socket) {
      console.log('[AdminMessaging] Socket already connected - re-registering for events');
      // Re-register for events to ensure we're receiving messages
      socket.emit('join', userData._id?.toString());
      socket.emit('joinUserType', 'admin');
      socket.emit('registerAdminForMessages');
    }
  }, []);

  // Setup socket events
  useEffect(() => {
    if (!socket) return;

    console.log('[AdminMessaging] Setting up socket events for admin:', userData._id);
    
    // Force connection status check
    const connectionStatus = socket.connected;
    console.log('[AdminMessaging] Current socket connection status:', connectionStatus ? 'connected' : 'disconnected');
    
    // Force reconnection if socket exists but is not connected
    if (!connectionStatus) {
      console.log('[AdminMessaging] Socket exists but not connected. Attempting reconnection...');
      socket.connect();
    }
    
    if (connectionStatus) {
      console.log('[AdminMessaging] Socket already connected, joining rooms with ID:', userData._id);
      socket.emit('join', userData._id?.toString());
      socket.emit('joinUserType', 'admin');
      
      // Register for global admin notifications
      socket.emit('registerAdminForNotifications');
      socket.emit('registerAdminForMessages');
    }

    // Listen for new messages with enhanced logging
    socket.on('newMessage', ({ message, conversation: conversationId }) => {
      console.log('[AdminMessaging] New message received:', message, 'for conversation:', conversationId);
      
      try {
        // Play notification sound for new messages
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.log('[AdminMessaging] Could not play notification sound:', err));
        
        // Check if the message is from someone else - if so, play notification sound
        if (message.sender.id !== userData._id) {
          // You could add a sound effect here
          console.log('[AdminMessaging] Message from another user received');
        }
        
        // Update messages if the conversation is currently selected
        if (selectedChat?._id === conversationId) {
          console.log('[AdminMessaging] Adding message to current conversation view');
          
          // Check if message already exists in the list to prevent duplication
          setMessages(prev => {
            // Check if message with this ID already exists
            const messageExists = prev.some(m => m._id === message._id);
            if (messageExists) {
              console.log('[AdminMessaging] Message already exists in state, skipping:', message._id);
              return prev;
            }
            
            console.log('[AdminMessaging] Adding new message to state:', message._id);
            
            // If this is a message from the other person, mark it as seen
            if (message.sender.id !== userData._id) {
              console.log('[AdminMessaging] Marking message as seen:', message._id);
              socket.emit('markMessageSeen', {
                messageId: message._id,
                conversationId: conversationId
              });
            }
            
            // Force a small delay to ensure React re-renders properly
            setTimeout(() => {
              // Scroll to the bottom of the message container
              const messageContainer = document.querySelector('.message-container');
              if (messageContainer) {
                messageContainer.scrollTop = messageContainer.scrollHeight;
              }
            }, 100);
            
            return [...prev, message];
          });
          
          // Notify server that we're active in this conversation
          socket.emit('activeInConversation', { conversationId });
        } else {
          console.log('[AdminMessaging] Message is for a different conversation than current view:', 
            selectedChat?._id, 'vs', conversationId);
        }

        // Update the conversations list to reflect new message
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv._id === conversationId) {
              // If this conversation already has the message, don't modify it
              if (conv.lastMessage && conv.lastMessage._id === message._id) {
                return conv;
              }
              
              // Update with new last message
              console.log('[AdminMessaging] Updating conversation last message:', conv.student?.name || 'Unknown Student');
              return {
                ...conv,
                lastMessage: message,
                unreadCount: selectedChat?._id === conversationId 
                  ? 0 // If we're viewing this conversation, reset counter
                  : (conv.unreadCount || 0) + 1
              };
            }
            return conv;
          });
          
          // Re-sort conversations to bring the one with the new message to top
          return updated.sort((a, b) => {
            const aDate = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
            const bDate = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
            return bDate - aDate;
          });
        });
        
        // Play a notification sound or show a toast for unread messages
        if (selectedChat?._id !== conversationId) {
          // Add notification logic here if desired
          console.log('Should show notification for new message');
        }
      } catch (err) {
        console.error('[AdminMessaging] Error handling new message:', err);
      }
    });

    // Listen for message delivery status
    socket.on('messageDelivered', ({ messageId, conversationId, deliveredAt }) => {
      console.log('Message delivered:', messageId);
      
      // Update message delivery status
      if (selectedChat?._id === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, delivered: true, deliveredAt } : msg
        ));
      }
    });

    // Listen for message seen events
    socket.on('messageSeen', ({ messageId }) => {
      console.log('[AdminMessaging] Message seen event received for:', messageId);
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, seen: true } : msg
        )
      );
    });

    // Listen for user status changes
    socket.on('userStatus', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Listen for typing indicators
    socket.on('typing', ({ conversationId, userId, isTyping }) => {
      console.log('Typing indicator:', { conversationId, userId, isTyping });
      
      if (selectedChat?._id === conversationId) {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping
        }));
      }
    });

    // Listen for conversation seen events
    socket.on('conversationSeen', ({ conversationId, seenBy, seenAt }) => {
      console.log('Conversation seen:', conversationId, 'by user:', seenBy);
      
      // Update all your messages in this conversation to read status
      if (selectedChat?._id === conversationId) {
        setMessages(prev => prev.map(msg => {
          // Only update messages sent by the current user and to the reader
          if (msg.sender.id === userData._id && 
              msg.recipient.id === seenBy && 
              !msg.isRead) {
            return { ...msg, isRead: true, readAt: seenAt };
          }
          return msg;
        }));
      }
    });

    // Listen for conversation user status updates
    socket.on('userConversationStatus', ({ userId, conversationId, status }) => {
      if (selectedChat?._id === conversationId && userId !== userData._id) {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (status === 'active') {
            newSet.add(userId);
          }
          return newSet;
        });
      }
    });

    // Listen for special student-to-admin messages
    socket.on('studentMessageToAdmin', ({ message, conversation: conversationId }) => {
      console.log('[AdminMessaging] Received student message via admin channel:', message, 'for conversation:', conversationId);
      
      try {
        // Update messages if the conversation is currently selected
        if (selectedChat?._id === conversationId) {
          console.log('[AdminMessaging] Adding student message to current conversation view');
          
          // Check if message already exists in the list to prevent duplication
          setMessages(prev => {
            // Check if message with this ID already exists
            const messageExists = prev.some(m => m._id === message._id);
            if (messageExists) {
              console.log('[AdminMessaging] Message already exists in state, skipping:', message._id);
              return prev;
            }
            
            console.log('[AdminMessaging] Adding new student message to state:', message._id);
            
            // Mark message as seen since we're actively viewing this conversation
            socket.emit('markMessageSeen', {
              messageId: message._id,
              conversationId: conversationId
            });
            
            // Force a small delay to ensure React re-renders properly
            setTimeout(() => {
              // Scroll to the bottom of the message container
              const messageContainer = document.querySelector('.message-container');
              if (messageContainer) {
                messageContainer.scrollTop = messageContainer.scrollHeight;
              }
            }, 100);
            
            return [...prev, message];
          });
        } else {
          console.log('[AdminMessaging] Student message is for a different conversation, updating counts');
          // Update unread counts and trigger fetch if needed
          fetchConversations();
        }
      } catch (err) {
        console.error('[AdminMessaging] Error handling student message:', err);
      }
    });

    // Listen for new global admin notifications
    socket.on('adminNotification', ({ type, data }) => {
      console.log('[AdminMessaging] Received admin notification:', type, data);
      
      // If it's a new message notification, refresh conversations
      if (type === 'newMessage') {
        console.log('[AdminMessaging] New message notification, refreshing conversations');
        fetchConversations();
      }
    });

    // Clean up socket listeners
    return () => {
      console.log('[AdminMessaging] Cleaning up socket events');
      socket.off('newMessage');
      socket.off('messageDelivered');
      socket.off('messageSeen');
      socket.off('userStatus');
      socket.off('typing');
      socket.off('conversationSeen');
      socket.off('userConversationStatus');
      socket.off('studentMessageToAdmin');
      socket.off('adminNotification');
      
      // If in a conversation, leave that room
      if (selectedChat) {
        socket.emit('leaveConversation', { conversationId: selectedChat._id });
        socket.emit('inactiveInConversation', { conversationId: selectedChat._id });
      }
    };
  }, [socket, isConnected, selectedChat, userData._id, fetchConversations]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      console.log('[AdminMessaging] Messages updated, scrolling to bottom');
      setTimeout(() => {
        const messageContainer = document.querySelector('.message-container');
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  // Initial fetch of students and conversations
  useEffect(() => {
    fetchStudents();
    fetchConversations();
  }, [fetchStudents, fetchConversations]);

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student && student.name && student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student && student.dormNumber && student.dormNumber.toString().includes(searchQuery)
  );

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv && conv.participants && conv.participants.some(p => 
      p && p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Near fetchConversations function
  // Poll for conversations periodically to ensure we have the latest data
  useEffect(() => {
    // Initial fetch
    fetchConversations();
    
    // Set up polling for new conversations
    const intervalId = setInterval(() => {
      if (isConnected) {
        console.log('[AdminMessaging] Polling for new conversations');
        fetchConversations();
      }
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchConversations, isConnected]);

  // Add debug tracing for Socket.IO issues
  const debugSocketEvents = () => {
    if (!socket) return;
    
    const originalEmit = socket.emit;
    
    // Override emit to add logging
    socket.emit = function(event, ...args) {
      console.log(`[Socket Debug] EMIT: ${event}`, args);
      return originalEmit.apply(this, [event, ...args]);
    };
    
    const eventHandlers = socket._callbacks || {};
    
    console.log('[Socket Debug] Current event listeners:', 
      Object.keys(eventHandlers).map(k => k.replace('$', '')));
      
    // Test socket connection
    socket.emit('ping');
    
    // Force refresh of connection
    if (socket.connected) {
      console.log('[Socket Debug] Socket is connected with ID:', socket.id);
    } else {
      console.log('[Socket Debug] Socket is NOT connected, attempting reconnection...');
      socket.connect();
    }
  };
  
  // Debug socket after component mounts
  useEffect(() => {
    // Wait a bit for socket to initialize properly
    setTimeout(() => {
      console.log('[AdminMessaging] Running socket debug...');
      debugSocketEvents();
    }, 2000);
  }, [socket]);

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
      <AdminSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 3,
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}>
            Messages
          </Typography>
          {!isConnected && (
            <Box 
              onClick={() => socket && socket.connect()}
              sx={{
                py: 1,
                px: 2,
                borderRadius: '8px',
                bgcolor: 'rgba(255,0,0,0.2)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': {
                  bgcolor: 'rgba(255,0,0,0.3)'
                }
              }}
            >
              <Typography variant="body2">Disconnected - Click to reconnect</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ 
          display: 'flex',
          gap: 3,
          flexGrow: 1,
          height: 'calc(100vh - 180px)',
        }}>
          {/* Conversations List */}
          <Paper sx={{ 
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search students by name or dorm number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#10B981',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#6B7280',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#6B7280' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.03)' }} />
            <List sx={{ 
              flexGrow: 1, 
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
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '4px'
              }
            }}>
              {filteredStudents.map((student) => {
                const hasUnreadMessages = conversations.some(conv => 
                  conv.participants.some(p => p.id === student._id) && 
                  (conv.unreadCount?.[userData._id] || 0) > 0
                );
                
                return (
                  <ListItem
                    key={student._id}
                    button
                    onClick={() => startConversation(student._id)}
                    sx={{
                      '&:hover': { 
                        backgroundColor: 'rgba(255,255,255,0.03)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: hasUnreadMessages ? '#10B981' : '#374151' }}>
                        {student?.name?.[0] || '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={student?.name || 'Unknown Student'}
                      secondary={`Dorm #${student?.dormNumber || 'N/A'}`}
                      primaryTypographyProps={{
                        color: '#fff',
                      }}
                      secondaryTypographyProps={{
                        color: '#6B7280',
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>

          {/* Chat Area */}
          <Paper sx={{ 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <Box sx={{ 
                  p: 2, 
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <Avatar sx={{ bgcolor: '#10B981' }}>
                    {selectedChat.participants.find(p => p.id !== userData._id)?.name?.[0] || '?'}
                  </Avatar>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    {selectedChat.participants.find(p => p.id !== userData._id)?.name || 'Unknown Student'}
                  </Typography>
                </Box>

                {/* Messages */}
                <Box className="message-container" sx={{ 
                  flexGrow: 1, 
                  p: 2,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
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
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '4px'
                  }
                }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={40} sx={{ color: '#10B981' }} />
                    </Box>
                  ) : (
                    messages.map((msg) => (
                      <Box
                        key={msg?._id || Math.random().toString()}
                        sx={{
                          alignSelf: msg?.sender?.id === userData._id ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                        }}
                      >
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: msg?.sender?.id === userData._id ? '#10B981' : 'rgba(255,255,255,0.03)',
                            color: msg?.sender?.id === userData._id ? 'white' : '#fff',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body1">{msg?.content || ''}</Typography>
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 1,
                            mt: 0.5,
                          }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.8,
                              }}
                            >
                              {msg?.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                            </Typography>
                          </Box>
                        </Paper>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#10B981',
                        },
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: '#6B7280',
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={handleSendMessage}
                            disabled={!message.trim() || loading}
                            sx={{ 
                              color: message.trim() ? '#10B981' : '#6B7280',
                              '&:hover': {
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              }
                            }}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                color: '#6B7280',
              }}>
                <Typography variant="body1">Select a conversation to start messaging</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminMessaging; 