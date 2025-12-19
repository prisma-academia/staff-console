# Configuration Guide

This document outlines all configurable options for making this application generic and customizable via environment variables.

## Overview

All configuration values can be set using environment variables in a `.env` file. The application will use sensible defaults if values are not provided.

### Important Note About Image URLs

**All image and asset paths support full remote URLs** (e.g., `https://cdn.example.com/images/logo.png`). The application automatically detects absolute URLs (starting with `http://` or `https://`) and uses them as-is. For relative paths, the base paths configured in environment variables will be used. User-uploaded images (pictures, documents) from the API can be either full remote URLs or relative paths - the application handles both cases automatically using helper functions in the configuration.

## Important Note About Image URLs

**All image and asset paths support full remote URLs** (e.g., `https://cdn.example.com/images/logo.png`). The application automatically detects absolute URLs and uses them as-is. For relative paths, the base paths configured in environment variables will be used. User-uploaded images (pictures, documents) from the API can be either full remote URLs or relative paths - the application handles both cases automatically.

## Environment Variables

### Application Information

#### `VITE_APP_NAME`
- **Description**: Application name displayed in the browser title and throughout the UI
- **Default**: `Generic Staff Console`
- **Example**: `VITE_APP_NAME=My School Admin Portal`

#### `VITE_APP_SHORT_NAME`
- **Description**: Short version of the app name (used in PWA manifest)
- **Default**: `Staff Console`
- **Example**: `VITE_APP_SHORT_NAME=Admin`

#### `VITE_APP_DESCRIPTION`
- **Description**: Application description for meta tags
- **Default**: `Staff Management Console`
- **Example**: `VITE_APP_DESCRIPTION=School Management System`

#### `VITE_APP_KEYWORDS`
- **Description**: SEO keywords for meta tags (comma-separated)
- **Default**: `management,admin,console`
- **Example**: `VITE_APP_KEYWORDS=school,education,management,admin`

#### `VITE_APP_AUTHOR`
- **Description**: Application author/developer information
- **Default**: ``
- **Example**: `VITE_APP_AUTHOR=Your Name (your.email@example.com)`

### API Configuration

#### `VITE_API_BASE_URL`
- **Description**: Base URL for the main API endpoint
- **Default**: `http://localhost:3000`
- **Example**: `VITE_API_BASE_URL=https://api.yourschool.edu`

#### `VITE_API_APPLICATION_BASE_URL`
- **Description**: Base URL for the application/admission API (if separate from main API)
- **Default**: `http://localhost:3001`
- **Example**: `VITE_API_APPLICATION_BASE_URL=https://api.application.yourschool.edu`

#### `VITE_API_VERSION`
- **Description**: API version prefix (e.g., `/api/v1`)
- **Default**: `/api/v1`
- **Example**: `VITE_API_VERSION=/api/v2`

#### `VITE_API_TIMEOUT`
- **Description**: Request timeout in milliseconds
- **Default**: `30000`
- **Example**: `VITE_API_TIMEOUT=60000`

### Authentication & Storage

#### `VITE_STORAGE_PREFIX`
- **Description**: Prefix for localStorage keys (used for auth persistence)
- **Default**: `staff-console`
- **Example**: `VITE_STORAGE_PREFIX=my-school-console`

#### `VITE_TOKEN_KEY`
- **Description**: localStorage key for storing authentication token
- **Default**: `token`
- **Example**: `VITE_TOKEN_KEY=auth_token`

#### `VITE_REFRESH_TOKEN_KEY`
- **Description**: localStorage key for storing refresh token
- **Default**: `refreshToken`
- **Example**: `VITE_REFRESH_TOKEN_KEY=refresh_token`

### Branding & Appearance

#### `VITE_APP_LOGO_PATH`
- **Description**: Full remote URL or relative path to the application logo
- **Default**: `/assets/logo.jpg`
- **Example (Remote)**: `VITE_APP_LOGO_PATH=https://cdn.example.com/images/logo.png`
- **Example (Relative)**: `VITE_APP_LOGO_PATH=/images/my-logo.png`

