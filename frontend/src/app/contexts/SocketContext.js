"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // Clean up function for previous socket
    const cleanupSocket = (oldSocket) => {
      if (oldSocket) {
        console.log('Cleaning up old socket connection');
        oldSocket.removeAllListeners();
        oldSocket.disconnect();
      }
    };

    // Function to initialize socket
    const initializeSocket = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping socket connection');
        return null;
      }

      // Get the backend URL from environment variable or fallback to localhost
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      console.log('Initializing socket connection to:', backendUrl);

      // Initialize socket connection with improved configuration
      const newSocket = io(backendUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        pingTimeout: 60000,
        pingInterval: 25000,
        autoConnect: true,
        path: '/socket.io/',
        withCredentials: true,
        forceNew: true
      });

      return newSocket;
    };

    // Create socket connection
    const newSocket = initializeSocket();
    if (!newSocket) return;

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected successfully with ID:', newSocket.id);
      setIsConnected(true);
      setReconnectAttempts(0);
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

      // Update reconnect attempts
      setReconnectAttempts(prev => prev + 1);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);

      // Handle various disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect manually
        setTimeout(() => {
          console.log('Attempting manual reconnection after server disconnect...');
          newSocket.connect();
        }, 1000);
      }
      
      if (reason === 'transport close') {
        console.log('Transport closed, attempting to reconnect...');
        setTimeout(() => {
          newSocket.connect();
        }, 1000);
      }
      
      if (reason === 'ping timeout') {
        console.log('Ping timeout, attempting to reconnect with new connection...');
        cleanupSocket(newSocket);
        const freshSocket = initializeSocket();
        if (freshSocket) {
          setSocket(freshSocket);
        }
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setReconnectAttempts(prev => prev + 1);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');
      setIsConnected(false);
      
      // Try a complete reset of the socket connection
      cleanupSocket(newSocket);
      setTimeout(() => {
        const freshSocket = initializeSocket();
        if (freshSocket) {
          setSocket(freshSocket);
        }
      }, 5000);
    });

    // Add ping/pong monitoring
    newSocket.io.on("ping", () => {
      console.log("Socket ping sent");
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => cleanupSocket(newSocket);
  }, []); // Empty dependency array means this runs once on mount

  // Provide socket, connection status and reconnect method
  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected,
      reconnectAttempts,
      reconnect: () => {
        if (socket) {
          console.log('Manual reconnection requested');
          socket.disconnect();
          socket.connect();
        }
      }
    }}>
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