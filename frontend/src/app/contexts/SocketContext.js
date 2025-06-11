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

    // Initialize socket connection with auth token
    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      path: '/socket.io/',
      withCredentials: true,
      forceNew: true, // Force a new connection
      upgrade: true, // Allow transport upgrade
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

      // For other errors, socket.io will automatically try to reconnect
      console.log('Attempting to reconnect...');
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