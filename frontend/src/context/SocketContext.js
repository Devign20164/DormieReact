import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

// Get the current domain or use the environment variable
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin  // In production, connect to the same origin
  : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Create a function to join a room
  const joinRoom = (userId) => {
    if (socket && userId) {
      console.log('[SocketProvider] Joining room for user:', userId);
      socket.emit('join', userId);
    }
  };

  // Auto-join room based on user data in localStorage
  useEffect(() => {
    if (socket && isConnected) {
      try {
        // Check if user is logged in
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (userData && userData._id) {
          console.log('[SocketProvider] Auto-joining room for user:', userData._id);
          socket.emit('join', userData._id);
        } else {
          console.log('[SocketProvider] No user data found for auto-join');
        }
      } catch (error) {
        console.error('[SocketProvider] Error auto-joining room:', error);
      }
    }
  }, [socket, isConnected]);

  useEffect(() => {
    console.log('[SocketProvider] Initializing socket connection to:', SOCKET_URL);
    
    // Create socket instance with improved configuration
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true
    });

    console.log('[SocketProvider] Socket instance created');

    socketInstance.on('connect', () => {
      console.log('[SocketProvider] Socket connected successfully with ID:', socketInstance.id);
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[SocketProvider] Socket disconnected, reason:', reason);
      setIsConnected(false);
      
      // Handle disconnection reason
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        console.log('[SocketProvider] Attempting reconnection...');
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[SocketProvider] Socket connection error:', error);
      
      // Increment reconnect attempts
      setReconnectAttempts(prev => prev + 1);
      
      // If we've tried too many times, try alternative transport
      if (reconnectAttempts > 5) {
        console.log('[SocketProvider] Multiple connection errors, trying alternative transport');
        socketInstance.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socketInstance.on('error', (error) => {
      console.error('[SocketProvider] Socket error:', error);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('[SocketProvider] Socket reconnected after', attemptNumber, 'attempts');
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('[SocketProvider] Socket reconnection error:', error);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('[SocketProvider] Socket reconnection failed');
      
      // Last resort - attempt complete reset
      setTimeout(() => {
        console.log('[SocketProvider] Attempting connection reset...');
        socketInstance.disconnect();
        setTimeout(() => socketInstance.connect(), 1000);
      }, 5000);
    });

    setSocket(socketInstance);

    // Cleanup function
    return () => {
      console.log('[SocketProvider] Cleaning up socket connection');
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [reconnectAttempts]);

  const value = {
    socket,
    isConnected,
    joinRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 