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
import StudentSidebar from '../components/StudentSidebar';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const StudentMessaging = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [students, setStudents] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const { socket, isConnected } = useSocket();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isTypingRef = React.useRef(false);
  const typingTimeoutRef = React.useRef(null);

  // Fetch all admins
  const fetchAdmins = useCallback(async () => {
    try {
      const response = await axios.get('/api/students/admins');
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setError('Failed to load admins');
    }
  }, []);

  // Fetch all students
  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get('/api/students/others');
      setStudents(response.data.filter(student => student._id !== userData._id));
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    }
  }, [userData._id]);

  // Start new conversation
  const startConversation = async (participantId) => {
    try {
      const response = await axios.post('/api/students/conversations', {
        participantId
      });
      setConversations(prev => {
        // Check if conversation already exists
        const exists = prev.some(conv => conv._id === response.data._id);
        if (!exists) {
          return [...prev, response.data];
        }
        return prev;
      });
      handleChatSelect(response.data);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation');
    }
  };

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await axios.get('/api/students/conversations');
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
      const response = await axios.get(`/api/students/messages/${conversationId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Force socket connection when component mounts
  useEffect(() => {
    console.log('[StudentMessaging] Component mounted - ensuring socket connection');
    if (socket && !isConnected) {
      console.log('[StudentMessaging] Forcing socket reconnection on component mount');
      socket.connect();
    } else if (socket) {
      console.log('[StudentMessaging] Socket already connected - re-registering for events');
      // Re-register for events to ensure we're receiving messages
      socket.emit('join', userData._id?.toString());
      socket.emit('joinUserType', 'student');
    }
  }, []);

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket) return;

    console.log('[StudentMessaging] Setting up socket events for user:', userData._id);
    
    // Force connection status check
    const connectionStatus = socket.connected;
    console.log('[StudentMessaging] Current socket connection status:', connectionStatus ? 'connected' : 'disconnected');
    
    // Force reconnection if socket exists but is not connected
    if (!connectionStatus) {
      console.log('[StudentMessaging] Socket exists but not connected. Attempting reconnection...');
      socket.connect();
    }
    
    if (connectionStatus) {
      console.log('[StudentMessaging] Socket already connected, joining rooms with ID:', userData._id);
      socket.emit('join', userData._id?.toString());
      socket.emit('joinUserType', 'student');
    }
    
    // Listen for connection status
    socket.on('connect', () => {
      console.log('[StudentMessaging] Socket connected successfully with ID:', socket.id);
      // Join the room for this user
      socket.emit('join', userData._id?.toString());
      socket.emit('joinUserType', 'student');
      
      // Join conversation room if one is selected
      if (selectedChat) {
        socket.emit('joinConversation', { conversationId: selectedChat._id });
        socket.emit('activeInConversation', { conversationId: selectedChat._id });
        socket.emit('listenToConversation', { conversationId: selectedChat._id });
      }
      
      // Refresh conversations after reconnect
      fetchConversations();
    });
    
    socket.on('disconnect', () => {
      console.log('[StudentMessaging] Socket disconnected');
    });

    // Listen for new messages with enhanced logging
    socket.on('newMessage', ({ message, conversation: conversationId }) => {
      console.log('[StudentMessaging] New message received:', message, 'for conversation:', conversationId);
      
      try {
        // Play notification sound for new messages
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.log('[StudentMessaging] Could not play notification sound:', err));
        
        // Check if the message is from someone else - if so, play notification sound
        if (message.sender.id !== userData._id) {
          // You could add a sound effect here
          console.log('[StudentMessaging] Message from another user received');
        }
      
        // Update messages if the conversation is currently selected
        if (selectedChat?._id === conversationId) {
          console.log('[StudentMessaging] Adding message to current conversation view');
          
          // Check if message already exists in the list to prevent duplication
          setMessages(prev => {
            // Check if message with this ID already exists
            const messageExists = prev.some(m => m._id === message._id);
            if (messageExists) {
              console.log('[StudentMessaging] Message already exists in state, skipping:', message._id);
              return prev;
            }
            
            console.log('[StudentMessaging] Adding new message to state:', message._id);
            
            // If this is a message from the other person, mark it as seen
            if (message.sender.id !== userData._id) {
              console.log('[StudentMessaging] Marking message as seen:', message._id);
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
          console.log('[StudentMessaging] Message is for a different conversation than current view:', 
            selectedChat?._id, 'vs', conversationId);
        }

        // Update conversations list
        setConversations(prev => {
          const updatedConversations = prev.map(conv => {
            if (conv._id === conversationId) {
              console.log('[StudentMessaging] Updating conversation in list:', conv._id);
              
              // Skip if we're already using this message as the last message
              if (conv.lastMessage && conv.lastMessage._id === message._id) {
                return conv;
              }
              
              return {
                ...conv,
                lastMessage: message,
                unreadCount: selectedChat?._id === conversationId 
                  ? conv.unreadCount 
                  : (conv.unreadCount || 0) + 1
              };
            }
            return conv;
          });
          
          // Check if the conversation was actually updated
          const wasUpdated = updatedConversations.some(
            conv => conv._id === conversationId && conv.lastMessage?._id === message._id
          );
          
          if (!wasUpdated) {
            console.log('[StudentMessaging] Conversation not found in list, fetching conversations');
            // Refresh conversations list if the conversation isn't found
            fetchConversations();
          }
          
          return updatedConversations;
        });
        
        // Play a notification sound or show a toast for unread messages
        if (selectedChat?._id !== conversationId) {
          // Add notification logic here if desired
          console.log('[StudentMessaging] Should show notification for new message');
        }
      } catch (error) {
        console.error('[StudentMessaging] Error processing new message:', error);
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
    socket.on('messageSeen', ({ messageId, conversationId, readAt }) => {
      console.log('Message seen:', messageId);
      
      // Update message seen status if in the current conversation
      if (selectedChat?._id === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true, readAt } : msg
        ));
      }
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

    // Listen for entire conversation being marked as seen
    socket.on('conversationSeen', ({ conversationId, seenBy, seenAt }) => {
      console.log('Conversation marked as seen:', conversationId, 'by user:', seenBy);
      
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
      
      // Update conversation unread count in the list 
      setConversations(prev => prev.map(conv => {
        if (conv._id === conversationId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      }));
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

    // Clean up socket listeners
    return () => {
      socket.off('newMessage');
      socket.off('messageDelivered');
      socket.off('messageSeen');
      socket.off('userStatus');
      socket.off('typing');
      socket.off('conversationSeen');
      socket.off('userConversationStatus');
      
      // If in a conversation, leave that room
      if (selectedChat) {
        socket.emit('leaveConversation', { conversationId: selectedChat._id });
        socket.emit('inactiveInConversation', { conversationId: selectedChat._id });
      }
    };
  }, [socket, isConnected, selectedChat, userData._id]);

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
        console.error('[StudentMessaging] No recipient found in conversation');
        return;
      }
      
      console.log('[StudentMessaging] Sending message to recipient:', recipient.id);
      
      const response = await axios.post('/api/students/messages', {
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
      
      // Check if recipient is an admin for special handling
      const isAdminRecipient = recipientId && selectedChat.participants.some(p => 
        p.id === recipientId && (p.role === 'admin' || p.isAdmin)
      );
      
      // Make sure socket is connected
      if (socket && isConnected) {
        console.log('[StudentMessaging] Emitting newMessage event via socket for message:', response.data._id);
        
        // Emit message to both the individual room and broadcast
        socket.emit('newMessage', {
          message: response.data,
          conversationId: selectedChat._id,
          recipientId: recipientId
        });
        
        // If sending to admin, use special channel to ensure delivery
        if (isAdminRecipient) {
          console.log('[StudentMessaging] Sending message to admin via admin channel');
          socket.emit('studentMessageToAdmin', {
            message: response.data,
            conversationId: selectedChat._id,
            recipientId: recipientId
          });
        }
        
        // Verify message delivery
        socket.emit('verifyMessageDelivery', {
          messageId: response.data._id,
          recipientId: recipientId
        });
      } else {
        console.error('[StudentMessaging] Socket not connected, attempting to connect');
        // Try to reconnect socket
        if (socket) {
          socket.connect();
          setTimeout(() => {
            if (socket.connected) {
              console.log('[StudentMessaging] Reconnected, now emitting message');
              socket.emit('newMessage', {
                message: response.data,
                conversationId: selectedChat._id,
                recipientId: recipientId
              });
              
              // If sending to admin, use special channel to ensure delivery
              if (isAdminRecipient) {
                socket.emit('studentMessageToAdmin', {
                  message: response.data,
                  conversationId: selectedChat._id,
                  recipientId: recipientId
                });
              }
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('[StudentMessaging] Error sending message:', error);
      
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
      
      console.log('[StudentMessaging] Joined conversation room:', conversation._id);
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

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      console.log('[StudentMessaging] Messages updated, scrolling to bottom');
      setTimeout(() => {
        const messageContainer = document.querySelector('.message-container');
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  // Initial fetch of admins, students and conversations
  useEffect(() => {
    fetchAdmins();
    fetchStudents();
    fetchConversations();
  }, [fetchAdmins, fetchStudents, fetchConversations]);

  // Filter users based on search query
  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(student =>
    student && student.name && student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student && student.dormNumber && student.dormNumber.toString().includes(searchQuery)
  );

  // Combined and filtered list of all users
  const filteredUsers = [
    ...filteredAdmins.map(admin => ({ ...admin, type: 'admin' })),
    ...filteredStudents.map(student => ({ ...student, type: 'student' }))
  ];

  // Near fetchConversations function
  // Poll for conversations periodically to ensure we have the latest data
  useEffect(() => {
    // Initial fetch
    fetchConversations();
    
    // Set up polling for new conversations
    const intervalId = setInterval(() => {
      if (isConnected) {
        console.log('[StudentMessaging] Polling for new conversations');
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
      console.log('[StudentMessaging] Running socket debug...');
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
      <StudentSidebar />
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
          {/* Users List */}
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
                placeholder="Search users..."
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
              {/* Admins Section */}
              {filteredAdmins.length > 0 && (
                <>
                  <ListItem sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <ListItemText 
                      primary="Administrators"
                      primaryTypographyProps={{
                        color: '#6B7280',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    />
                  </ListItem>
                  {filteredAdmins.map((admin) => (
                    <ListItem
                      key={admin._id}
                      button
                      onClick={() => startConversation(admin._id)}
                      sx={{
                        '&:hover': { 
                          backgroundColor: 'rgba(255,255,255,0.03)',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#10B981' }}>
                          {admin.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={admin.name}
                        secondary="Administrator"
                        primaryTypographyProps={{
                          color: '#fff',
                        }}
                        secondaryTypographyProps={{
                          color: '#6B7280',
                        }}
                      />
                    </ListItem>
                  ))}
                </>
              )}

              {/* Students Section */}
              {filteredStudents.length > 0 && (
                <>
                  <ListItem sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <ListItemText 
                      primary="Students"
                      primaryTypographyProps={{
                        color: '#6B7280',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    />
                  </ListItem>
                  {filteredStudents.map((student) => (
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
                        <Avatar sx={{ bgcolor: '#374151' }}>
                          {student.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={student.name}
                        secondary={`Dorm #${student.dormNumber}`}
                        primaryTypographyProps={{
                          color: '#fff',
                        }}
                        secondaryTypographyProps={{
                          color: '#6B7280',
                        }}
                      />
                    </ListItem>
                  ))}
                </>
              )}
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
                    {selectedChat.participants.find(p => p.id !== userData._id)?.name}
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
                        key={msg._id}
                        sx={{
                          alignSelf: msg.sender.id === userData._id ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                        }}
                      >
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: msg.sender.id === userData._id ? '#10B981' : 'rgba(255,255,255,0.03)',
                            color: msg.sender.id === userData._id ? 'white' : '#fff',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body1">{msg.content}</Typography>
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
                              {new Date(msg.createdAt).toLocaleTimeString()}
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

export default StudentMessaging; 