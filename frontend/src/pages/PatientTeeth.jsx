import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import {
  getPatientRequest,
  getPatientTeethRequest,
  updateToothStatusRequest,
} from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';

/* ─── Constants ───────────────────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: 'unknown',    label: 'غير معروف', color: '#64748b', glow: 'rgba(100,116,139,0.4)' },
  { value: 'healthy',   label: 'سليم',       color: '#22c55e', glow: 'rgba(34,197,94,0.4)'   },
  { value: 'cavity',    label: 'تسوس',       color: '#ef4444', glow: 'rgba(239,68,68,0.4)'   },
  { value: 'treated',   label: 'حشوة',       color: '#f97316', glow: 'rgba(249,115,22,0.4)'  },
  { value: 'crown',     label: 'تاج',        color: '#a855f7', glow: 'rgba(168,85,247,0.4)'  },
  { value: 'implant',   label: 'زرعة',       color: '#eab308', glow: 'rgba(234,179,8,0.4)'   },
  { value: 'root_canal',label: 'عصب',        color: '#3b82f6', glow: 'rgba(59,130,246,0.4)'  },
  { value: 'missing',   label: 'مفقود',      color: '#374151', glow: 'rgba(55,65,81,0.4)'    },
];

const STATUS_MAP = new Map(STATUS_OPTIONS.map((s) => [s.value, s]));

function getStatus(val) {
  return STATUS_MAP.get(val) || STATUS_MAP.get('unknown');
}

/* ─── Tooth SVG Paths ─────────────────────────────────────────────────────── */
// Each tooth type has a unique anatomical silhouette
// Types: incisor, canine, premolar, molar

const TOOTH_PATHS = {
  // Central/Lateral Incisor — narrow, single root, flat crown
  incisor: {
    crown: 'M6 2 Q10 1 14 2 Q16 3 16 7 Q16 10 10 12 Q4 10 4 7 Q4 3 6 2Z',
    root:  'M8 12 Q10 18 10 26 Q10 28 9 28 Q8 28 8 26 Q8 20 8 12Z M12 12 Q12 20 12 26 Q12 28 11 28 Q10 28 10 26 Q10 18 12 12Z',
  },
  // Canine — pointed cusp, single long root
  canine: {
    crown: 'M5 2 Q10 0 15 2 Q17 4 16 8 Q14 12 10 14 Q6 12 4 8 Q3 4 5 2Z',
    root:  'M9 14 Q10 22 9 30 Q9 32 10 32 Q11 32 11 30 Q10 22 11 14Z',
  },
  // Premolar — two cusps, one or two roots
  premolar: {
    crown: 'M4 3 Q10 1 16 3 Q18 5 17 9 Q16 13 10 14 Q4 13 3 9 Q2 5 4 3Z M8 7 Q10 5 12 7',
    root:  'M7 14 Q7 22 6 28 Q6 30 7 30 Q8 30 8 28 Q8 22 8 14Z M13 14 Q13 22 14 28 Q14 30 13 30 Q12 30 12 28 Q12 22 12 14Z',
  },
  // Molar — wide crown, multiple cusps, multiple roots
  molar: {
    crown: 'M3 4 Q10 1 17 4 Q19 6 18 11 Q17 15 10 16 Q3 15 2 11 Q1 6 3 4Z M6 8 Q8 6 10 8 Q12 6 14 8',
    root:  'M5 16 Q4 22 4 28 Q4 30 5.5 30 Q7 30 7 28 Q7 22 7 16Z M10 16 Q10 22 10 28 Q10 30 10 30 Q10 30 10 28 Q10 22 10 16Z M15 16 Q16 22 16 28 Q16 30 14.5 30 Q13 30 13 28 Q13 22 13 16Z',
  },
};

// Map tooth number to type
function toothType(num) {
  const n = num % 10 || 10;
  if (n === 1 || n === 2) return 'incisor';
  if (n === 3) return 'canine';
  if (n === 4 || n === 5) return 'premolar';
  return 'molar';
}

