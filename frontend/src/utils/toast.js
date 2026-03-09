import toast from 'react-hot-toast';

// Custom toast configurations with consistent styling
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
      ...options
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
      ...options
    });
  },

  warning: (message, options = {}) => {
    return toast(message, {
      duration: 4500,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
      ...options
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#3B82F6',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
      ...options
    });
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        position: 'top-right',
        style: {
          fontWeight: '500',
          borderRadius: '8px',
          padding: '12px 16px',
        },
        ...options
      }
    );
  },

  custom: (component, options = {}) => {
    return toast.custom(component, {
      position: 'top-right',
      duration: 4000,
      ...options
    });
  },

  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },

  remove: (toastId) => {
    return toast.remove(toastId);
  }
};

// Export default toast for backward compatibility
export default showToast;