#### `VITE_FAVICON_PATH`
- **Description**: Full remote URL or relative path to favicon
- **Default**: `/favicon/favicon.ico`
- **Example (Remote)**: `VITE_FAVICON_PATH=https://cdn.example.com/favicon.ico`
- **Example (Relative)**: `VITE_FAVICON_PATH=/favicon.ico`

#### `VITE_THEME_PRIMARY_COLOR`
- **Description**: Primary theme color (hex code)
- **Default**: `#DA0037`
- **Example**: `VITE_THEME_PRIMARY_COLOR=#1976D2`

#### `VITE_THEME_SECONDARY_COLOR`
- **Description**: Secondary theme color (hex code)
- **Default**: `#132C33`
- **Example**: `VITE_THEME_SECONDARY_COLOR=#424242`

#### `VITE_THEME_MODE`
- **Description**: Theme mode (`light` or `dark`)
- **Default**: `light`
- **Example**: `VITE_THEME_MODE=dark`

#### `VITE_THEME_BORDER_RADIUS`
- **Description**: Border radius for UI elements (in pixels)
- **Default**: `8`
- **Example**: `VITE_THEME_BORDER_RADIUS=12`

#### `VITE_ASSETS_BASE_PATH`
- **Description**: Base path for static assets
- **Default**: `/assets`
- **Example**: `VITE_ASSETS_BASE_PATH=/static`

#### `VITE_ASSETS_ICONS_NAVBAR_PATH`
- **Description**: Full remote URL or base path to navigation bar icons. Filenames will be appended automatically.
- **Default**: `/assets/icons/navbar`
- **Example (Remote)**: `VITE_ASSETS_ICONS_NAVBAR_PATH=https://cdn.example.com/icons/navbar`
- **Example (Relative)**: `VITE_ASSETS_ICONS_NAVBAR_PATH=/icons/navbar`

#### `VITE_ASSETS_ICONS_DASHBOARD_PATH`
- **Description**: Full remote URL or base path to dashboard widget icons. Filenames will be appended automatically.
- **Default**: `/assets/icons/dashboard`
- **Example (Remote)**: `VITE_ASSETS_ICONS_DASHBOARD_PATH=https://cdn.example.com/icons/dashboard`
- **Example (Relative)**: `VITE_ASSETS_ICONS_DASHBOARD_PATH=/icons/dashboard`

#### `VITE_ASSETS_ICONS_NOTIFICATIONS_PATH`
- **Description**: Full remote URL or base path to notification icons. Filenames will be appended automatically.
- **Default**: `/assets/icons`
- **Example (Remote)**: `VITE_ASSETS_ICONS_NOTIFICATIONS_PATH=https://cdn.example.com/icons`
- **Example (Relative)**: `VITE_ASSETS_ICONS_NOTIFICATIONS_PATH=/icons`

#### `VITE_ASSETS_ICONS_FLAGS_PATH`
- **Description**: Full remote URL or base path to language flag icons. Filenames will be appended automatically.
- **Default**: `/assets/icons`
- **Example (Remote)**: `VITE_ASSETS_ICONS_FLAGS_PATH=https://cdn.example.com/icons`
- **Example (Relative)**: `VITE_ASSETS_ICONS_FLAGS_PATH=/icons`

#### `VITE_ASSETS_ILLUSTRATIONS_PATH`
- **Description**: Full remote URL or base path for illustration images
- **Default**: `/assets/illustrations`
- **Example (Remote)**: `VITE_ASSETS_ILLUSTRATIONS_PATH=https://cdn.example.com/illustrations`
- **Example (Relative)**: `VITE_ASSETS_ILLUSTRATIONS_PATH=/illustrations`

