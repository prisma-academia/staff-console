/**
 * Admin API client for application-api (application/admission admin endpoints).
 * Uses X-API-Key or Authorization: ApiKey. All requests go to applicationBaseUrl + apiVersion.
 */
import config from '../config';

const getBaseUrl = () => {
  const base = (config.applicationBaseUrl || '').replace(/\/$/, '');
  const version = config.apiVersion?.startsWith('/') ? config.apiVersion : `/${config.apiVersion || 'api/v1'}`;
  return `${base}${version}`;
};

const getHeaders = (options = {}) => {
  const key = config.adminApiKey;
  const headers = {
    'Content-Type': 'application/json',
    ...(key ? { 'X-API-Key': key } : {}),
    ...options.headers,
  };
  if (key && !headers['X-API-Key']) {
    headers.Authorization = `ApiKey ${key}`;
  }
  return headers;
};

const buildUrl = (path, params = {}) => {
  const base = getBaseUrl();
  const pathStr = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(pathStr, base.replace(/\/?$/, '/'));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
};

const handleJsonResponse = async (response) => {
  const text = await response.text();
  let result;
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { ok: false, message: response.statusText || 'Invalid response' };
  }
  if (!response.ok) {
    const err = new Error(result.message || response.statusText || 'Request failed');
    err.status = response.status;
    err.data = result;
    throw err;
  }
  return result;
};

/**
 * GET request; returns full result object { ok, data, message } (caller can use result.data).
 */
export const adminGet = async (path, params = {}) => {
  const url = buildUrl(path, params);
  const response = await fetch(url, { method: 'GET', headers: getHeaders() });
  return handleJsonResponse(response);
};

/**
 * PUT request with JSON body.
 */
export const adminPut = async (path, body = {}) => {
  const base = getBaseUrl();
  const pathStr = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base.replace(/\/?$/, '/')}${pathStr}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleJsonResponse(response);
};

/**
 * POST request with JSON body.
 */
export const adminPost = async (path, body = {}) => {
  const base = getBaseUrl();
  const pathStr = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base.replace(/\/?$/, '/')}${pathStr}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleJsonResponse(response);
};

/**
 * DELETE request. Handles 200 with JSON or 204 no content.
 */
export const adminDelete = async (path) => {
  const base = getBaseUrl();
  const pathStr = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base.replace(/\/?$/, '/')}${pathStr}`;
  const response = await fetch(url, { method: 'DELETE', headers: getHeaders() });
  if (response.status === 204) return { ok: true, message: 'Deleted' };
  return handleJsonResponse(response);
};

/**
 * GET request that returns blob (e.g. CSV). Returns { blob, filename }.
 */
export const adminGetBlob = async (path, params = {}) => {
  const url = buildUrl(path, params);
  const response = await fetch(url, { method: 'GET', headers: getHeaders({ 'Content-Type': undefined }) });
  if (!response.ok) {
    const text = await response.text();
    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: response.statusText };
    }
    const err = new Error(result.message || response.statusText || 'Request failed');
    err.status = response.status;
    err.data = result;
    throw err;
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition');
  const filename = disposition
    ? (disposition.split('filename=')[1] || '').replace(/"/g, '').trim() || 'export.csv'
    : 'export.csv';
  return { blob, filename };
};

// --- Applications ---

export const listApplications = async (params = {}) => {
  const result = await adminGet('application', params);
  return result;
};

export const exportApplicationsCsv = async (params) => adminGetBlob('application/export-csv', params);

export const updateApplication = async (id, body) => {
  const result = await adminPut(`application/${id}`, body);
  return result;
};

export const validateApplicationPayment = async (id) => {
  const result = await adminPost(`application/${id}/validate-payment`, {});
  return result;
};

// --- Admissions ---

export const listAdmissions = async (params = {}) => {
  const result = await adminGet('admission', params);
  return result;
};

export const createAdmission = async (body) => {
  const result = await adminPost('admission', body);
  return result;
};

export const createBatchAdmissions = async (body) => {
  const result = await adminPost('admission/batch', body);
  return result;
};

// --- Sessions (application-api) ---

export const listSessions = async () => {
  const result = await adminGet('sessions');
  return result;
};

export const createSession = async (body) => {
  const result = await adminPost('sessions', body);
  return result;
};

export const updateSession = async (id, body) => {
  const result = await adminPut(`sessions/${id}`, body);
  return result;
};

export const deleteSession = async (id) => {
  const result = await adminDelete(`sessions/${id}`);
  return result;
};

// --- Analytics ---

export const getAnalytics = async (params = {}) => {
  const result = await adminGet('analytics', params);
  return result;
};

// --- Programmes (application-api) ---

export const listProgrammes = async () => {
  const result = await adminGet('programmes');
  return result;
};

export const createProgramme = async (body) => {
  const result = await adminPost('programmes', body);
  return result;
};

export const updateProgramme = async (id, body) => {
  const result = await adminPut(`programmes/${id}`, body);
  return result;
};

export const deleteProgramme = async (id) => {
  const result = await adminDelete(`programmes/${id}`);
  return result;
};

export default {
  listApplications,
  exportApplicationsCsv,
  updateApplication,
  validateApplicationPayment,
  listAdmissions,
  createAdmission,
  createBatchAdmissions,
  listSessions,
  createSession,
  updateSession,
  deleteSession,
  getAnalytics,
  listProgrammes,
  createProgramme,
  updateProgramme,
  deleteProgramme,
};
