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
export async function getSesstionsFoClinic(clinicId,{ page = 1 } = {}){
  const {data} = await api.get("/sessions",{
    params:{
      page
    }
  });
  console.log(data);
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

export async function getPatientSessionsRequest(patientId, { page = 1 } = {}) {
  const { data } = await api.get(`/patients/${patientId}/sessions`, {
    params: { page },
  });
  return data;
}

export async function getSessionRequest(sessionId) {
  const { data } = await api.get(`/sessions/${sessionId}`);
  return data;
}

export async function createSessionRequest(patientId, payload) {
  const { data } = await api.post(`/patients/${patientId}/sessions`, payload);
  return data;
}

export async function updateSessionRequest(sessionId, payload) {
  const { data } = await api.put(`/sessions/${sessionId}`, payload);
  return data;
}

export async function deleteSessionRequest(sessionId) {
  const { data } = await api.delete(`/sessions/${sessionId}`);
  return data;
}

export async function getSessionPaymentsRequest(sessionId) {
  const { data } = await api.get(`/sessions/${sessionId}/payments`);
  return data;
}

export async function addSessionPaymentRequest(sessionId, payload) {
  const { data } = await api.post(`/sessions/${sessionId}/payments`, payload);
  return data;
}

export async function getPatientPaymentsRequest(patientId) {
  const { data } = await api.get(`/patients/${patientId}/payments`);
  return data;
}

export async function refundPaymentRequest(paymentId) {
  const { data } = await api.delete(`/payments/${paymentId}`);
  return data;
}

export async function getAttachmentsRequest({ patientId, sessionId } = {}) {
  const { data } = await api.get('/attachments', {
    params: {
      patient_id: patientId,
      session_id: sessionId || undefined,
    },
  });
  return data;
}

export async function uploadAttachmentRequest({ patientId, sessionId, fileType, description, file }) {
  const formData = new FormData();
  formData.append('patient_id', patientId);
  if (sessionId) {
    formData.append('session_id', sessionId);
  }
  if (fileType) {
    formData.append('file_type', fileType);
  }
  if (description) {
    formData.append('description', description);
  }
  if (file) {
    formData.append('file', file);
  }

  const { data } = await api.post('/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteAttachmentRequest(attachmentId) {
  const { data } = await api.delete(`/attachments/${attachmentId}`);
  return data;
}

export async function getAppointmentsRequest({ clinicId, dateFrom, dateTo, status, page = 1 } = {}) {
  const { data } = await api.get('/appointments', {
    params: {
      clinic_id: clinicId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: status || undefined,
      page,
    },
  });
  return data;
}

export async function createAppointmentRequest(payload) {
  const { data } = await api.post('/appointments', payload);
  return data;
}

export async function getAppointmentRequest(id) {
  const { data } = await api.get(`/appointments/${id}`);
  return data;
}

export async function updateAppointmentRequest(id, payload) {
  const { data } = await api.put(`/appointments/${id}`, payload);
  return data;
}

export async function deleteAppointmentRequest(id) {
  const { data } = await api.delete(`/appointments/${id}`);
  return data;
}

export default api;
