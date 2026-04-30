import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set) => ({
  isGlobalLoading: false,
  modal: {
    open: false,
    title: '',
    description: '',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    onConfirm: null,
  },
  toasts: [],

  setGlobalLoading: (value) => set({ isGlobalLoading: Boolean(value) }),

  openModal: ({ title, description, confirmText, cancelText, onConfirm }) =>
    set({
      modal: {
        open: true,
        title: title || '',
        description: description || '',
        confirmText: confirmText || 'تأكيد',
        cancelText: cancelText || 'إلغاء',
        onConfirm: onConfirm || null,
      },
    }),

  closeModal: () =>
    set({
      modal: {
        open: false,
        title: '',
        description: '',
        confirmText: 'تأكيد',
        cancelText: 'إلغاء',
        onConfirm: null,
      },
    }),

  pushToast: ({ type = 'info', message = '', duration = 3500 }) => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
