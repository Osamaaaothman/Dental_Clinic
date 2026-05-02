import { AnimatePresence, motion } from "framer-motion";
import { toastMotion } from "../lib/animations.js";
import { useUiStore } from "../store/uiStore.js";

const toastClass = {
  success: "toast-success",
  error: "toast-error",
  warning: "toast-warning",
  info: "toast-info",
};

function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  return (
    <div className="toast-container pointer-events-none fixed left-3 right-3 top-3 z-[70] flex w-auto max-w-sm flex-col gap-2 sm:left-4 sm:right-auto sm:top-4 sm:w-[min(360px,calc(100vw-2rem))]">
      <style>{`
        .toast-container {
          direction: rtl;
          font-family: 'Cairo', sans-serif;
        }

        .toast {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 12px;
          background: #13161f;
          border: 1px solid rgba(255,255,255,0.09);
          color: #f1f5f9;
          box-shadow: 0 18px 36px rgba(0,0,0,0.45);
          font-size: 13px;
          line-height: 1.6;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }

        .toast::before {
          content: '';
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #0ea5e9, #6366f1);
          box-shadow: 0 0 10px rgba(14,165,233,0.45);
        }

        .toast::after {
          content: '';
          position: absolute;
          top: -60px;
          right: -40px;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .toast:hover {
          background: #1a1d28;
          border-color: rgba(255,255,255,0.12);
        }

        .toast-message {
          color: rgba(255,255,255,0.78);
        }

        .toast-success { border-color: rgba(34,197,94,0.2); }
        .toast-success::before { background: linear-gradient(180deg, #22c55e, #4ade80); box-shadow: 0 0 10px rgba(34,197,94,0.5); }

        .toast-error { border-color: rgba(239,68,68,0.2); }
        .toast-error::before { background: linear-gradient(180deg, #ef4444, #f87171); box-shadow: 0 0 10px rgba(239,68,68,0.45); }

        .toast-warning { border-color: rgba(234,179,8,0.2); }
        .toast-warning::before { background: linear-gradient(180deg, #eab308, #fbbf24); box-shadow: 0 0 10px rgba(234,179,8,0.45); }

        .toast-info { border-color: rgba(14,165,233,0.2); }
        .toast-info::before { background: linear-gradient(180deg, #0ea5e9, #6366f1); box-shadow: 0 0 10px rgba(14,165,233,0.5); }
      `}</style>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast pointer-events-auto ${toastClass[toast.type] || "toast-info"}`}
            variants={toastMotion}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22 }}
            onClick={() => removeToast(toast.id)}
            role="button"
            tabIndex={0}
          >
            <span className="toast-message">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
