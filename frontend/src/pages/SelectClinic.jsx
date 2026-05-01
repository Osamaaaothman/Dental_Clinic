import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import ClinicCard from '../components/ClinicCard.jsx';
import { riseItem, smoothEase, staggerContainer } from '../lib/animations.js';
import { useAuthStore } from '../store/authStore.js';

function SelectClinic() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const clinics = useAuthStore((state) => state.clinics);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const loadClinics = useAuthStore((state) => state.loadClinics);
  const selectClinic = useAuthStore((state) => state.selectClinic);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (selectedClinic) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSelect(clinicId) {
    const result = await selectClinic(clinicId);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  }

  return (
    <AnimatedPage className="page-shell">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <motion.div
          className="panel-card p-5 sm:p-6"
          variants={riseItem}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, ease: smoothEase }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="field-label">الخطوة الثانية</p>
              <h1 className="section-title">اختيار العيادة</h1>
              <p className="subtle-text mt-1">اختر العيادة التي تريد العمل عليها الآن.</p>
            </div>
            <span className="badge badge-outline badge-secondary self-start sm:self-auto">جلسة العمل</span>
          </div>
        </motion.div>

        {error && <div className="alert alert-error text-sm">{error}</div>}

        <motion.div
          className="grid gap-3 sm:grid-cols-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {clinics.map((clinic, index) => (
            <ClinicCard
              key={clinic.id}
              clinic={clinic}
              index={index}
              isLoading={isLoading}
              onSelect={handleSelect}
            />
          ))}

          {clinics.length === 0 && (
            <div className="panel-card p-4 text-center text-sm text-base-content/70">
              لا توجد عيادات متاحة حالياً.
            </div>
          )}
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default SelectClinic;
