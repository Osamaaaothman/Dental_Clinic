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
      <div className="mx-auto w-full max-w-5xl">
        <motion.div
          className="mb-5 flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100/85 px-4 py-4 shadow sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          variants={riseItem}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, ease: smoothEase }}
        >
          <div>
            <p className="text-xs font-bold text-primary">الخطوة الثانية</p>
            <h1 className="text-xl font-extrabold text-neutral sm:text-2xl">اختيار العيادة</h1>
          </div>
          <span className="badge badge-secondary badge-outline self-start sm:self-auto">جلسة العمل</span>
        </motion.div>

        <motion.p
          className="mb-5 text-sm text-base-content/70"
          variants={riseItem}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, ease: smoothEase, delay: 0.04 }}
        >
          اختر العيادة التي تريد العمل عليها الآن.
        </motion.p>

        {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}

        <motion.div
          className="grid gap-3 sm:grid-cols-2 sm:gap-4"
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
            <div className="alert">
              <span>لا توجد عيادات متاحة حالياً.</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default SelectClinic;
