import { motion } from 'framer-motion';
import { pageTransition, smoothEase } from '../lib/animations.js';

function AnimatedPage({ children, className = '' }) {
  return (
    <motion.section
      className={className}
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: smoothEase }}
    >
      {children}
    </motion.section>
  );
}

export default AnimatedPage;
