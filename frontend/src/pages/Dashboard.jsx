import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedButton from "../components/AnimatedButton.jsx";
import AnimatedPage from "../components/AnimatedPage.jsx";
import { riseItem, staggerContainer } from "../lib/animations.js";
import { useAuthStore } from "../store/authStore.js";

function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);

  return (
    <AnimatedPage>
      <motion.div
        className="dashboard-page"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <style>{`
          .dashboard-page {
            --bg-base: #0c0e14;
            --bg-surface: #13161f;
            --bg-raised: #1a1d28;
            --bg-overlay: rgba(255,255,255,0.04);
            --border-subtle: rgba(255,255,255,0.06);
            --border-default: rgba(255,255,255,0.09);
            --border-active: rgba(14,165,233,0.2);
            --text-primary: #f1f5f9;
            --text-secondary: rgba(255,255,255,0.55);
            --text-muted: rgba(255,255,255,0.25);
            --text-active: #38bdf8;
            color: var(--text-primary);
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 22px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .dashboard-page *, .dashboard-page *::before, .dashboard-page *::after { box-sizing: border-box; }

          @media (max-width: 640px) {
            .dashboard-page { padding: 16px; }
          }

          .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }

          .section-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.13em;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 6px;
            font-family: 'Cairo', sans-serif;
          }

          .page-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-primary);
          }

          .page-subtitle {
            font-size: 13px;
            color: var(--text-secondary);
            margin-top: 4px;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            white-space: nowrap;
          }

          .badge-info { background: rgba(14,165,233,0.12); color: #38bdf8; border: 1px solid rgba(14,165,233,0.2); }
          .badge-neutral { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.09); }

          .card {
            background: var(--bg-surface);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            padding: 16px 20px;
            transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
            position: relative;
            overflow: hidden;
          }

          .card:hover {
            border-color: rgba(255,255,255,0.12);
            background: var(--bg-raised);
          }

          .dashboard-hero::after {
            content: '';
            position: absolute;
            top: -60px;
            right: -40px;
            width: 220px;
            height: 220px;
            background: radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%);
            pointer-events: none;
          }

          .stats-grid {
            display: grid;
            gap: 14px;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }

          .card-metric .value {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-primary);
            margin-top: 8px;
          }

          .card-metric .label {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 4px;
          }

          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
          }

          .section-text {
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.8;
            margin-top: 8px;
          }

          .main-grid {
            display: grid;
            gap: 14px;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          }

          .summary-list { margin-top: 12px; display: grid; gap: 10px; }

          .summary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            color: var(--text-secondary);
          }

          .summary-row span:last-child {
            color: var(--text-primary);
            font-weight: 600;
          }

          .btn-primary {
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
            box-shadow: 0 0 16px rgba(14,165,233,0.25);
          }
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.97); }

          .btn-ghost {
            background: rgba(255,255,255,0.04);
            color: rgba(255,255,255,0.6);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 500;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-ghost:hover {
            background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.9);
          }

          .btn-sm {
            padding: 7px 14px;
            font-size: 12px;
          }

          @media (max-width: 900px) {
            .page-header { align-items: flex-start; }
          }
        `}</style>

        <motion.div
          className="page-header card dashboard-hero"
          variants={riseItem}
        >
          <div>
            <p className="section-label">مرحبا بعودتك</p>
            <h2 className="page-title">نظرة عامة اليوم</h2>
            <p className="page-subtitle">
              مراجعة سريعة لأهم البيانات والأنشطة.
            </p>
          </div>
          <div className="badge badge-info">
            {selectedClinic?.name || "بدون عيادة"}
          </div>
        </motion.div>

        <motion.div className="stats-grid" variants={staggerContainer}>
          <motion.div className="card card-metric" variants={riseItem}>
            <p className="section-label">المستخدم الحالي</p>
            <div className="value">{user?.email || "-"}</div>
            <div className="label">حساب الطبيب المسجل</div>
          </motion.div>

          <motion.div className="card card-metric" variants={riseItem}>
            <p className="section-label">العيادة المختارة</p>
            <div className="value">{selectedClinic?.name || "-"}</div>
            <div className="label">إدارة جلسات هذا الفرع</div>
          </motion.div>

          <motion.div className="card card-metric" variants={riseItem}>
            <p className="section-label">الموقع</p>
            <div className="value">
              {selectedClinic?.location || "غير محدد"}
            </div>
            <div className="label">موقع العيادة الحالي</div>
          </motion.div>
        </motion.div>

        <motion.div className="main-grid" variants={staggerContainer}>
          <motion.div className="card" variants={riseItem}>
            <h3 className="section-title">حالة النظام</h3>
            <p className="section-text">
              تم تجهيز تسجيل الدخول واختيار العيادة. يمكنك الآن إدارة المرضى،
              متابعة خريطة الأسنان، والاستعداد للمرحلة القادمة من الجلسات
              والمواعيد.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AnimatedButton
                className="btn-primary btn-sm"
                type="button"
                onClick={() => navigate("/patients")}
              >
                إدارة المرضى والأسنان
              </AnimatedButton>
              <AnimatedButton
                className="btn-ghost btn-sm"
                type="button"
                onClick={() => navigate("/appointments")}
              >
                جدول المواعيد
              </AnimatedButton>
            </div>
          </motion.div>

          <motion.div className="card" variants={riseItem}>
            <h3 className="section-title">ملخص اليوم</h3>
            <div className="summary-list">
              <div className="summary-row">
                <span>مواعيد اليوم</span>
                <span>0</span>
              </div>
              <div className="summary-row">
                <span>مرضى جدد</span>
                <span>0</span>
              </div>
              <div className="summary-row">
                <span>جلسات نشطة</span>
                <span>0</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatedPage>
  );
}

export default Dashboard;
