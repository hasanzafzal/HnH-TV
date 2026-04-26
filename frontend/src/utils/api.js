import axios from 'axios';

// Dynamically determine the API base URL to allow cross-device testing on local networks
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (API_URL.includes('localhost') && window.location.hostname !== 'localhost') {
  API_URL = `http://${window.location.hostname}:5000/api`;
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
