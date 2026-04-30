import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ConfirmModal from './components/ConfirmModal.jsx';
import LoadingOverlay from './components/LoadingOverlay.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import SelectClinic from './pages/SelectClinic.jsx';
import { useAuthStore } from './store/authStore.js';
import { useUiStore } from './store/uiStore.js';

function App() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const loadMe = useAuthStore((state) => state.loadMe);
  const isGlobalLoading = useUiStore((state) => state.isGlobalLoading);
  const modal = useUiStore((state) => state.modal);
  const closeModal = useUiStore((state) => state.closeModal);

  useEffect(() => {
    if (token) {
      loadMe();
    }
  }, [token, loadMe]);

  return (
    <>
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
            <Route path="/dashboard" element={<Dashboard />} />
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
    </>
  );
}

export default App;
