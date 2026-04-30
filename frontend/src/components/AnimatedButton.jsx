import { motion } from 'framer-motion';

function AnimatedButton({ children, className = '', type = 'button', ...props }) {
  return (
    <motion.button
      type={type}
      className={className}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ y: 0, scale: 0.99 }}
      transition={{ duration: 0.16 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default AnimatedButton;
