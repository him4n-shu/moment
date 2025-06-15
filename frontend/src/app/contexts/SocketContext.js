"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Get the backend URL from environment variable or fallback to localhost
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    // Initialize socket connection with auth token
    const newSocket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      path: '/socket.io/',
      withCredentials: true,
      forceNew: true,
      upgrade: true,
      rejectUnauthorized: false,
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);

      // Handle token-related errors
      if (error.message.includes('Authentication error') || error.message.includes('jwt')) {
        console.log('Authentication error, redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      // Handle timeout specifically
      if (error.message.includes('timeout')) {
        console.log('Connection timeout, checking server availability...');
        // Try to ping the server to check if it's reachable
        fetch(`${backendUrl}/health`)
          .then(response => {
            if (response.ok) {
              console.log('Server is reachable, attempting to reconnect...');
              newSocket.connect();
            } else {
              console.error('Server is not responding properly');
            }
          })
          .catch(() => {
            console.error('Server is not reachable');
          });
        return;
      }

      // For other errors, implement exponential backoff with max retries
      const maxRetries = 5;
      const currentAttempt = newSocket.reconnectAttempts || 0;
      
      if (currentAttempt < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, currentAttempt), 10000);
        console.log(`Attempt ${currentAttempt + 1}/${maxRetries}: Reconnecting in ${retryDelay}ms...`);
        setTimeout(() => {
          newSocket.connect();
        }, retryDelay);
      } else {
        console.error('Max reconnection attempts reached. Please refresh the page.');
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);

      // Handle various disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect manually
        setTimeout(() => {
          console.log('Attempting manual reconnection...');
          newSocket.connect();
        }, 1000);
      }
      if (reason === 'transport close' || reason === 'ping timeout') {
        // Connection lost, will automatically try to reconnect
        console.log('Connection lost, automatic reconnection in progress...');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Provide both socket and connection status
  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
} 