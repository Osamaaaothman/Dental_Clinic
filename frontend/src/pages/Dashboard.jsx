import { motion } from 'framer-motion';
import AnimatedButton from '../components/AnimatedButton.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import { riseItem, staggerContainer } from '../lib/animations.js';
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
        <motion.div className="rounded-2xl border border-base-300 bg-base-100/90 px-3 py-3 shadow sm:px-4" variants={riseItem}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-extrabold text-neutral sm:text-xl">لوحة التحكم</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="badge badge-primary badge-outline">{selectedClinic?.name || 'بدون عيادة'}</div>
              <AnimatedButton className="btn btn-error btn-outline btn-sm" type="button" onClick={handleLogoutClick}>
                تسجيل الخروج
              </AnimatedButton>
            </div>
          </div>
        </motion.div>

        <motion.div className="grid gap-3 sm:gap-4 md:grid-cols-3" variants={staggerContainer}>
          <motion.div className="stat rounded-2xl border border-base-300 bg-base-100 shadow" variants={riseItem}>
            <div className="stat-title">المستخدم الحالي</div>
            <div className="stat-value overflow-hidden text-ellipsis text-base text-primary sm:text-lg">{user?.email || '-'}</div>
          </motion.div>

          <motion.div className="stat rounded-2xl border border-base-300 bg-base-100 shadow" variants={riseItem}>
            <div className="stat-title">العيادة المختارة</div>
            <div className="stat-value text-base text-secondary sm:text-lg">{selectedClinic?.name || '-'}</div>
          </motion.div>

          <motion.div className="stat rounded-2xl border border-base-300 bg-base-100 shadow" variants={riseItem}>
            <div className="stat-title">الموقع</div>
            <div className="stat-value text-base text-accent sm:text-lg">{selectedClinic?.location || 'غير محدد'}</div>
          </motion.div>
        </motion.div>

        <motion.div className="glass-card" variants={riseItem}>
          <div className="card-body">
            <h2 className="card-title text-lg">حالة النظام</h2>
            <p className="text-sm leading-7 text-base-content/75">
              تم تجهيز تسجيل الدخول، حماية المسارات، واختيار العيادة بنجاح. النظام جاهز الآن
              للانتقال إلى إدارة المرضى والأسنان.
            </p>
            <div className="card-actions justify-start sm:justify-start">
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
