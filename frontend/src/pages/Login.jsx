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
    email: '',
    password: '',
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
    <AnimatedPage className="page-shell relative grid place-items-center">
      <motion.div
        className="panel-card w-full max-w-md p-6 sm:p-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.35, ease: smoothEase }}
      >
        <motion.div variants={riseItem} className="flex items-start justify-between">
          <div>
            <p className="field-label">نظام إدارة عيادة الأسنان</p>
            <h1 className="mt-2 text-2xl font-bold text-base-content">تسجيل دخول الطبيب</h1>
            <p className="subtle-text mt-2">
              أهلاً بك دكتور، أدخل بيانات الحساب للوصول إلى لوحة التحكم.
            </p>
          </div>
        </motion.div>

        <motion.form variants={riseItem} className="mt-6 space-y-3" onSubmit={handleSubmit} autoComplete="on">
          <FormField
            id="email"
            name="email"
            type="email"
            label="البريد الإلكتروني"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@domain.com"
            autoComplete="username"
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
            autoComplete="current-password"
            required
          />

          {error && <div className="alert alert-error py-2 text-sm">{error}</div>}

          <AnimatedButton type="submit" className="btn btn-primary mt-2 w-full" disabled={isLoading}>
            {isLoading ? 'جار تسجيل الدخول...' : 'دخول'}
          </AnimatedButton>
        </motion.form>
      </motion.div>
    </AnimatedPage>
  );
}

export default Login;
