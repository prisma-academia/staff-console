import { alpha } from '@mui/material/styles';
import config from '../config';

// ----------------------------------------------------------------------

// SETUP COLORS

export const grey = {
  0: '#FFFFFF',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#212B36',
  900: '#161C24',
};
export const green = {
  50: '#e0f2f0',
  100: '#b8d8e5',
  200: '#8ebfd5',
  300: '#68a7c5',
  400: '#4d95bb',
  500: '#3385b2',  
  600: '#2779a7',
  700: '#1a6996',
  800: '#0f5985',
  900: '#003e67',
};


export const primary = {
  lighter: config.theme.primary.lighter, // Very light shade of redhunt color
  light: config.theme.primary.light,   // Lightened version of redhunt color
  main: config.theme.primary.main,    // Base redhunt color
  dark: config.theme.primary.dark,    // Darkened version of redhunt color
  darker: config.theme.primary.darker,  // Very dark shade of redhunt color
  contrastText: config.theme.primary.contrastText, // White text for contrast
};

export const secondary = {
  lighter: config.theme.secondary.lighter, // Very light shade of secondary color
  light: config.theme.secondary.light,   // Lightened version of secondary color
  main: config.theme.secondary.main,    // Base secondary color
  dark: config.theme.secondary.dark,    // Darkened version of secondary color
  darker: config.theme.secondary.darker,  // Very dark shade of secondary color
  contrastText: config.theme.secondary.contrastText, // White text for contrast
};

export const info = {
  lighter: '#CAFDF5',
  light: '#61F3F3',
  main: '#00B8D9',
  dark: '#006C9C',
  darker: '#003768',
  contrastText: '#FFFFFF',
};

export const success = {
  lighter: '#C8FAD6',
  light: '#5BE49B',
  main: '#00A76F',
  dark: '#007867',
  darker: '#004B50',
  contrastText: '#FFFFFF',
};

export const warning = {
  lighter: '#FFF5CC',
  light: '#FFD666',
  main: '#FFAB00',
  dark: '#B76E00',
  darker: '#7A4100',
  contrastText: green[800],
};

export const error = {
  lighter: '#FFE9D5',
  light: '#FFAC82',
  main: '#FF5630',
  dark: '#B71D18',
  darker: '#7A0916',
  contrastText: '#FFFFFF',
};

export const common = {
  black: '#000000',
  white: '#FFFFFF',
};

export const action = {
  hover: alpha(green[500], 0.08),
  selected: alpha(green[500], 0.16),
  disabled: alpha(green[500], 0.8),
  disabledBackground: alpha(green[500], 0.24),
  focus: alpha(green[500], 0.24),
  hoverOpacity: 0.08,
  disabledOpacity: 0.48,
};

const base = {
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  grey,
  green,
  common,
  divider: alpha(green[500], 0.2),
  action,
};

// ----------------------------------------------------------------------

export function palette() {
  return {
    ...base,
    mode: 'light',
    text: {
      primary: '#000000',
      secondary: green[600],
      disabled: green[500],
    },
    background: {
      paper: '#FFFFFF',
      default: grey[200],
      neutral: "#FFFFFF",
    },
    action: {
      ...base.action,
      active: '#126E82',
    },
  };
}
