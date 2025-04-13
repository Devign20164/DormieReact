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
import { Send as SendIcon, Search as SearchIcon } from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

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

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected || !userData._id) return;

    // Join socket room with user ID
    socket.emit('join', userData._id);

    // Listen for new messages
    socket.on('newMessage', ({ message, conversation: conversationId }) => {
      console.log('New message received:', message);
      
      // Update messages if the conversation is currently selected
      if (selectedChat?._id === conversationId) {
        setMessages(prev => [...prev, message]);
        
        // Mark message as seen immediately if we're in the conversation
        socket.emit('markMessageSeen', {
          messageId: message._id,
          conversationId: conversationId
        });

        // Notify server that we're active in this conversation
        socket.emit('activeInConversation', { conversationId });
      }

      // Update conversations list
      setConversations(prev => prev.map(conv => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: selectedChat?._id === conversationId 
              ? conv.unreadCount 
              : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }));
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

    // Clean up socket listeners
    return () => {
      socket.off('newMessage');
      socket.off('messageDelivered');
      socket.off('messageSeen');
      socket.off('userStatus');
      
      // Notify server that we're inactive in the conversation
      if (selectedChat) {
        socket.emit('inactiveInConversation', { conversationId: selectedChat._id });
      }
    };
  }, [socket, isConnected, selectedChat, userData._id]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      const response = await axios.post('/api/admin/messages', {
        conversationId: selectedChat._id,
        content: message,
      });

      // Add the new message to the messages list
      setMessages(prev => [...prev, response.data]);
      
      // Emit new message event
      socket.emit('newMessage', {
        message: response.data,
        conversationId: selectedChat._id
      });

      // Update the conversation's last message
      setConversations(prev => prev.map(conv => 
        conv._id === selectedChat._id 
          ? { ...conv, lastMessage: response.data }
          : conv
      ));

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  // Handle chat selection with active status
  const handleChatSelect = useCallback((chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
    
    // Notify server that we're active in this conversation
    if (socket && isConnected) {
      socket.emit('activeInConversation', { conversationId: chat._id });
    }
  }, [fetchMessages, socket, isConnected]);

  // Mark messages as seen when viewing conversation
  useEffect(() => {
    if (selectedChat && messages.length > 0 && socket && isConnected) {
      const unreadMessages = messages.filter(
        msg => !msg.isRead && msg.sender.id !== userData._id
      );

      if (unreadMessages.length > 0) {
        // Emit seen event for each unread message
        unreadMessages.forEach(msg => {
          socket.emit('markMessageSeen', {
            messageId: msg._id,
            conversationId: selectedChat._id
          });
        });

        // Update local messages state
        setMessages(prev => prev.map(msg => 
          msg.sender.id !== userData._id ? { ...msg, isRead: true } : msg
        ));
      }
    }
  }, [selectedChat, messages, socket, isConnected, userData._id]);

  // Initial fetch of students and conversations
  useEffect(() => {
    fetchStudents();
    fetchConversations();
  }, [fetchStudents, fetchConversations]);

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.dormNumber.toString().includes(searchQuery)
  );

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
                    {selectedChat.participants.find(p => p.id !== userData._id)?.name}
                  </Typography>
                </Box>

                {/* Messages */}
                <Box sx={{ 
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
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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