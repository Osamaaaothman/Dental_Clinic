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
      <motion.div variants={cardHover} initial="rest" whileHover="hover" className="card-body">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="card-title text-lg font-bold text-neutral">{clinic.name}</h2>
          <span className="badge badge-primary">عيادة {index + 1}</span>
        </div>

        <p className="text-sm text-base-content/70">{clinic.location || 'لم يتم تحديد الموقع بعد'}</p>

        <div className="divider my-2" />

        <div className="card-actions justify-start">
          <AnimatedButton
            className="btn btn-primary btn-sm"
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