#### `VITE_ASSETS_ILLUSTRATION_404_PATH`
- **Description**: Full remote URL or path to 404 error illustration
- **Default**: `/assets/illustrations/illustration_404.svg`
- **Example (Remote)**: `VITE_ASSETS_ILLUSTRATION_404_PATH=https://cdn.example.com/illustrations/404.svg`
- **Example (Relative)**: `VITE_ASSETS_ILLUSTRATION_404_PATH=/illustrations/404.svg`

#### `VITE_ASSETS_BACKGROUNDS_PATH`
- **Description**: Full remote URL or base path for background images
- **Default**: `/assets/background`
- **Example (Remote)**: `VITE_ASSETS_BACKGROUNDS_PATH=https://cdn.example.com/backgrounds`
- **Example (Relative)**: `VITE_ASSETS_BACKGROUNDS_PATH=/backgrounds`

#### `VITE_ASSETS_BACKGROUND_OVERLAY_PATH`
- **Description**: Full remote URL or path to login/background overlay image
- **Default**: `/assets/background/overlay_4.jpg`
- **Example (Remote)**: `VITE_ASSETS_BACKGROUND_OVERLAY_PATH=https://cdn.example.com/backgrounds/login-overlay.jpg`
- **Example (Relative)**: `VITE_ASSETS_BACKGROUND_OVERLAY_PATH=/backgrounds/login-overlay.jpg`

### Routing & Navigation

#### `VITE_DEFAULT_ROUTE`
- **Description**: Default route after login
- **Default**: `/`
- **Example**: `VITE_DEFAULT_ROUTE=/dashboard`

#### `VITE_LOGIN_ROUTE`
- **Description**: Login page route
- **Default**: `/auth/login`
- **Example**: `VITE_LOGIN_ROUTE=/login`

#### `VITE_404_ROUTE`
- **Description**: 404 error page route
- **Default**: `/404`
- **Example**: `VITE_404_ROUTE=/not-found`

### Server Configuration

#### `VITE_DEV_PORT`
- **Description**: Development server port
- **Default**: `3030`
- **Example**: `VITE_DEV_PORT=3000`

#### `VITE_PREVIEW_PORT`
- **Description**: Preview server port (for testing production build)
- **Default**: `3030`
- **Example**: `VITE_PREVIEW_PORT=3000`

#### `VITE_HOST`
- **Description**: Development server host (use `true` for `0.0.0.0` or specific IP)
- **Default**: `localhost`
- **Example**: `VITE_HOST=0.0.0.0`

### File Uploads

#### `VITE_UPLOAD_BASE_URL`
- **Description**: Base URL for uploaded files/images
- **Default**: Uses `VITE_API_BASE_URL/uploads`
- **Example**: `VITE_UPLOAD_BASE_URL=https://cdn.yourschool.edu/uploads`

#### `VITE_MAX_FILE_SIZE`
- **Description**: Maximum file upload size in bytes
- **Default**: `5242880` (5MB)
- **Example**: `VITE_MAX_FILE_SIZE=10485760` (10MB)

#### `VITE_ALLOWED_FILE_TYPES`
- **Description**: Comma-separated list of allowed file extensions
- **Default**: `jpg,jpeg,png,gif,pdf,doc,docx`
- **Example**: `VITE_ALLOWED_FILE_TYPES=jpg,png,pdf`

### PWA Configuration

#### `VITE_PWA_THEME_COLOR`
- **Description**: PWA theme color for mobile browsers
- **Default**: `#000000`
- **Example**: `VITE_PWA_THEME_COLOR=#1976D2`

#### `VITE_PWA_BACKGROUND_COLOR`
- **Description**: PWA background color
- **Default**: `#ffffff`
- **Example**: `VITE_PWA_BACKGROUND_COLOR=#f5f5f5`

#### `VITE_PWA_DISPLAY`
- **Description**: PWA display mode (`standalone`, `fullscreen`, `minimal-ui`, `browser`)
- **Default**: `standalone`
- **Example**: `VITE_PWA_DISPLAY=standalone`

### Notification & UI

#### `VITE_NOTIFICATION_MAX_SNACKS`
- **Description**: Maximum number of snackbar notifications to show at once
- **Default**: `1`
- **Example**: `VITE_NOTIFICATION_MAX_SNACKS=3`