/* ─── Single Tooth Component ─────────────────────────────────────────────── */
function ToothSVG({ toothNum, status, isUpper, isSelected, onClick, onHover, onLeave }) {
  const s = getStatus(status);
  const type = toothType(toothNum);
  const paths = TOOTH_PATHS[type];
  const isMissing = status === 'missing';

  // Flip lower teeth vertically
  const flip = isUpper ? '' : 'scale(1,-1) translate(0,-32)';

  return (
    <g
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
    >
      {/* Selection ring */}
      {isSelected && (
        <ellipse
          cx="10" cy="16" rx="11" ry="17"
          fill="none"
          stroke={s.color}
          strokeWidth="1.5"
          strokeDasharray="3 2"
          opacity="0.8"
        />
      )}

      <g transform={flip}>
        {isMissing ? (
          /* Missing tooth — X mark */
          <>
            <ellipse cx="10" cy="10" rx="8" ry="8" fill="rgba(55,65,81,0.2)" stroke="#374151" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="6" y1="6" x2="14" y2="14" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="6" x2="6" y2="14" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Root */}
            <path
              d={paths.root}
              fill={`${s.color}28`}
              stroke={`${s.color}60`}
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* Crown body */}
            <path
              d={paths.crown}
              fill={isSelected ? s.color : `${s.color}cc`}
              stroke={s.color}
              strokeWidth={isSelected ? 1.5 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Shine */}
            {!isMissing && (
              <path
                d={type === 'molar'
                  ? 'M5 5 Q8 4 11 5'
                  : 'M6 4 Q9 3 12 4'}
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            )}
          </>
        )}
      </g>
    </g>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
