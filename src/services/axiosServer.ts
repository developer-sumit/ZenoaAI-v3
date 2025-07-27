import axios from 'axios';
import Config from 'react-native-config';
import NetInfo from '@react-native-community/netinfo';
import {Platform} from 'react-native';
import appConfig from '@src/config/app.config';
import auth from '@react-native-firebase/auth';

const API_BASE_URL = Config.API_BASE_URL;
console.log('API_BASE_URL from config:', API_BASE_URL);

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/google',
  '/api/auth/verify',
  '/api/auth/refresh',
];

// Helper function to check if a route is public
const isPublicRoute = (url: string): boolean => {
  return PUBLIC_ROUTES.some(route => url.includes(route));
};

// Create axios instance with default config
const axiosServer = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Platform': Platform.OS,
    'X-App-Version': appConfig.version,
  },
});

// Request interceptor
axiosServer.interceptors.request.use(
  async config => {
    // Check network connectivity before making requests
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return Promise.reject(new Error('No internet connection available'));
    }

    // Only add authentication token for protected routes
    if (!isPublicRoute(config.url || '')) {
      const currentUser = auth().currentUser;
      if (currentUser && !config.headers.Authorization) {
        try {
          const idToken = await currentUser.getIdToken(true);
          if (idToken) {
            config.headers.Authorization = `Bearer ${idToken}`;
          }
        } catch (tokenError) {
          console.warn('Failed to get authentication token:', tokenError);
          // For protected routes, we might want to handle this differently
          // but for now, let the server respond with 401 if needed
        }
      }
    }

    // Log outgoing requests in development
    if (__DEV__) {
      // Safely log request data without exposing full tokens
      const sanitizedData = config.data ? {...config.data} : {};
      const sanitizedHeaders = {...config.headers};

      // Sanitize tokens in data
      if (sanitizedData.idToken && typeof sanitizedData.idToken === 'string') {
        sanitizedData.idToken = sanitizedData.idToken.substring(0, 10) + '...';
      }

      // Sanitize Authorization header
      if (
        sanitizedHeaders.Authorization &&
        typeof sanitizedHeaders.Authorization === 'string'
      ) {
        sanitizedHeaders.Authorization =
          sanitizedHeaders.Authorization.substring(0, 15) + '...';
      }

      console.log(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          data:
            Object.keys(sanitizedData).length > 0 ? sanitizedData : undefined,
          headers: sanitizedHeaders,
          isPublic: isPublicRoute(config.url || ''),
        },
      );
    }

    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor for better error handling
axiosServer.interceptors.response.use(
  response => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(`API Response: ${response.config.url}`, {
        status: response.status,
        success: response.data?.success,
        message: response.data?.message,
      });
    }
    return response;
  },
  error => {
    // Enhanced error handling
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid - could trigger re-authentication
      console.warn('Authentication error - token may be expired');
    } else if (error.response?.status === 429) {
      // Rate limiting
      console.warn('Rate limit exceeded');
    } else if (error.response?.status >= 500) {
      // Server errors
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  },
);

// Auth-specific APIs (these will use public routes)
export const authAPI = {
  googleAuth: (idToken: string) => {
    // Validate token format before sending
    if (!idToken || typeof idToken !== 'string' || idToken.length < 50) {
      return Promise.reject(new Error('Invalid ID token format'));
    }

    return axiosServer.post('/api/auth/google', {idToken});
  },

  verifyToken: (token: string) => {
    return axiosServer.post('/api/auth/verify', {token});
  },

  refreshToken: (refreshToken: string) => {
    return axiosServer.post('/api/auth/refresh', {refreshToken});
  },
  logout: () => {
    return axiosServer.post('/api/auth/logout');
  },
};

// User-specific APIs
export const userAPI = {
  getProfile: () => {
    return axiosServer.get('/api/users/profile');
  },

  updateProfile: (profileData: any) => {
    return axiosServer.put('/api/users/profile', profileData);
  },

  deleteAccount: (reason?: string) => {
    return axiosServer.delete('/api/users/profile', {data: {reason}});
  },

  checkQuota: () => {
    return axiosServer.get('/api/users/quota');
  },

  checkEmailAvailability: (email: string) => {
    return axiosServer.post('/api/users/check-email', {email});
  },
};

// Image-specific APIs (these will require authentication)
export const imageAPI = {
  generateImage: (imageData: any) => {
    return axiosServer.post('/api/images/generate', imageData);
  },

  getImages: (params?: any) => {
    return axiosServer.get('/api/images', {params});
  },

  getPublicImages: (params?: any) => {
    return axiosServer.get('/api/images/public', {params});
  },

  getFavoriteImages: (params?: any) => {
    return axiosServer.get('/api/images/favorites', {params});
  },

  getImage: (imageId: string) => {
    return axiosServer.get(`/api/images/${imageId}`);
  },

  deleteImage: (imageId: string) => {
    return axiosServer.delete(`/api/images/${imageId}`);
  },

  toggleFavorite: (imageId: string) => {
    return axiosServer.post(`/api/images/${imageId}/favorite`);
  },

  updatePrivacy: (imageId: string, isPrivate: boolean) => {
    return axiosServer.put(`/api/images/${imageId}/privacy`, {isPrivate});
  },

  flagImage: (imageId: string, reasons: string[]) => {
    return axiosServer.post(`/api/images/${imageId}/flag`, {reasons});
  },
};

export default axiosServer;
