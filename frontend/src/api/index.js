import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function loginRequest(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function meRequest() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function clinicsRequest() {
  const { data } = await api.get('/clinics');
  return data;
}

export async function selectClinicRequest(clinicId) {
  const { data } = await api.post('/auth/select-clinic', { clinicId });
  return data;
}

export async function logoutRequest() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export default api;
