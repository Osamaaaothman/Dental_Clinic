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

export async function getPatientsRequest({ clinicId, search = '', page = 1 }) {
  const { data } = await api.get('/patients', {
    params: {
      clinic_id: clinicId,
      search: search || undefined,
      page,
    },
  });
  return data;
}

export async function getPatientRequest(id) {
  const { data } = await api.get(`/patients/${id}`);
  return data;
}

export async function createPatientRequest(payload) {
  const { data } = await api.post('/patients', payload);
  return data;
}

export async function updatePatientRequest(id, payload) {
  const { data } = await api.put(`/patients/${id}`, payload);
  return data;
}

export async function deletePatientRequest(id) {
  const { data } = await api.delete(`/patients/${id}`);
  return data;
}

export async function getPatientTeethRequest(patientId) {
  const { data } = await api.get(`/patients/${patientId}/teeth`);
  return data;
}

export async function updateToothStatusRequest(toothId, payload) {
  const { data } = await api.put(`/teeth/${toothId}`, payload);
  return data;
}

export async function getToothHistoryRequest(toothId) {
  const { data } = await api.get(`/teeth/${toothId}/history`);
  return data;
}

export default api;
