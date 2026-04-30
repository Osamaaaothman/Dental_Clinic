import { AnimatePresence, motion } from 'framer-motion';
import { toastMotion } from '../lib/animations.js';
import { useUiStore } from '../store/uiStore.js';

const toastClass = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
};

function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`alert pointer-events-auto shadow-lg ${toastClass[toast.type] || 'alert-info'}`}
            variants={toastMotion}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22 }}
            onClick={() => removeToast(toast.id)}
            role="button"
            tabIndex={0}
          >
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