function PatientTeeth() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedClinic = useAuthStore((s) => s.selectedClinic);
  const pushToast = useUiStore((s) => s.pushToast);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);

  const [patient, setPatient] = useState(null);
  const [teeth, setTeeth] = useState([]);
  const [pageError, setPageError] = useState(null);

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [hoveredTooth, setHoveredTooth] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [statusDraft, setStatusDraft] = useState('unknown');
  const [notesDraft, setNotesDraft] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const chartRef = useRef(null);

  const teethByNumber = useMemo(() => {
    const map = new Map();
    for (const t of teeth) map.set(t.tooth_number, t);
    return map;
  }, [teeth]);

  // Stats
  const stats = useMemo(() => {
    const counts = {};
    for (const s of STATUS_OPTIONS) counts[s.value] = 0;
    for (const t of teeth) counts[t.status] = (counts[t.status] || 0) + 1;
    return counts;
  }, [teeth]);

  async function loadData() {
    if (!id) return;
    setPageError(null);
    setGlobalLoading(true);
    try {
      const [pd, td] = await Promise.all([getPatientRequest(id), getPatientTeethRequest(id)]);
      setPatient(pd.patient || null);
      setTeeth(td.teeth || []);
    } catch (err) {
      setPageError(err.response?.data?.message || 'تعذر تحميل بيانات المريض');
    } finally {
      setGlobalLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [id]); // eslint-disable-line

  function openModal(tooth) {
    setSelectedTooth(tooth);
    setStatusDraft(tooth?.status || 'unknown');
    setNotesDraft(tooth?.notes || '');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedTooth(null);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!selectedTooth?.id) return;
    setGlobalLoading(true);
    try {
      const data = await updateToothStatusRequest(selectedTooth.id, {
        status: statusDraft,
        notes: notesDraft,
      });
      const updated = data.tooth;
      setTeeth((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      pushToast({ type: 'success', message: `تم تحديث السن ${updated.tooth_number}` });
      closeModal();
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تحديث حالة السن' });
    } finally {
      setGlobalLoading(false);
    }
  }

  // Tooth layout: FDI notation rows
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft  = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerLeft  = [31, 32, 33, 34, 35, 36, 37, 38];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];

  const CELL_W = 38;
  const CELL_H = 52;
  const TOOTH_W = 20;
  const TOOTH_H = 32;

  function renderRow(nums, isUpper, yOffset) {
    return nums.map((num, idx) => {
      const tooth = teethByNumber.get(num);
      const cx = idx * CELL_W + CELL_W / 2;
      const cy = yOffset;
      const isSelected = selectedTooth?.tooth_number === num;
      const s = getStatus(tooth?.status);

      return (
        <g key={num} transform={`translate(${cx - TOOTH_W / 2}, ${cy})`}>
          {/* Number label */}
          <text
            x={TOOTH_W / 2}
            y={isUpper ? CELL_H + 12 : -6}
            textAnchor="middle"
            fill={isSelected ? s.color : 'rgba(255,255,255,0.3)'}
            fontSize="9"
            fontFamily="Cairo, sans-serif"
            fontWeight={isSelected ? '700' : '400'}
          >
            {num}
          </text>

          <ToothSVG
            toothNum={num}
            status={tooth?.status || 'unknown'}
            isUpper={isUpper}
            isSelected={isSelected}
            onClick={() => tooth && openModal(tooth)}
            onHover={(e) => {
              if (!tooth || !chartRef.current) return;
              const r = chartRef.current.getBoundingClientRect();
              setHoverPos({
                x: Math.min(e.clientX - r.left + 14, r.width - 190),
                y: Math.min(e.clientY - r.top + 14, r.height - 100),
              });
              setHoveredTooth(tooth);
            }}
            onLeave={() => setHoveredTooth(null)}
          />
        </g>
      );
    });
  }

  const chartW = 8 * CELL_W;
  const fullW = chartW * 2 + 24; // two arches + gap

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

        .pt-root {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          min-height: 100vh;
          background: #0c0e14;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 36px 36px;
          padding: 20px 20px 40px;
          box-sizing: border-box;
        }

        .pt-card {
          background: #13161f;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px 24px;
          position: relative;
          overflow: hidden;
        }

        .pt-card::after {
          content: '';
          position: absolute;
          top: -60px; right: -40px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .pt-title {
          font-size: 18px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .pt-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin-top: 2px;
        }

        .pt-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pt-btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
        }

        .pt-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 0 16px rgba(14,165,233,0.2);
        }
        .pt-btn-primary:hover { opacity: 0.88; }
        .pt-btn-primary:active { transform: scale(0.97); }

        /* Arch chart container */
        .pt-arch-wrap {
          background: #0c0e14;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 16px;
          margin-top: 16px;
          position: relative;
          overflow: hidden;
        }

        /* Hover tooltip */
        .pt-tooltip {
          position: absolute;
          background: #1a1d28;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          pointer-events: none;
          z-index: 10;
          min-width: 160px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }

        .pt-tooltip-num {
          font-size: 12px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 4px;
        }

        .pt-tooltip-status {
          font-size: 12px;
          color: rgba(255,255,255,0.55);
        }

        .pt-tooltip-notes {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
          line-height: 1.5;
        }

        /* Legend pills */
        .pt-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .pt-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 11px;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          transition: all 0.15s;
        }
        .pt-legend-item:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
        }

        .pt-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Stats row */
        .pt-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .pt-stat {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 14px;
          text-align: center;
        }

        .pt-stat-val {
          font-size: 22px;
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1;
        }

        .pt-stat-lbl {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
        }

        /* Patient info card */
        .pt-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 13px;
        }
        .pt-info-row:last-child { border-bottom: none; }
        .pt-info-lbl { color: rgba(255,255,255,0.35); }
        .pt-info-val { color: #f1f5f9; font-weight: 500; }

        /* Modal overlay */
        .pt-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .pt-modal {
          background: #13161f;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 18px;
          padding: 28px;
          width: 100%;
          max-width: 420px;
          position: relative;
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        }

        .pt-modal-title {
          font-size: 16px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 20px;
        }

        .pt-field-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          margin-bottom: 8px;
          display: block;
        }

        /* Status option buttons */
        .pt-status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 16px;
        }

        .pt-status-opt {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 9px 12px;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 13px;
          font-family: 'Cairo', sans-serif;
          color: rgba(255,255,255,0.55);
          text-align: right;
        }
        .pt-status-opt:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
        }
        .pt-status-opt.selected {
          border-width: 1.5px;
          color: white;
          font-weight: 600;
        }

        .pt-textarea {
          background: #1a1d28;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 10px 14px;
          color: #f1f5f9;
          font-size: 13px;
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          width: 100%;
          min-height: 80px;
          resize: vertical;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }
        .pt-textarea::placeholder { color: rgba(255,255,255,0.22); }
        .pt-textarea:focus { border-color: rgba(14,165,233,0.4); }

        .pt-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-start;
          margin-top: 20px;
        }

        /* Grid layout */
        .pt-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .pt-grid { grid-template-columns: 1fr; }
          .pt-stats { grid-template-columns: repeat(2, 1fr); }
        }

        /* Section divider label */
        .pt-arch-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.2);
          text-transform: uppercase;
        }

        /* Page header bar */
        .pt-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pt-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Cairo', sans-serif;
          background: rgba(14,165,233,0.1);
          color: #38bdf8;
          border: 1px solid rgba(14,165,233,0.2);
        }
      `}</style>

      <div className="pt-root">
        {/* ── Header ── */}
        <div className="pt-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="pt-btn-ghost" onClick={() => navigate('/patients')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              رجوع
            </button>
            <div>
              <div className="pt-title">خريطة الأسنان</div>
              <div className="pt-sub">{patient?.full_name || '...'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="pt-badge">{selectedClinic?.name || 'بدون عيادة'}</div>
            <button className="pt-btn-ghost" onClick={loadData}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              تحديث
            </button>
          </div>
        </div>

        {pageError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', color: '#f87171', marginBottom: 16, fontSize: 13 }}>
            {pageError}
          </div>
        )}

        <div className="pt-grid">
          {/* ── Left: Teeth Chart ── */}
          <div className="pt-card">
            {/* Quick stats */}
            <div className="pt-stats">
              <div className="pt-stat">
                <div className="pt-stat-val" style={{ color: '#4ade80' }}>{stats.healthy || 0}</div>
                <div className="pt-stat-lbl">سليم</div>
              </div>
              <div className="pt-stat">
                <div className="pt-stat-val" style={{ color: '#ef4444' }}>{stats.cavity || 0}</div>
                <div className="pt-stat-lbl">تسوس</div>
              </div>
              <div className="pt-stat">
                <div className="pt-stat-val" style={{ color: '#a855f7' }}>{stats.crown || 0}</div>
                <div className="pt-stat-lbl">تاج/حشوة</div>
              </div>
              <div className="pt-stat">
                <div className="pt-stat-val" style={{ color: '#64748b' }}>{stats.missing || 0}</div>
                <div className="pt-stat-lbl">مفقود</div>
              </div>
            </div>

            {/* Arch chart */}
            <div className="pt-arch-wrap" ref={chartRef}>

              {/* Hover tooltip */}
              {hoveredTooth && (
                <div className="pt-tooltip" style={{ left: hoverPos.x, top: hoverPos.y }}>
                  <div className="pt-tooltip-num">السن {hoveredTooth.tooth_number}</div>
                  <div className="pt-tooltip-status" style={{ color: getStatus(hoveredTooth.status).color }}>
                    ● {getStatus(hoveredTooth.status).label}
                  </div>
                  {hoveredTooth.notes && (
                    <div className="pt-tooltip-notes">{hoveredTooth.notes}</div>
                  )}
                </div>
              )}

              {/* Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="pt-arch-label">الفك العلوي</span>
                <span className="pt-arch-label">اضغط على سن للتعديل</span>
              </div>

              {/* SVG Arch */}
              <svg
                viewBox={`0 0 ${fullW} ${CELL_H * 2 + 60}`}
                style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              >
                {/* Arch background shapes */}
                <path
                  d={`M12 10 Q${fullW/2} -10 ${fullW - 12} 10 L${fullW - 12} ${CELL_H + 14} Q${fullW/2} ${CELL_H + 30} 12 ${CELL_H + 14} Z`}
                  fill="rgba(255,255,255,0.018)"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <path
                  d={`M12 ${CELL_H + 46} Q${fullW/2} ${CELL_H + 30} ${fullW-12} ${CELL_H + 46} L${fullW-12} ${CELL_H*2 + 50} Q${fullW/2} ${CELL_H*2+66} 12 ${CELL_H*2+50} Z`}
                  fill="rgba(255,255,255,0.018)"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />

                {/* Center line */}
                <line
                  x1={fullW / 2} y1="0"
                  x2={fullW / 2} y2={CELL_H * 2 + 60}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Upper arch — right quadrant */}
                <g transform="translate(0, 10)">
                  {renderRow(upperRight, true, 4)}
                </g>

                {/* Upper arch — left quadrant */}
                <g transform={`translate(${chartW + 24}, 10)`}>
                  {renderRow(upperLeft, true, 4)}
                </g>

                {/* Midline label */}
                <text x={fullW/2} y={CELL_H + 38} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="9" fontFamily="Cairo, sans-serif">
                  خط الوسط
                </text>

                {/* Lower arch — left quadrant */}
                <g transform={`translate(0, ${CELL_H + 50})`}>
                  {renderRow(lowerRight, false, 4)}
                </g>

                {/* Lower arch — right quadrant */}
                <g transform={`translate(${chartW + 24}, ${CELL_H + 50})`}>
                  {renderRow(lowerLeft, false, 4)}
                </g>

                {/* Quadrant labels */}
                <text x="6" y="8" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Cairo, sans-serif">UR</text>
                <text x={fullW - 6} y="8" textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Cairo, sans-serif">UL</text>
                <text x="6" y={CELL_H * 2 + 58} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Cairo, sans-serif">LR</text>
                <text x={fullW - 6} y={CELL_H * 2 + 58} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Cairo, sans-serif">LL</text>
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span className="pt-arch-label">الفك السفلي</span>
              </div>
            </div>

            {/* Legend */}
            <div className="pt-legend">
              {STATUS_OPTIONS.map((s) => (
                <div key={s.value} className="pt-legend-item">
                  <span className="pt-dot" style={{ background: s.color }} />
                  {s.label}
                  {stats[s.value] > 0 && (
                    <span style={{ color: s.color, fontWeight: 700, fontSize: 11 }}>
                      {stats[s.value]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Patient Info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="pt-card">
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(14,165,233,0.12)',
                  border: '1px solid rgba(14,165,233,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#38bdf8', fontSize: 16, fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {patient?.full_name?.charAt(0) || '؟'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                    {patient?.full_name || '...'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>بيانات المريض</div>
                </div>
              </div>

              <div className="pt-info-row">
                <span className="pt-info-lbl">الهاتف</span>
                <span className="pt-info-val">{patient?.phone || '—'}</span>
              </div>
              <div className="pt-info-row">
                <span className="pt-info-lbl">البريد</span>
                <span className="pt-info-val" style={{ fontSize: 12 }}>{patient?.email || '—'}</span>
              </div>

              <button
                className="pt-btn-ghost"
                onClick={() => navigate('/patients')}
                style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
              >
                قائمة المرضى
              </button>
            </div>

            {/* Selected tooth preview */}
            {selectedTooth && (
              <div className="pt-card" style={{ borderColor: getStatus(selectedTooth.status).color + '40' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>السن المحدد</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: getStatus(selectedTooth.status).color + '20',
                    border: `1px solid ${getStatus(selectedTooth.status).color}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: getStatus(selectedTooth.status).color,
                    fontSize: 14, fontWeight: 800,
                  }}>
                    {selectedTooth.tooth_number}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: getStatus(selectedTooth.status).color }}>
                      {getStatus(selectedTooth.status).label}
                    </div>
                    {selectedTooth.notes && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {selectedTooth.notes}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="pt-btn-primary"
                  onClick={() => openModal(selectedTooth)}
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                >
                  تعديل الحالة
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="pt-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="pt-modal">
            <div className="pt-modal-title">
              تحديث السن {selectedTooth?.tooth_number}
            </div>

            <form onSubmit={handleUpdate}>
              <label className="pt-field-label">الحالة</label>
              <div className="pt-status-grid">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`pt-status-opt${statusDraft === s.value ? ' selected' : ''}`}
                    style={statusDraft === s.value ? {
                      borderColor: s.color,
                      background: s.color + '18',
                      color: s.color,
                    } : {}}
                    onClick={() => setStatusDraft(s.value)}
                  >
                    <span className="pt-dot" style={{ background: s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>

              <label className="pt-field-label" style={{ marginTop: 4 }}>ملاحظات</label>
              <textarea
                className="pt-textarea"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="اختياري — أي ملاحظات عن هذا السن"
              />

              <div className="pt-modal-actions">
                <button type="submit" className="pt-btn-primary">حفظ</button>
                <button type="button" className="pt-btn-ghost" onClick={closeModal}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}

export default PatientTeeth;