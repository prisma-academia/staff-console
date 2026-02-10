// apiClient.js
import config from './config';
import { useAuthStore } from './store';
import { useErrorStore } from './store/error-store';

const baseHeaders = {
  'Content-Type': 'application/json',
};

const handleResponse = async (response) => {
  let result;
  try {
    const text = await response.text();
    result = text ? JSON.parse(text) : {};
  } catch (parseError) {
    // If response is not valid JSON, create a basic error structure
    result = {
      ok: false,
      message: response.statusText || 'An error occurred',
    };
  }

  if (response.ok && result.ok) {
    return result.data;
  }
  
  // Create a structured error object
  const errorMessage = result.message || result.error || response.statusText || 'An error occurred';
  const error = new Error(errorMessage);
  error.status = response.status;
  error.data = result;
  
  // Show error modal for critical errors
  const { showError, showPermissionError } = useErrorStore.getState();
  
  // 403 Forbidden - Permission denied
  if (response.status === 403) {
    showPermissionError({
      title: 'Access Denied',
      message: errorMessage,
      details: result,
    });
  }
  // 500+ Server errors - Critical errors
  else if (response.status >= 500) {
    showError({
      title: 'Server Error',
      message: errorMessage,
      details: result,
    });
  }
  // 401 is handled separately in createRequest for token refresh
  // Other errors (400, 404, etc.) will be thrown and can be handled by components
  
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

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...baseHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (networkError) {
    // Network error - show error modal with retry option
    const { showError } = useErrorStore.getState();
    showError({
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      details: networkError.message,
      retry: () => createRequest(endpoint, options, retry),
    });
    throw networkError;
  }

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
        
        // If refresh fails, show error modal and log out
        const { showError } = useErrorStore.getState();
        showError({
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
          onClose: () => {
            logOut();
          },
        });
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
  changePassword: (data) => apiClient.post('user/reset-password', data),
  checkPermission: (action) => apiClient.post('user/check-permission', { action }),
};

export const programApi = {
  getPrograms: () => apiClient.get('program'),
  getProgramById: (id) => apiClient.get(`program/${id}`),
  createProgram: (data) => apiClient.post('program', data),
  updateProgram: (id, data) => apiClient.put(`program/${id}`, data),
  deleteProgram: (id) => apiClient.delete(`program/${id}`),
};

export const classLevelApi = {
  getClassLevels: () => apiClient.get('classlevel'),
  getClassLevelById: (id) => apiClient.get(`classlevel/${id}`),
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

export const SettingsApi = {
  getSettings: () => apiClient.get('settings'),
  updateSettings: (data) => apiClient.put('settings', data),
  resetSettings: () => apiClient.post('settings/reset'),
};

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (value instanceof Date) {
        searchParams.append(key, value.toISOString());
      } else {
        searchParams.append(key, value);
      }
    }
  });
  return searchParams.toString();
};

export const AuditApi = {
  getStats: (params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(`audit/stats${queryString ? `?${queryString}` : ''}`);
  },
  getAuditLogs: (params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(`audit${queryString ? `?${queryString}` : ''}`);
  },
  getAuditLogById: (id) => apiClient.get(`audit/${id}`),
  getAuditLogsByEntity: (entityType, entityId, params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(`audit/entity/${entityType}/${entityId}${queryString ? `?${queryString}` : ''}`);
  },
  getAuditLogsByActor: (actorId, params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(`audit/actor/${actorId}${queryString ? `?${queryString}` : ''}`);
  },
  createAuditLog: (data) => apiClient.post('audit', data),
  deleteAuditLog: (id) => apiClient.delete(`audit/${id}`),
};

// export const AdmissionApi = {
//   getAdmissions: () => apiClient.get('admission'),
// };

