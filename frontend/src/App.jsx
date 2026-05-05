import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ConfirmModal from './components/ConfirmModal.jsx';
import LoadingOverlay from './components/LoadingOverlay.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import PatientTeeth from './pages/PatientTeeth.jsx';
import Appointments from './pages/Appointments.jsx';
import AppointmentForm from './pages/AppointmentForm.jsx';
import AppointmentDetail from './pages/AppointmentDetail.jsx';
import SessionDetail from './pages/SessionDetail.jsx';
import SessionsList from './pages/SessionsList.jsx';
import SessionsOverview from './pages/SessionsOverview.jsx';
import SessionWizard from './pages/SessionWizard.jsx';
import Patients from './pages/Patients.jsx';
import SelectClinic from './pages/SelectClinic.jsx';
import { useAuthStore } from './store/authStore.js';
import { useUiStore } from './store/uiStore.js';
import { useThemeStore } from './store/themeStore.js';

function App() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const loadMe = useAuthStore((state) => state.loadMe);
  const isGlobalLoading = useUiStore((state) => state.isGlobalLoading);
  const modal = useUiStore((state) => state.modal);
  const closeModal = useUiStore((state) => state.closeModal);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    if (token) {
      loadMe();
    }
  }, [token, loadMe]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <Navigate to={token ? (selectedClinic ? '/dashboard' : '/select-clinic') : '/login'} replace />
            }
          />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/select-clinic" element={<SelectClinic />} />
          </Route>

          <Route element={<ProtectedRoute requireClinic />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointments/new" element={<AppointmentForm />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/:id" element={<PatientTeeth />} />
              <Route path="/sessions" element={<SessionsOverview />} />
              <Route path="/patients/:id/sessions" element={<SessionsList />} />
              <Route path="/patients/:id/sessions/new" element={<SessionWizard />} />
              <Route path="/patients/:id/sessions/:sessionId" element={<SessionDetail />} />
            </Route>
          </Route>
        </Routes>
      </AnimatePresence>

      <LoadingOverlay visible={isGlobalLoading} />
      <ToastContainer />
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        description={modal.description}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />
    </div>
  );
}

export default App;
