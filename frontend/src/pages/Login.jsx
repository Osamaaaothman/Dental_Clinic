import { useState } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import AnimatedButton from "../components/AnimatedButton.jsx";
import AnimatedPage from "../components/AnimatedPage.jsx";
import FormField from "../components/FormField.jsx";
import { riseItem, smoothEase, staggerContainer } from "../lib/animations.js";
import { useAuthStore } from "../store/authStore.js";

function Login() {
  const token = useAuthStore((state) => state.token);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    <AnimatedPage>
      <div className="login-page">
        <style>{`
          .login-page {
            --bg-base: #0c0e14;
            --bg-surface: #13161f;
            --bg-raised: #1a1d28;
            --border-subtle: rgba(255,255,255,0.06);
            --border-default: rgba(255,255,255,0.09);
            --text-primary: #f1f5f9;
            --text-secondary: rgba(255,255,255,0.55);
            --text-muted: rgba(255,255,255,0.25);
            color: var(--text-primary);
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            min-height: 100dvh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: var(--bg-base);
            background-image:
              linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
            background-size: 36px 36px;
            position: relative;
            overflow: hidden;
          }

          .login-page::after {
            content: '';
            position: absolute;
            top: -80px;
            right: -60px;
            width: 260px;
            height: 260px;
            background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
            pointer-events: none;
          }

          .login-card {
            width: min(92vw, 420px);
            background: var(--bg-surface);
            border: 1px solid var(--border-default);
            border-radius: 16px;
            padding: 26px 24px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 24px 60px rgba(0,0,0,0.55);
          }

          .login-card::after {
            content: '';
            position: absolute;
            top: -60px;
            right: -40px;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%);
            pointer-events: none;
          }

          .section-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.13em;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .page-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-primary);
          }

          .page-subtitle {
            font-size: 13px;
            color: var(--text-secondary);
            margin-top: 8px;
            line-height: 1.7;
          }

          .label {
            display: block;
            margin-bottom: 6px;
          }

          .label-text {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255,255,255,0.4);
          }

          .label-text-alt {
            font-size: 11px;
            color: rgba(255,255,255,0.45);
          }

          .text-error { color: #f87171; }
          .input-error { border-color: rgba(239,68,68,0.45); }

          .input {
            background: var(--bg-raised);
            border: 1px solid var(--border-default);
            border-radius: 10px;
            padding: 9px 14px;
            color: var(--text-primary);
            font-size: 13px;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.2s;
            outline: none;
          }

          .input::placeholder { color: rgba(255,255,255,0.22); }
          .input:focus { border-color: rgba(14,165,233,0.4); }
          .input:disabled { opacity: 0.6; cursor: not-allowed; }

          .login-alert {
            margin-top: 12px;
            background: rgba(239,68,68,0.09);
            border: 1px solid rgba(239,68,68,0.14);
            color: #f87171;
            border-radius: 12px;
            padding: 10px 12px;
            font-size: 13px;
          }

          .btn-primary {
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
            box-shadow: 0 0 16px rgba(14,165,233,0.25);
            width: 100%;
          }
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.97); }
          .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
        `}</style>

        <motion.div
          className="login-card"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.35, ease: smoothEase }}
        >
          <motion.div variants={riseItem}>
            <p className="section-label">نظام إدارة عيادة الأسنان</p>
            <h1 className="page-title">تسجيل دخول الطبيب</h1>
            <p className="page-subtitle">
              أهلاً بك دكتور، أدخل بيانات الحساب للوصول إلى لوحة التحكم.
            </p>
          </motion.div>

          <motion.form
            variants={riseItem}
            className="mt-6 space-y-3"
            onSubmit={handleSubmit}
            autoComplete="on"
          >
            <FormField
              id="email"
              name="email"
              type="email"
              label="البريد الإلكتروني"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com"
              autoComplete="username"
              disabled={isLoading}
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
              disabled={isLoading}
              required
            />

            {error && <div className="login-alert">{error}</div>}

            <AnimatedButton
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "جار تسجيل الدخول..." : "دخول"}
            </AnimatedButton>
          </motion.form>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default Login;
