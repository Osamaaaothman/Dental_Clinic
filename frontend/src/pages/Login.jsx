import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import AnimatedButton from '../components/AnimatedButton.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import FormField from '../components/FormField.jsx';
import { riseItem, smoothEase, staggerContainer } from '../lib/animations.js';
import { useAuthStore } from '../store/authStore.js';

function Login() {
  const token = useAuthStore((state) => state.token);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [formData, setFormData] = useState({
    email: 'admin@gmail.com',
    password: 'Oossaammaa1234@',
  });

  if (token && selectedClinic) {
    return <Navigate to="/dashboard" replace />;
  }

  if (token && !selectedClinic) {
    return <Navigate to="/select-clinic" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await login(formData.email, formData.password);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <AnimatedPage className="page-shell relative grid place-items-center overflow-hidden">
      <div className="floating-shape right-[-110px] top-[-80px] h-72 w-72 bg-secondary/25" aria-hidden="true" />
      <div className="floating-shape bottom-[-120px] left-[-80px] h-80 w-80 bg-primary/25" aria-hidden="true" />
      <div className="floating-shape right-[40%] top-[58%] h-60 w-60 bg-accent/20" aria-hidden="true" />

      <motion.div
        className="glass-card w-full max-w-md"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.35, ease: smoothEase }}
      >
        <div className="card-body gap-4 p-7 sm:p-8">
          <motion.div variants={riseItem} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary">نظام إدارة عيادة الأسنان</p>
              <h1 className="mt-1 text-2xl font-extrabold text-neutral">دخول الطبيب</h1>
            </div>
            <div className="badge badge-primary badge-outline">المرحلة الأولى</div>
          </motion.div>

          <motion.p variants={riseItem} className="text-sm leading-7 text-base-content/70">
            أهلاً بك دكتور، أدخل بيانات الحساب للوصول إلى لوحة التحكم والبدء في إدارة العيادة.
          </motion.p>

          <motion.form variants={riseItem} className="mt-2 space-y-2" onSubmit={handleSubmit}>
            <FormField
              id="email"
              name="email"
              type="email"
              label="البريد الإلكتروني"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com"
              required
            />

            <FormField
              id="password"
              name="password"
              type="password"
              label="كلمة المرور"
              value={formData.password}
              onChange={handleChange}
              placeholder="اكتب كلمة المرور"
              required
            />

            {error && <div className="alert alert-error py-2 text-sm">{error}</div>}

            <AnimatedButton type="submit" className="btn btn-primary mt-3 w-full" disabled={isLoading}>
              {isLoading ? 'جار تسجيل الدخول...' : 'دخول'}
            </AnimatedButton>
          </motion.form>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}

export default Login;