#### `VITE_NOTIFICATION_POSITION`
- **Description**: Notification position (`top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`)
- **Default**: `top-center`
- **Example**: `VITE_NOTIFICATION_POSITION=top-right`

### Email Configuration

#### `VITE_DEFAULT_FROM_EMAIL`
- **Description**: Default sender email address for mail features
- **Default**: `admin@example.com`
- **Example**: `VITE_DEFAULT_FROM_EMAIL=noreply@yourschool.edu`

### Feature Flags

#### `VITE_FEATURE_MAIL_ENABLED`
- **Description**: Enable/disable mail functionality (`true` or `false`)
- **Default**: `true`
- **Example**: `VITE_FEATURE_MAIL_ENABLED=false`

#### `VITE_FEATURE_ANALYTICS_ENABLED`
- **Description**: Enable/disable analytics dashboard (`true` or `false`)
- **Default**: `true`
- **Example**: `VITE_FEATURE_ANALYTICS_ENABLED=false`

#### `VITE_FEATURE_EXPORT_ENABLED`
- **Description**: Enable/disable export functionality (`true` or `false`)
- **Default**: `true`
- **Example**: `VITE_FEATURE_EXPORT_ENABLED=false`

### Development & Debugging

#### `VITE_DEBUG_MODE`
- **Description**: Enable debug mode for additional logging (`true` or `false`)
- **Default**: `false`
- **Example**: `VITE_DEBUG_MODE=true`

#### `VITE_LOG_LEVEL`
- **Description**: Logging level (`error`, `warn`, `info`, `debug`)
- **Default**: `warn`
- **Example**: `VITE_LOG_LEVEL=debug`

### Navigation Menu Configuration

The navigation menu structure can be configured via environment variables. However, for complex menu structures, it's recommended to modify `src/layouts/dashboard/config-navigation.jsx` directly.

#### `VITE_NAV_ROLES`
- **Description**: Comma-separated list of available user roles
- **Default**: `admin,staff,staffAdmin`
- **Example**: `VITE_NAV_ROLES=admin,staff,teacher,student`

### Date & Time

#### `VITE_DATE_FORMAT`
- **Description**: Default date format (using date-fns format tokens)
- **Default**: `MM/dd/yyyy`
- **Example**: `VITE_DATE_FORMAT=dd-MM-yyyy`

#### `VITE_TIME_FORMAT`
- **Description**: Default time format (12h or 24h)
- **Default**: `24h`
- **Example**: `VITE_TIME_FORMAT=12h`

#### `VITE_TIMEZONE`
- **Description**: Application timezone (IANA timezone identifier)
- **Default**: `UTC`
- **Example**: `VITE_TIMEZONE=America/New_York`

### Pagination & Tables

#### `VITE_TABLE_ROWS_PER_PAGE`
- **Description**: Default rows per page in tables
- **Default**: `10`
- **Example**: `VITE_TABLE_ROWS_PER_PAGE=25`

#### `VITE_TABLE_ROWS_PER_PAGE_OPTIONS`
- **Description**: Comma-separated list of rows per page options
- **Default**: `5,10,25,50,100`
- **Example**: `VITE_TABLE_ROWS_PER_PAGE_OPTIONS=10,25,50,100`

## Example .env File

