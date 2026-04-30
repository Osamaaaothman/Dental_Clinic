import { motion } from 'framer-motion';
import AnimatedButton from '../components/AnimatedButton.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import { riseItem, smoothEase, staggerContainer } from '../lib/animations.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';

function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const logout = useAuthStore((state) => state.logout);
  const openModal = useUiStore((state) => state.openModal);

  function handleLogoutClick() {
    openModal({
      title: 'تأكيد تسجيل الخروج',
      description: 'هل تريد إنهاء الجلسة الحالية والعودة إلى صفحة تسجيل الدخول؟',
      confirmText: 'تسجيل الخروج',
      cancelText: 'إلغاء',
      onConfirm: () => {
        logout();
      },
    });
  }

  return (
    <AnimatedPage className="page-shell">
      <motion.div
        className="mx-auto w-full max-w-6xl space-y-5"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="navbar rounded-2xl border border-base-300 bg-base-100/90 px-4 shadow"
          variants={riseItem}
          transition={{ duration: 0.28, ease: smoothEase }}
        >
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-neutral">لوحة التحكم</h1>
          </div>
          <div className="flex-none gap-2">
            <div className="badge badge-primary badge-outline">{selectedClinic?.name || 'بدون عيادة'}</div>
            <AnimatedButton className="btn btn-error btn-outline btn-sm" type="button" onClick={handleLogoutClick}>
              تسجيل الخروج
            </AnimatedButton>
          </div>
        </motion.div>

        <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainer}>
          <motion.div className="stat rounded-2xl border border-base-300 bg-base-100 shadow" variants={riseItem}>
            <div className="stat-title">المستخدم الحالي</div>
            <div className="stat-value text-lg text-primary">{user?.email || '-'}</div>
          </motion.div>

          <motion.div className="stat rounded-2xl border border-base-300 bg-base-100 shadow" variants={riseItem}>
            <div className="stat-title">العيادة المختارة</div>
            <div className="stat-value text-lg text-secondary">{selectedClinic?.name || '-'}</div>
          </motion.div>

          <motion.div className="stat rounded-2xl border border-base-300 bg-base-100 shadow" variants={riseItem}>
            <div className="stat-title">الموقع</div>
            <div className="stat-value text-lg text-accent">{selectedClinic?.location || 'غير محدد'}</div>
          </motion.div>
        </motion.div>

        <motion.div className="glass-card" variants={riseItem}>
          <div className="card-body">
            <h2 className="card-title text-lg">حالة النظام</h2>
            <p className="text-sm leading-7 text-base-content/75">
              تم تجهيز المرحلة الأولى بنجاح: تسجيل الدخول، حماية المسارات، واختيار العيادة. جاهز الآن
              للانتقال إلى مرحلة إدارة المرضى والأسنان.
            </p>
            <div className="card-actions justify-start">
              <AnimatedButton className="btn btn-primary btn-sm" type="button" disabled>
                قريباً: إدارة المرضى
              </AnimatedButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatedPage>
  );
}

export default Dashboard;
