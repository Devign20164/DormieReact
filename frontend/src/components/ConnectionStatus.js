import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const ConnectionStatus = () => {
  const { socket, isConnected } = useSocket();
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (socket) {
      // Listen for messages from the server
      socket.on('message', (msg) => {
        setReceivedMessages((prev) => [...prev, { id: Date.now(), text: msg }]);
      });

      // Listen for user count updates
      socket.on('userCount', (count) => {
        setUserCount(count);
      });

      // Cleanup listeners when component unmounts
      return () => {
        socket.off('message');
        socket.off('userCount');
      };
    }
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (socket && message.trim()) {
      socket.emit('message', message.trim());
      setMessage('');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '5px'
      }}>
        <div>
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <div>
          Online Users: {userCount}
        </div>
      </div>

      <form onSubmit={sendMessage} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            style={{ 
              flex: 1,
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
          <button 
            type="submit" 
            disabled={!isConnected || !message.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: isConnected ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            Send
          </button>
        </div>
      </form>

      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
        padding: '15px'
      }}>
        <h3>Messages:</h3>
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '10px'
        }}>
          {receivedMessages.map(({ id, text }) => (
            <div
              key={id}
              style={{
                padding: '8px',
                margin: '5px 0',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                wordBreak: 'break-word'
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus; 