```env
# Application Information
VITE_APP_NAME=My School Management System
VITE_APP_SHORT_NAME=School Admin
VITE_APP_DESCRIPTION=Complete school management solution
VITE_APP_KEYWORDS=school,education,management,admin
VITE_APP_AUTHOR=Your Name (your.email@example.com)

# API Configuration
VITE_API_BASE_URL=https://api.yourschool.edu
VITE_API_APPLICATION_BASE_URL=https://api.application.yourschool.edu
VITE_API_VERSION=/api/v1
VITE_API_TIMEOUT=30000

# Authentication
VITE_STORAGE_PREFIX=my-school-console
VITE_TOKEN_KEY=token
VITE_REFRESH_TOKEN_KEY=refreshToken

# Branding
VITE_APP_LOGO_PATH=/assets/logo.jpg
VITE_FAVICON_PATH=/favicon/favicon.ico
VITE_THEME_PRIMARY_COLOR=#1976D2
VITE_THEME_SECONDARY_COLOR=#424242
VITE_THEME_MODE=light
VITE_THEME_BORDER_RADIUS=8

# Routing
VITE_DEFAULT_ROUTE=/
VITE_LOGIN_ROUTE=/auth/login
VITE_404_ROUTE=/404

# Server
VITE_DEV_PORT=3030
VITE_PREVIEW_PORT=3030
VITE_HOST=localhost

# File Uploads
VITE_UPLOAD_BASE_URL=https://cdn.yourschool.edu/uploads
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx

# PWA
VITE_PWA_THEME_COLOR=#1976D2
VITE_PWA_BACKGROUND_COLOR=#ffffff
VITE_PWA_DISPLAY=standalone

# Notifications
VITE_NOTIFICATION_MAX_SNACKS=1
VITE_NOTIFICATION_POSITION=top-center

# Email
VITE_DEFAULT_FROM_EMAIL=noreply@yourschool.edu

# Feature Flags
VITE_FEATURE_MAIL_ENABLED=true
VITE_FEATURE_ANALYTICS_ENABLED=true
VITE_FEATURE_EXPORT_ENABLED=true

# Development
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=warn

# Navigation
VITE_NAV_ROLES=admin,staff,staffAdmin

# Date & Time
VITE_DATE_FORMAT=MM/dd/yyyy
VITE_TIME_FORMAT=24h
VITE_TIMEZONE=UTC

# Tables
VITE_TABLE_ROWS_PER_PAGE=10
VITE_TABLE_ROWS_PER_PAGE_OPTIONS=5,10,25,50,100

# Asset Paths
VITE_ASSETS_BASE_PATH=/assets
VITE_ASSETS_ICONS_NAVBAR_PATH=/assets/icons/navbar
VITE_ASSETS_ICONS_DASHBOARD_PATH=/assets/icons/dashboard
VITE_ASSETS_ICONS_NOTIFICATIONS_PATH=/assets/icons
VITE_ASSETS_ICONS_FLAGS_PATH=/assets/icons
VITE_ASSETS_ILLUSTRATIONS_PATH=/assets/illustrations
VITE_ASSETS_ILLUSTRATION_404_PATH=/assets/illustrations/illustration_404.svg
VITE_ASSETS_BACKGROUNDS_PATH=/assets/background
VITE_ASSETS_BACKGROUND_OVERLAY_PATH=/assets/background/overlay_4.jpg
```

## Environment-Specific Files

You can create environment-specific configuration files:

- `.env` - Default environment variables (should not be committed)
- `.env.local` - Local overrides (gitignored)
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables
- `.env.staging` - Staging environment variables

Vite will automatically load the appropriate file based on the `mode` (development/production).

## Usage in Code

Access configuration values in your code using:

```javascript
import config from 'src/config';

// Access any config value
console.log(config.appName);
console.log(config.apiBaseUrl);
```

## Important Notes

1. **Vite Prefix Requirement**: All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

2. **Security**: Never commit `.env` files containing sensitive information. Always use `.env.example` as a template.

3. **Type Safety**: Some values are automatically converted:
   - Numbers: Values that are numeric strings are converted to numbers
   - Booleans: `"true"` and `"false"` strings are converted to booleans
   - Arrays: Comma-separated strings are converted to arrays

4. **Defaults**: All configuration values have sensible defaults, so the application will work even if no `.env` file is provided.

5. **Hot Reload**: Changes to `.env` files require a server restart to take effect.

## Migration Guide

To migrate from hardcoded values to environment variables:

1. Copy `.env.example` to `.env`
2. Fill in your specific values
3. Remove any hardcoded values from the codebase
4. Test thoroughly in development before deploying

