import { AnimatePresence, motion } from 'framer-motion';
import { modalBackdrop, modalPanel, smoothEase } from '../lib/animations.js';

function ConfirmModal({ open, title, description, confirmText, cancelText, onConfirm, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[65] grid place-items-center bg-slate-900/35 p-4"
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2, ease: smoothEase }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-4 shadow-2xl sm:p-5"
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.24, ease: smoothEase }}
          >
            <h3 className="text-base font-extrabold text-neutral sm:text-lg">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-base-content/75">{description}</p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button type="button" className="btn btn-ghost btn-sm w-full sm:w-auto" onClick={onClose}>
                {cancelText}
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm w-full sm:w-auto"
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default ConfirmModal;
