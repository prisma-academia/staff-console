/**
 * Template Studio client.
 *
 * Templates live in two backends — the core api (academic records, finance,
 * account emails) and application-api (admission documents and applicant
 * emails). Both expose the same /doc-studio surface, so the Studio talks to
 * "a service" and never cares which one it is.
 *
 *   core        JWT via apiClient
 *   admissions  admin key + the signed-in staff member's token (X-Staff-Token);
 *               application-api asks the core api whether that staff member
 *               holds the Template Studio permission.
 */
import config from 'src/config';
import { apiClient } from 'src/api';
import { useAuthStore } from 'src/store';

import { getHeaders, getBaseUrl, handleJsonResponse } from './adminApplicationApi';

export const SERVICES = {
  core: { id: 'core', label: 'Academic & finance' },
  admissions: { id: 'admissions', label: 'Admissions' },
};

// ----------------------------------------------------------------------
// Transport
// ----------------------------------------------------------------------

const coreUrl = (path) => {
  const version = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
  return `${config.baseUrl}${version}/doc-studio/${path}`;
};

/**
 * Core api call. JSON goes through apiClient (which refreshes an expired login
 * transparently); blobs and uploads need a raw fetch, so they refresh first.
 */
async function coreFetch(path, { method = 'GET', body, blob = false, headers = {} } = {}) {
  const isUpload = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!blob && !isUpload) {
    const endpoint = `doc-studio/${path}`;
    if (method === 'GET') return apiClient.get(endpoint);
    if (method === 'DELETE') return apiClient.delete(endpoint);
    return apiClient[method.toLowerCase()](endpoint, body);
  }
  await freshStaffToken();
  const { token } = useAuthStore.getState();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(coreUrl(path), {
    method,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isForm ? body : JSON.stringify(body),
  });
  if (blob && response.ok) return response.blob();
  const result = await handleJsonResponse(response);
  return result.data;
}

/**
 * The core api refreshes an expired login on 401 inside apiClient; application-api
 * cannot, so before talking to it make sure the token is fresh (at most once a
 * minute — the check is also the permission pre-flight).
 */
let lastStaffCheck = 0;
async function freshStaffToken() {
  if (Date.now() - lastStaffCheck > 60 * 1000) {
    await apiClient.get('user/can/view_doc_studio');
    lastStaffCheck = Date.now();
  }
  return useAuthStore.getState().token;
}

async function admissionsFetch(path, { method = 'GET', body, blob = false } = {}) {
  const token = await freshStaffToken();
  const base = getBaseUrl().replace(/\/?$/, '/');
  const response = await fetch(`${base}doc-studio/${path}`, {
    method,
    headers: getHeaders({ headers: { 'X-Staff-Token': token } }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (blob && response.ok) return response.blob();
  const result = await handleJsonResponse(response);
  return result.data;
}

const transport = (service) => (service === 'admissions' ? admissionsFetch : coreFetch);

const enc = encodeURIComponent;

// ----------------------------------------------------------------------
// Templates
// ----------------------------------------------------------------------

export const studioApi = (service) => {
  const call = transport(service);
  return {
    engine: () => call('engine'),
    listTypes: () => call('types'),
    getType: (key) => call(`types/${enc(key)}`),
    searchRecords: (key, q) => call(`types/${enc(key)}/records?q=${enc(q || '')}`),
    saveDraft: (key, body) => call(`templates/${enc(key)}/draft`, { method: 'PUT', body }),
    discardDraft: (key, baseRevision) => call(`templates/${enc(key)}/draft?baseRevision=${enc(baseRevision)}`, { method: 'DELETE' }),
    resetToDefault: (key, body) => call(`templates/${enc(key)}/reset`, { method: 'POST', body }),
    publish: (key, body) => call(`templates/${enc(key)}/publish`, { method: 'POST', body }),
    unpublish: (key, body) => call(`templates/${enc(key)}/unpublish`, { method: 'POST', body }),
    versions: (key) => call(`templates/${enc(key)}/versions`),
    version: (key, version) => call(`templates/${enc(key)}/versions/${enc(version)}`),
    restore: (key, version, body) => call(`templates/${enc(key)}/versions/${enc(version)}/restore`, { method: 'POST', body }),
    testSend: (key, body) => call(`templates/${enc(key)}/test-send`, { method: 'POST', body }),
    preview: (body) => call('preview', { method: 'POST', body }),
    previewPdf: (body) => call('preview', { method: 'POST', body: { ...body, format: 'pdf' }, blob: true }),
  };
};

// ----------------------------------------------------------------------
// Brand Kit (owned by the core api; application-api mirrors it)
// ----------------------------------------------------------------------

export const brandApi = {
  get: () => coreFetch('brand-kit'),
  saveDraft: (body) => coreFetch('brand-kit/draft', { method: 'PUT', body }),
  discardDraft: (baseRevision) => coreFetch(`brand-kit/draft?baseRevision=${enc(baseRevision)}`, { method: 'DELETE' }),
  publish: (body) => coreFetch('brand-kit/publish', { method: 'POST', body }),
  versions: () => coreFetch('brand-kit/versions'),
  version: (version) => coreFetch(`brand-kit/versions/${enc(version)}`),
  restore: (version, body) => coreFetch(`brand-kit/versions/${enc(version)}/restore`, { method: 'POST', body }),
  /** A complete brand from an unsaved kit, ready to hand to either service's preview. */
  resolve: (kit) => coreFetch('brand-kit/resolve', { method: 'POST', body: { kit } }),
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return coreFetch('brand-kit/assets', { method: 'POST', body: form });
  },
  /** What application-api is printing with, and where it got it. */
  admissionsStatus: () => admissionsFetch('brand-kit'),
  /** Tells application-api to re-pull the kit right after a publish. */
  refreshAdmissions: () => admissionsFetch('brand-kit/refresh', { method: 'POST', body: {} }),
};
