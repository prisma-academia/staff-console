import { create } from 'zustand';

export const useErrorStore = create((set) => ({
  isOpen: false,
  type: 'error', // 'error' | 'permission'
  title: '',
  message: '',
  details: null,
  onClose: null,
  retry: null,

  showError: ({ title, message, details = null, onClose = null, retry = null }) => {
    set({
      isOpen: true,
      type: 'error',
      title: title || 'Error',
      message: message || 'An error occurred',
      details,
      onClose,
      retry,
    });
  },

  showPermissionError: ({ title, message, details = null, onClose = null }) => {
    set({
      isOpen: true,
      type: 'permission',
      title: title || 'Access Denied',
      message: message || 'You do not have permission to perform this action.',
      details,
      onClose,
      retry: null,
    });
  },

  hideError: () => {
    set({
      isOpen: false,
      type: 'error',
      title: '',
      message: '',
      details: null,
      onClose: null,
      retry: null,
    });
  },
}));

