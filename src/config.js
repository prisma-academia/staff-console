/**
 * Configuration object that reads from environment variables with fallback defaults
 * All environment variables must be prefixed with VITE_ to be exposed by Vite
 */

// Helper function to parse comma-separated strings to arrays
const parseArray = (value) => {
  if (!value) return undefined;
  return value.split(',').map((item) => item.trim());
};

// Helper function to parse numbers
const parseNumber = (value) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

// Helper function to parse booleans
const parseBoolean = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
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
  appKeywords: parseArray(import.meta.env.VITE_APP_KEYWORDS),
  appAuthor: import.meta.env.VITE_APP_AUTHOR,

  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  applicationBaseUrl: import.meta.env.VITE_API_APPLICATION_BASE_URL,
  apiVersion: import.meta.env.VITE_API_VERSION,
  apiTimeout: parseNumber(import.meta.env.VITE_API_TIMEOUT),
  
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
      dashboard: import.meta.env.VITE_ASSETS_ICONS_DASHBOARD_PATH,
      notifications: import.meta.env.VITE_ASSETS_ICONS_NOTIFICATIONS_PATH,
      flags: import.meta.env.VITE_ASSETS_ICONS_FLAGS_PATH,
    },
    illustrations: {
      basePath: import.meta.env.VITE_ASSETS_ILLUSTRATIONS_PATH,
      notFound: import.meta.env.VITE_ASSETS_ILLUSTRATION_404_PATH,
    },
    backgrounds: {
      basePath: import.meta.env.VITE_ASSETS_BACKGROUNDS_PATH,
      overlay: import.meta.env.VITE_ASSETS_BACKGROUND_OVERLAY_PATH,
    },
  },
  theme: {
    primaryColor: import.meta.env.VITE_THEME_PRIMARY_COLOR,
    primary: {
      lighter: import.meta.env.VITE_THEME_PRIMARY_LIGHTER || '#F5A3A4',
      light: import.meta.env.VITE_THEME_PRIMARY_LIGHT || '#EB4C4E',
      main: import.meta.env.VITE_THEME_PRIMARY_MAIN || '#AA5037',
      dark: import.meta.env.VITE_THEME_PRIMARY_DARK || '#A10029',
      darker: import.meta.env.VITE_THEME_PRIMARY_DARKER || '#71001C',
      contrastText: import.meta.env.VITE_THEME_PRIMARY_CONTRAST_TEXT || '#FFFFFF',
    },
    secondaryColor: import.meta.env.VITE_THEME_SECONDARY_COLOR,
    secondary: {
      lighter: import.meta.env.VITE_THEME_SECONDARY_LIGHTER || '#4A5F63',
      light: import.meta.env.VITE_THEME_SECONDARY_LIGHT || '#32454A',
      main: import.meta.env.VITE_THEME_SECONDARY_MAIN || '#132C33',
      dark: import.meta.env.VITE_THEME_SECONDARY_DARK || '#0E2127',
      darker: import.meta.env.VITE_THEME_SECONDARY_DARKER || '#08171B',
      contrastText: import.meta.env.VITE_THEME_SECONDARY_CONTRAST_TEXT || '#FFFFFF',
    },
    mode: import.meta.env.VITE_THEME_MODE,
    borderRadius: parseNumber(import.meta.env.VITE_THEME_BORDER_RADIUS),
  },

  // Routing & Navigation
  routes: {
    default: import.meta.env.VITE_DEFAULT_ROUTE,
    login: import.meta.env.VITE_LOGIN_ROUTE,
    notFound: import.meta.env.VITE_404_ROUTE,
  },

  // Server Configuration
  server: {
    devPort: parseNumber(import.meta.env.VITE_DEV_PORT),
    previewPort: parseNumber(import.meta.env.VITE_PREVIEW_PORT),
    host: import.meta.env.VITE_HOST,
  },

  // File Uploads
  upload: {
    baseUrl: import.meta.env.VITE_UPLOAD_BASE_URL,
    maxFileSize: parseNumber(import.meta.env.VITE_MAX_FILE_SIZE), // 5MB default
    allowedFileTypes: parseArray(
      import.meta.env.VITE_ALLOWED_FILE_TYPES
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
    maxSnacks: parseNumber(import.meta.env.VITE_NOTIFICATION_MAX_SNACKS),
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
    mail: parseBoolean(import.meta.env.VITE_FEATURE_MAIL_ENABLED),
    analytics: parseBoolean(import.meta.env.VITE_FEATURE_ANALYTICS_ENABLED),
    export: parseBoolean(import.meta.env.VITE_FEATURE_EXPORT_ENABLED),
  },

  // Development & Debugging
  debug: {
    enabled: parseBoolean(import.meta.env.VITE_DEBUG_MODE),
    logLevel: import.meta.env.VITE_LOG_LEVEL,
  },

  // Navigation
  navigation: {
    roles: parseArray(import.meta.env.VITE_NAV_ROLES),
  },

  // Date & Time
  dateTime: {
    dateFormat: import.meta.env.VITE_DATE_FORMAT,
    timeFormat: import.meta.env.VITE_TIME_FORMAT,
    timezone: import.meta.env.VITE_TIMEZONE,
  },

  // Pagination & Tables
  table: {
    rowsPerPage: parseNumber(import.meta.env.VITE_TABLE_ROWS_PER_PAGE),
    rowsPerPageOptions: parseArray(
      import.meta.env.VITE_TABLE_ROWS_PER_PAGE_OPTIONS
    ).map(Number),
  },
  
  // Utility functions for image handling
  utils: {
    isAbsoluteUrl,
    buildImageUrl,
  },
};

export default config;
