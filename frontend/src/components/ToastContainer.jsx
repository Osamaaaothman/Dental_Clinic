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
    <div className="pointer-events-none fixed left-3 right-3 top-3 z-[70] flex w-auto max-w-sm flex-col gap-2 sm:left-4 sm:right-auto sm:top-4 sm:w-[min(360px,calc(100vw-2rem))]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`alert pointer-events-auto shadow-lg text-sm ${toastClass[toast.type] || 'alert-info'}`}
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
