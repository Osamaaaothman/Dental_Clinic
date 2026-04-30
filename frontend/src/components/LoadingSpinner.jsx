import { motion } from 'framer-motion';

function LoadingSpinner({ label = 'جار التحميل...' }) {
  return (
    <div className="flex items-center gap-3">
      <motion.span
        className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      />
      <span className="text-sm font-semibold text-base-content/80">{label}</span>
    </div>
  );
}

export default LoadingSpinner;
