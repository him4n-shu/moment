// API configuration utility

// Get the backend URL from environment variable or fallback to localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Make sure endpoint starts with a slash if not already
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${formattedEndpoint}`;
}; 