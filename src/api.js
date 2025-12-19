// apiClient.js
import config from './config';
import { useAuthStore } from './store';

const baseHeaders = {
  'Content-Type': 'application/json',
};

const handleResponse = async (response) => {
  const result = await response.json();
  if (response.ok && result.ok) {
    return result.data;
  }
  
  // Create a structured error object
  const error = new Error(result.message || 'An error occurred');
  error.status = response.status;
  error.data = result;
  throw error;
};

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.map((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

const createRequest = async (endpoint, options = {}, retry = true) => {
  const { token, refreshToken, user, setToken, logOut } = useAuthStore.getState();
  
  // Remove leading slash from apiVersion if present, and ensure endpoint doesn't have leading slash
  const apiVersion = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${config.baseUrl}${apiVersion}/${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && retry && refreshToken && user) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${config.baseUrl}${apiVersion}/user/refresh-token`, {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify({
            email: user.email,
            refreshToken,
          }),
        });

        const refreshResult = await refreshResponse.json();

        if (refreshResult.ok) {
          const newToken = refreshResult.data.token;
          setToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);
          
          // Retry the original request with the new token
          return createRequest(endpoint, options, false);
        }
        
        // If refresh fails, log out
        logOut();
        throw new Error('Session expired. Please log in again.');
      } catch (error) {
        isRefreshing = false;
        logOut();
        throw error;
      }
    } else {
      // Wait for the token to be refreshed
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          resolve(createRequest(endpoint, options, false));
        });
      });
    }
  }

  return handleResponse(response);
};

export const apiClient = {
  get: (endpoint) => createRequest(endpoint),

  post: (endpoint, data) =>
    createRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: (endpoint, data) =>
    createRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: (endpoint, data) =>
    createRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (endpoint) =>
    createRequest(endpoint, {
      method: 'DELETE',
    }),
};

// API function exports
export const UserApi = {
  login: (data) => apiClient.post('user/login', data),
  register: (data) => apiClient.post('user/register', data),
  getUsers: (params = '') => apiClient.get(`user${params ? `?${params}` : ''}`),
  getUserById: (id) => apiClient.get(`user/${id}`),
  updateUser: (id, data) => apiClient.put(`user/${id}`, data),
  deleteUser: (id) => apiClient.delete(`user/${id}`),
  adminResetPassword: (userId, data) => apiClient.post(`user/admin/reset-password/${userId}`, data),
  forgotPassword: (data) => apiClient.post('user/forgot-password', data),
  checkPermission: (action) => apiClient.post('user/check-permission', { action }),
};

export const programApi = {
  getPrograms: () => apiClient.get('program'),
  createProgram: (data) => apiClient.post('program', data),
  updateProgram: (id, data) => apiClient.put(`program/${id}`, data),
  deleteProgram: (id) => apiClient.delete(`program/${id}`),
};

export const classLevelApi = {
  getClassLevels: () => apiClient.get('classlevel'),
  createClassLevel: (data) => apiClient.post('classlevel', data),
  updateClassLevel: (id, data) => apiClient.put(`classlevel/${id}`, data),
  deleteClassLevel: (id) => apiClient.delete(`classlevel/${id}`),
};

export const courseApi = {
  getCourses: () => apiClient.get('course'),
  createCourse: (data) => apiClient.post('course', data),
  updateCourse: (id, data) => apiClient.put(`course/${id}`, data),
  deleteCourse: (id) => apiClient.delete(`course/${id}`),
};

export const FeeApi = {
  getFees: () => apiClient.get('fee'),
  getFeeById: (id) => apiClient.get(`fee/${id}`),
  createFee: (data) => apiClient.post('fee', data),
  updateFee: (id, data) => apiClient.put(`fee/${id}`, data),
  deleteFee: (id) => apiClient.delete(`fee/${id}`),
};

export const InstructorApi = {
  getInstructors: () => apiClient.get('instructor/instructors'),
  createInstructor: (data) => apiClient.post('instructor/instructors', data),
  updateInstructor: (id, data) => apiClient.put(`instructor/instructors/${id}`, data),
  deleteInstructor: (id) => apiClient.delete(`instructor/instructors/${id}`),
};


export const EventApi = {
  getEvents: () => apiClient.get('event'),
  createEvent: (data) => apiClient.post('event', data),
  updateEvent: (id, data) => apiClient.put(`event/${id}`, data),
  deleteEvent: (id) => apiClient.delete(`event/${id}`),
};

export const MemoApi = {
  getMemos: () => apiClient.get('memo'),
  createMemo: (data) => apiClient.post('memo', data),
  updateMemo: (id, data) => apiClient.put(`memo/${id}`, data),
  deleteMemo: (id) => apiClient.delete(`memo/${id}`),
};

export const AnalyticsApi = {
  getAnalytics: () => apiClient.get('analytics'),
};

export const paymentApi = {
  getPayments: (userId, feeId, regNumber) => {
    const params = new URLSearchParams();
    if (userId) params.append('user', userId);
    if (feeId) params.append('fee', feeId);
    if (regNumber) params.append('regNumber', regNumber);
    const queryString = params.toString();
    return apiClient.get(`payment${queryString ? `?${queryString}` : ''}`);
  },
  verifyPayment: (paymentId, reference) => {
    const body = {};
    if (paymentId) body.paymentId = paymentId;
    if (reference) body.reference = reference;
    return apiClient.post('payment/verify', body);
  },
  updatePayment: (id, data) => apiClient.put(`payment/${id}`, data),
};

export const userGroupApi = {
  getGroups: () => apiClient.get('usergroup'),
  getGroupById: (id) => apiClient.get(`usergroup/${id}`),
  createGroup: (data) => apiClient.post('usergroup', data),
  updateGroup: (id, data) => apiClient.put(`usergroup/${id}`, data),
  deleteGroup: (id) => apiClient.delete(`usergroup/${id}`),
  addMembers: (id, userIds) => apiClient.post(`usergroup/${id}/users`, { userIds }),
  removeMembers: (id, userIds) =>
    createRequest(`usergroup/${id}/users`, {
      method: 'DELETE',
      body: JSON.stringify({ userIds }),
    }),
};

export const RolePermissionApi = {
  getRolePermissions: () => apiClient.get('role-permission'),
  getRolePermissionById: (id) => apiClient.get(`role-permission/${id}`),
  getRolePermissionByRole: (role) => apiClient.get(`role-permission/role/${role}`),
  createRolePermission: (data) => apiClient.post('role-permission', data),
  updateRolePermission: (id, data) => apiClient.put(`role-permission/${id}`, data),
  deleteRolePermission: (id) => apiClient.delete(`role-permission/${id}`),
};

// export const AdmissionApi = {
//   getAdmissions: () => apiClient.get('admission'),
// };
