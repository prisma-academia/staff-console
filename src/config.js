/**
 * Configuration object that reads from environment variables with fallback defaults
 * All environment variables must be prefixed with VITE_ to be exposed by Vite
 */

// Helper function to parse comma-separated strings to arrays
const parseArray = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  return value.split(',').map((item) => item.trim());
};

// Helper function to parse numbers
const parseNumber = (value, defaultValue = 0) => {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to parse booleans
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return value.toLowerCase() === 'true';
};

// Helper function to check if a URL is absolute (remote)
const isAbsoluteUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

// Helper function to build image URL - handles both absolute (remote) and relative paths
const buildImageUrl = (basePath, filename) => {
  if (!basePath || !filename) return filename || basePath || '';
  
  // If filename is already an absolute URL, return it as-is
  if (isAbsoluteUrl(filename)) return filename;
  
  // If basePath is absolute, concatenate properly
  if (isAbsoluteUrl(basePath)) {
    const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const file = filename.startsWith('/') ? filename : `/${filename}`;
    return `${base}${file}`;
  }
  
  // Both are relative paths
  const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const file = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${base}/${file}`;
};

const config = {
  // Application Information
  appName: import.meta.env.VITE_APP_NAME,
  appShortName: import.meta.env.VITE_APP_SHORT_NAME,
  appDescription: import.meta.env.VITE_APP_DESCRIPTION,
  appKeywords: parseArray(import.meta.env.VITE_APP_KEYWORDS, ['management', 'admin', 'console']),
  appAuthor: import.meta.env.VITE_APP_AUTHOR,

  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  applicationBaseUrl: import.meta.env.VITE_API_APPLICATION_BASE_URL,
  apiVersion: import.meta.env.VITE_API_VERSION || '/api/v1',
  apiTimeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 30000),
  
  // Legacy support - maintain backward compatibility
  baseUrl: import.meta.env.VITE_API_BASE_URL,

  // Authentication & Storage
  storagePrefix: import.meta.env.VITE_STORAGE_PREFIX,
  tokenKey: import.meta.env.VITE_TOKEN_KEY,
  refreshTokenKey: import.meta.env.VITE_REFRESH_TOKEN_KEY,

  // Branding & Appearance
  logoPath: import.meta.env.VITE_APP_LOGO_PATH,
  faviconPath: import.meta.env.VITE_FAVICON_PATH,
  assets: {
    basePath: import.meta.env.VITE_ASSETS_BASE_PATH,
    icons: {
      navbar: import.meta.env.VITE_ASSETS_ICONS_NAVBAR_PATH,
      dashboard: import.meta.env.VITE_ASSETS_ICONS_DASHBOARD_PATH || '/assets/icons/dashboard',
      notifications: import.meta.env.VITE_ASSETS_ICONS_NOTIFICATIONS_PATH || '/assets/icons',
      flags: import.meta.env.VITE_ASSETS_ICONS_FLAGS_PATH || '/assets/icons',
    },
    illustrations: {
      basePath: import.meta.env.VITE_ASSETS_ILLUSTRATIONS_PATH || '/assets/illustrations',
      notFound: import.meta.env.VITE_ASSETS_ILLUSTRATION_404_PATH || '/assets/illustrations/illustration_404.svg',
    },
    backgrounds: {
      basePath: import.meta.env.VITE_ASSETS_BACKGROUNDS_PATH || '/assets/background',
      overlay: import.meta.env.VITE_ASSETS_BACKGROUND_OVERLAY_PATH || '/assets/background/overlay_4.jpg',
    },
  },
  theme: {
    primaryColor: import.meta.env.VITE_THEME_PRIMARY_COLOR,
    secondaryColor: import.meta.env.VITE_THEME_SECONDARY_COLOR,
    mode: import.meta.env.VITE_THEME_MODE,
    borderRadius: parseNumber(import.meta.env.VITE_THEME_BORDER_RADIUS, 8),
  },

  // Routing & Navigation
  routes: {
    default: import.meta.env.VITE_DEFAULT_ROUTE,
    login: import.meta.env.VITE_LOGIN_ROUTE,
    notFound: import.meta.env.VITE_404_ROUTE,
  },

  // Server Configuration
  server: {
    devPort: parseNumber(import.meta.env.VITE_DEV_PORT, 3030),
    previewPort: parseNumber(import.meta.env.VITE_PREVIEW_PORT, 3030),
    host: import.meta.env.VITE_HOST,
  },

  // File Uploads
  upload: {
    baseUrl: import.meta.env.VITE_UPLOAD_BASE_URL,
    maxFileSize: parseNumber(import.meta.env.VITE_MAX_FILE_SIZE, 5242880), // 5MB default
    allowedFileTypes: parseArray(
      import.meta.env.VITE_ALLOWED_FILE_TYPES,
      ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
    ),
  },

  // PWA Configuration
  pwa: {
    themeColor: import.meta.env.VITE_PWA_THEME_COLOR,
    backgroundColor: import.meta.env.VITE_PWA_BACKGROUND_COLOR,
    display: import.meta.env.VITE_PWA_DISPLAY,
  },

  // Notification & UI
  notifications: {
    maxSnacks: parseNumber(import.meta.env.VITE_NOTIFICATION_MAX_SNACKS, 1),
    position: import.meta.env.VITE_NOTIFICATION_POSITION,
    getAnchorOrigin() {
      const pos = this.position.toLowerCase();
      let horizontal = 'center';
      if (pos.includes('left')) {
        horizontal = 'left';
      } else if (pos.includes('right')) {
        horizontal = 'right';
      }
      return {
        horizontal,
        vertical: pos.includes('top') ? 'top' : 'bottom',
      };
    },
  },

  // Email Configuration
  email: {
    defaultFrom: import.meta.env.VITE_DEFAULT_FROM_EMAIL,
  },

  // Feature Flags
  features: {
    mail: parseBoolean(import.meta.env.VITE_FEATURE_MAIL_ENABLED, true),
    analytics: parseBoolean(import.meta.env.VITE_FEATURE_ANALYTICS_ENABLED, true),
    export: parseBoolean(import.meta.env.VITE_FEATURE_EXPORT_ENABLED, true),
  },

  // Development & Debugging
  debug: {
    enabled: parseBoolean(import.meta.env.VITE_DEBUG_MODE, false),
    logLevel: import.meta.env.VITE_LOG_LEVEL,
  },

  // Navigation
  navigation: {
    roles: parseArray(import.meta.env.VITE_NAV_ROLES, ['admin', 'staff', 'staffAdmin']),
  },

  // Date & Time
  dateTime: {
    dateFormat: import.meta.env.VITE_DATE_FORMAT,
    timeFormat: import.meta.env.VITE_TIME_FORMAT,
    timezone: import.meta.env.VITE_TIMEZONE,
  },

  // Pagination & Tables
  table: {
    rowsPerPage: parseNumber(import.meta.env.VITE_TABLE_ROWS_PER_PAGE, 10),
    rowsPerPageOptions: parseArray(
      import.meta.env.VITE_TABLE_ROWS_PER_PAGE_OPTIONS,
      ['5', '10', '25', '50', '100']
    ).map(Number),
  },
  
  // Utility functions for image handling
  utils: {
    isAbsoluteUrl,
    buildImageUrl,
  },
};

export default config;
