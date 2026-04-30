import { motion } from 'framer-motion';
import { cardHover, riseItem } from '../lib/animations.js';
import AnimatedButton from './AnimatedButton.jsx';

function ClinicCard({ clinic, index, isLoading, onSelect }) {
  return (
    <motion.article
      variants={riseItem}
      initial="initial"
      animate="animate"
      className="glass-card"
      whileHover="hover"
    >
      <motion.div variants={cardHover} initial="rest" whileHover="hover" className="card-body p-4 sm:p-6">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="card-title text-base font-bold text-neutral sm:text-lg">{clinic.name}</h2>
          <span className="badge badge-primary">عيادة {index + 1}</span>
        </div>

        <p className="text-sm text-base-content/70">{clinic.location || 'لم يتم تحديد الموقع بعد'}</p>

        <div className="divider my-2" />

        <div className="card-actions justify-start">
          <AnimatedButton
            className="btn btn-primary btn-sm w-full sm:w-auto"
            type="button"
            onClick={() => onSelect(clinic.id)}
            disabled={isLoading}
          >
            {isLoading ? 'جار الدخول...' : 'الدخول لهذه العيادة'}
          </AnimatedButton>
        </div>
      </motion.div>
    </motion.article>
  );
}

export default ClinicCard;