export const StudentApi = {
  getStudents: (params) => {
    let queryString = '';
    if (params) {
      if (typeof params === 'string') {
        queryString = params;
      } else if (typeof params === 'object') {
        // Filter out React Query internal parameters
        const filteredParams = {};
        Object.entries(params).forEach(([key, value]) => {
          // Only include actual query parameters, not React Query internals
          if (!['client', 'queryKey', 'signal', 'meta', 'pageParam'].includes(key)) {
            filteredParams[key] = value;
          }
        });
        if (Object.keys(filteredParams).length > 0) {
          queryString = buildQueryString(filteredParams);
        }
      }
    }
    return apiClient.get(`student${queryString ? `?${queryString}` : ''}`);
  },
  getStudentById: (id) => apiClient.get(`student/${id}`),
  adminEditStudent: (id, data) => apiClient.put(`student/admin/edit/${id}`, data),
  adminDisableStudent: (id) => apiClient.put(`student/admin/disable/${id}`),
  adminResetPassword: (id, data) => apiClient.post(`student/admin/reset-password/${id}`, data),
  generateRegNumber: (programId) => apiClient.get(`student/reg-number/${programId}`),
  // Bulk upload methods
  downloadBulkUploadTemplate: async (format = 'xlsx') => {
    const { token } = useAuthStore.getState();
    const apiVersion = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
    const url = `${config.baseUrl}${apiVersion}/student/bulk-upload/template?format=${format}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to download template';
      try {
        const errorText = await response.text();
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
        
        // Handle permission errors
        if (response.status === 403) {
          const { showPermissionError } = useErrorStore.getState();
          showPermissionError({
            title: 'Access Denied',
            message: errorMessage,
            details: errorJson,
          });
        } else if (response.status >= 500) {
          const { showError } = useErrorStore.getState();
          showError({
            title: 'Server Error',
            message: errorMessage,
            details: errorJson,
          });
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    // Return blob for download handling
    return response.blob();
  },
  validateBulkUpload: async (file) => {
    const { token } = useAuthStore.getState();
    const apiVersion = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
    const url = `${config.baseUrl}${apiVersion}/student/bulk-upload/validate`;
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    // On 400 with validation details (students/errors/summary), return data so UI can show errors
    if (response.status === 400 && result.data && typeof result.data.summary === 'object') {
      return result.data;
    }

    if (!response.ok || !result.ok) {
      const errorMessage = result.message || result.error || 'Failed to validate file';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = result;
      
      // Handle specific error cases
      if (response.status === 403) {
        const { showPermissionError } = useErrorStore.getState();
        showPermissionError({
          title: 'Access Denied',
          message: errorMessage,
          details: result,
        });
      } else if (response.status >= 500) {
        const { showError } = useErrorStore.getState();
        showError({
          title: 'Server Error',
          message: errorMessage,
          details: result,
        });
      }
      
      throw error;
    }

    return result.data;
  },
  bulkInsertStudents: async (data) => {
    const { token } = useAuthStore.getState();
    const apiVersion = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
    const url = `${config.baseUrl}${apiVersion}/student/bulk-insert`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      const errorMessage = result.message || result.error || 'Bulk insert failed';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = result;
      if (response.status === 403) {
        const { showPermissionError } = useErrorStore.getState();
        showPermissionError({
          title: 'Access Denied',
          message: errorMessage,
          details: result,
        });
      } else if (response.status >= 500) {
        const { showError } = useErrorStore.getState();
        showError({
          title: 'Server Error',
          message: errorMessage,
          details: result,
        });
      }
      throw error;
    }

    return result;
  },
};

export const TemplateApi = {
  getTemplates: (params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(`template${queryString ? `?${queryString}` : ''}`);
  },
  getTemplateById: (id) => apiClient.get(`template/${id}`),
  createTemplate: (data) => apiClient.post('template', data),
  updateTemplate: (id, data) => apiClient.put(`template/${id}`, data),
  deleteTemplate: (id) => apiClient.delete(`template/${id}`),
};

export const AssessmentApi = {
  getAssessments: (params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(`assessment${queryString ? `?${queryString}` : ''}`);
  },
  getAssessmentById: (id) => apiClient.get(`assessment/${id}`),
  createAssessment: (data) => apiClient.post('assessment', data),
  updateAssessment: (id, data) => apiClient.put(`assessment/${id}`, data),
  deleteAssessment: (id) => apiClient.delete(`assessment/${id}`),
};

export const ScoreApi = {
  getScores: (params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(`score${queryString ? `?${queryString}` : ''}`);
  },
  getScoreById: (id) => apiClient.get(`score/${id}`),
  getScoresByAssessment: (assessmentId) => apiClient.get(`score/assessment/${assessmentId}`),
  getScoresBySession: (sessionId) => apiClient.get(`score/session/${sessionId}`),
  getScoresByStudent: (studentId) => apiClient.get(`score/student/${studentId}`),
  createScore: (data) => apiClient.post('score', data),
  updateScore: (id, data) => apiClient.put(`score/${id}`, data),
  deleteScore: (id) => apiClient.delete(`score/${id}`),
};

export const SessionApi = {
  getSessions: () => apiClient.get('session'),
  getSessionById: (id) => apiClient.get(`session/${id}`),
};

// Blob fetch helper for result file downloads (export, template, student PDF)
const resultBlobFetch = async (path, searchParams = {}) => {
  const { token } = useAuthStore.getState();
  const apiVersion = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
  const query = new URLSearchParams(searchParams).toString();
  const url = `${config.baseUrl}${apiVersion}/result/${path}${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorMessage;
      if (response.status === 403) {
        useErrorStore.getState().showPermissionError({
          title: 'Access Denied',
          message: errorMessage,
          details: errorJson,
        });
      } else if (response.status >= 500) {
        useErrorStore.getState().showError({
          title: 'Server Error',
          message: errorMessage,
          details: errorJson,
        });
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    const err = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }
  return response.blob();
};

export const ResultApi = {
  getAll: (params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(`result${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiClient.get(`result/${id}`),
  create: (data) => apiClient.post('result', data),
  update: (id, data) => apiClient.put(`result/${id}`, data),
  delete: (id) => apiClient.delete(`result/${id}`),
  getBuilder: (params) => {
    const queryString = buildQueryString(params);
    return apiClient.get(`result/builder${queryString ? `?${queryString}` : ''}`);
  },
  bulkSave: (body) => apiClient.post('result/bulk-save', body),
  bulkUpdate: (body) => apiClient.put('result/bulk', body),
  bulkDelete: (body) =>
    createRequest('result/bulk', {
      method: 'DELETE',
      body: JSON.stringify(body),
    }),
  exportResults: async (params) => resultBlobFetch('export', params),
  downloadTemplate: async (courseId) => resultBlobFetch('template', { courseId }),
  getByStudentId: (studentId) => apiClient.get(`result/student/${studentId}`),
  getByStudentSemester: (studentId, semester) =>
    apiClient.get(`result/student/${studentId}/semester/${encodeURIComponent(semester)}`),
  getStudentGpa: (studentId, params) => {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(
      `result/student/${studentId}/gpa${queryString ? `?${queryString}` : ''}`
    );
  },
  downloadStudentResultPdf: async (studentId, classLevelId, semester) => {
    const path = `student/${studentId}/classLevel/${classLevelId}/semester/${encodeURIComponent(semester)}`;
    return resultBlobFetch(path);
  },
};