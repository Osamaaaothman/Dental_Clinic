import { AnimatePresence, motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner.jsx';

function LoadingOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="rounded-2xl border border-base-300 bg-base-100 px-6 py-5 shadow-2xl"
            initial={{ y: 10, opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
          >
            <LoadingSpinner />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default LoadingOverlay;
