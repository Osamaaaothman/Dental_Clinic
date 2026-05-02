import { AnimatePresence, motion } from 'framer-motion';

function LoadingOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              background: '#13161f',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 18,
              padding: '28px 36px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
            initial={{ y: 12, opacity: 0, scale: 0.97 }}
            animate={{ y: 0,  opacity: 1, scale: 1    }}
            exit={{    y: 8,  opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Glow blob */}
            <div style={{
              position: 'absolute',
              top: -50, right: -30,
              width: 160, height: 160,
              background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Spinner */}
            <SpinnerRing />

            {/* Label */}
            <span style={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.04em',
            }}>
              جارٍ التحميل…
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Inline spinner — no external dependency ── */
function SpinnerRing() {
  return (
    <div style={{ position: 'relative', width: 44, height: 44 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600&display=swap');

        @keyframes lo-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes lo-pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1);    }
        }

        .lo-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2.5px solid transparent;
          border-top-color: #0ea5e9;
          border-right-color: #6366f1;
          animation: lo-spin 0.75s linear infinite;
        }

        .lo-ring-inner {
          position: absolute;
          inset: 7px;
          border-radius: 50%;
          border: 1.5px solid transparent;
          border-top-color: rgba(14,165,233,0.35);
          animation: lo-spin 1.2s linear infinite reverse;
        }

        .lo-dot {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
        }

        .lo-dot::after {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          box-shadow: 0 0 8px rgba(14,165,233,0.6);
          animation: lo-pulse 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="lo-ring" />
      <div className="lo-ring-inner" />
      <div className="lo-dot" />
    </div>
  );
}

export default LoadingOverlay;