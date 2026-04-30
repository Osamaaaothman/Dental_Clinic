import { create } from 'zustand';
import {
  clinicsRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  selectClinicRequest,
} from '../api/index.js';
import { useUiStore } from './uiStore.js';

const STORAGE_KEY = 'clinic-app-auth';

function readInitialState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { token: null, user: null, selectedClinic: null };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      user: parsed.user || null,
      selectedClinic: parsed.selectedClinic || null,
    };
  } catch (_error) {
    return { token: null, user: null, selectedClinic: null };
  }
}

function persistState({ token, user, selectedClinic }) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ token: token || null, user: user || null, selectedClinic: selectedClinic || null })
  );

  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

const initialState = readInitialState();

export const useAuthStore = create((set, get) => ({
  token: initialState.token,
  user: initialState.user,
  selectedClinic: initialState.selectedClinic,
  clinics: [],
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    useUiStore.getState().setGlobalLoading(true);
    try {
      const data = await loginRequest({ email, password });
      const nextState = {
        token: data.token,
        user: data.user,
        selectedClinic: null,
      };
      persistState(nextState);
      set({ ...nextState, isLoading: false });
      await get().loadClinics();
      useUiStore.getState().pushToast({
        type: 'success',
        message: 'تم تسجيل الدخول بنجاح',
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'فشل تسجيل الدخول';
      set({ isLoading: false, error: message });
      useUiStore.getState().pushToast({
        type: 'error',
        message,
      });
      return { success: false };
    } finally {
      useUiStore.getState().setGlobalLoading(false);
    }
  },

  loadMe: async () => {
    if (!get().token) {
      return;
    }

    set({ isLoading: true, error: null });
    useUiStore.getState().setGlobalLoading(true);
    try {
      const data = await meRequest();
      const state = {
        token: get().token,
        user: data.user,
        selectedClinic:
          get().selectedClinic ||
          data.clinics.find((clinic) => clinic.id === data.user.selectedClinicId) ||
          null,
      };
      persistState(state);
      set({ ...state, clinics: data.clinics, isLoading: false });
    } catch (_error) {
      get().clearAuth();
    } finally {
      useUiStore.getState().setGlobalLoading(false);
    }
  },

  loadClinics: async () => {
    try {
      const data = await clinicsRequest();
      set({ clinics: data.clinics || [] });
    } catch (_error) {
      set({ clinics: [] });
    }
  },

  selectClinic: async (clinicId) => {
    set({ isLoading: true, error: null });
    useUiStore.getState().setGlobalLoading(true);
    try {
      const data = await selectClinicRequest(clinicId);
      const selectedClinic = data.selectedClinic;
      const nextState = {
        token: data.token,
        user: get().user,
        selectedClinic,
      };
      persistState(nextState);
      set({ ...nextState, isLoading: false });
      useUiStore.getState().pushToast({
        type: 'success',
        message: `تم اختيار عيادة ${selectedClinic.name}`,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'تعذر اختيار العيادة';
      set({ isLoading: false, error: message });
      useUiStore.getState().pushToast({
        type: 'error',
        message,
      });
      return { success: false };
    } finally {
      useUiStore.getState().setGlobalLoading(false);
    }
  },

  logout: async () => {
    useUiStore.getState().setGlobalLoading(true);
    try {
      await logoutRequest();
      useUiStore.getState().pushToast({
        type: 'info',
        message: 'تم تسجيل الخروج',
      });
    } catch (_error) {
      useUiStore.getState().pushToast({
        type: 'warning',
        message: 'تم تسجيل الخروج محلياً',
      });
    } finally {
      useUiStore.getState().setGlobalLoading(false);
    }

    get().clearAuth();
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('token');
    set({
      token: null,
      user: null,
      selectedClinic: null,
      clinics: [],
      isLoading: false,
      error: null,
    });
  },
}));
