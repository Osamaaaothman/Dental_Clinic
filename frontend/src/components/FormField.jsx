import { motion } from 'framer-motion';

function FormField({ id, label, error, hint, className = '', ...props }) {
  const hasError = Boolean(error);

  return (
    <div className="form-control">
      <label className="label" htmlFor={id}>
        <span className="label-text font-semibold">{label}</span>
      </label>

      <motion.input
        id={id}
        className={`input input-bordered w-full ${hasError ? 'input-error' : ''} ${className}`}
        whileFocus={{ scale: 1.005 }}
        transition={{ duration: 0.15 }}
        {...props}
      />

      {hint && !hasError ? (
        <label className="label">
          <span className="label-text-alt text-base-content/60">{hint}</span>
        </label>
      ) : null}

      {hasError ? (
        <motion.label
          className="label"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
        >
          <span className="label-text-alt text-error">{error}</span>
        </motion.label>
      ) : null}
    </div>
  );
}

export default FormField;
