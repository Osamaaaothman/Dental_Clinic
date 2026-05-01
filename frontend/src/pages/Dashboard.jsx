import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/AnimatedButton.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import { riseItem, staggerContainer } from '../lib/animations.js';
import { useAuthStore } from '../store/authStore.js';

function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  

  return (
    <AnimatedPage>
      <motion.div className="space-y-6" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div className="panel-card p-5 sm:p-6" variants={riseItem}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="field-label">مرحبا بعودتك</p>
              <h2 className="section-title">نظرة عامة اليوم</h2>
              <p className="subtle-text">مراجعة سريعة لأهم البيانات والأنشطة.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="badge badge-outline badge-primary">{selectedClinic?.name || 'بدون عيادة'}</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
          <motion.div className="stat-tile" variants={riseItem}>
            <p className="field-label">المستخدم الحالي</p>
            <p className="mt-2 text-base font-semibold text-base-content sm:text-lg">{user?.email || '-'}</p>
            <p className="subtle-text mt-1">حساب الطبيب المسجل</p>
          </motion.div>

          <motion.div className="stat-tile" variants={riseItem}>
            <p className="field-label">العيادة المختارة</p>
            <p className="mt-2 text-base font-semibold text-base-content sm:text-lg">{selectedClinic?.name || '-'}</p>
            <p className="subtle-text mt-1">إدارة جلسات هذا الفرع</p>
          </motion.div>

          <motion.div className="stat-tile" variants={riseItem}>
            <p className="field-label">الموقع</p>
            <p className="mt-2 text-base font-semibold text-base-content sm:text-lg">{selectedClinic?.location || 'غير محدد'}</p>
            <p className="subtle-text mt-1">موقع العيادة الحالي</p>
          </motion.div>
        </motion.div>

        <motion.div className="grid gap-3 lg:grid-cols-3" variants={staggerContainer}>
          <motion.div className="panel-card p-5 sm:p-6 lg:col-span-2" variants={riseItem}>
            <h3 className="section-title">حالة النظام</h3>
            <p className="subtle-text mt-2 leading-7">
              تم تجهيز تسجيل الدخول واختيار العيادة. يمكنك الآن إدارة المرضى، متابعة خريطة
              الأسنان، والاستعداد للمرحلة القادمة من الجلسات والمواعيد.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AnimatedButton className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/patients')}>
                إدارة المرضى والأسنان
              </AnimatedButton>
              <AnimatedButton className="btn btn-outline btn-sm" type="button" onClick={() => navigate('/appointments')}>
                جدول المواعيد
              </AnimatedButton>
            </div>
          </motion.div>

          <motion.div className="panel-card p-5 sm:p-6" variants={riseItem}>
            <h3 className="section-title">ملخص اليوم</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/70">مواعيد اليوم</span>
                <span className="text-base-content">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/70">مرضى جدد</span>
                <span className="text-base-content">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/70">جلسات نشطة</span>
                <span className="text-base-content">0</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatedPage>
  );
}

export default Dashboard;
