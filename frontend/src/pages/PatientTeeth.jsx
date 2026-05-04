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
function getStatus(val) { return STATUS_MAP.get(val) || STATUS_MAP.get('unknown'); }

/* ─── Arabic Tooth Names (FDI) ───────────────────────────────────────────── */
// Full anatomical names in Arabic per tooth number
const ARABIC_TOOTH_NAMES = {
  // Upper right
  11: 'القاطع المركزي\nالعلوي الأيمن',
  12: 'القاطع الجانبي\nالعلوي الأيمن',
  13: 'الناب العلوي الأيمن',
  14: 'الضاحك الأول\nالعلوي الأيمن',
  15: 'الضاحك الثاني\nالعلوي الأيمن',
  16: 'الطاحن الأول\nالعلوي الأيمن',
  17: 'الطاحن الثاني\nالعلوي الأيمن',
  18: 'ضرس العقل\nالعلوي الأيمن',
  // Upper left
  21: 'القاطع المركزي\nالعلوي الأيسر',
  22: 'القاطع الجانبي\nالعلوي الأيسر',
  23: 'الناب العلوي الأيسر',
  24: 'الضاحك الأول\nالعلوي الأيسر',
  25: 'الضاحك الثاني\nالعلوي الأيسر',
  26: 'الطاحن الأول\nالعلوي الأيسر',
  27: 'الطاحن الثاني\nالعلوي الأيسر',
  28: 'ضرس العقل\nالعلوي الأيسر',
  // Lower left
  31: 'القاطع المركزي\nالسفلي الأيسر',
  32: 'القاطع الجانبي\nالسفلي الأيسر',
  33: 'الناب السفلي الأيسر',
  34: 'الضاحك الأول\nالسفلي الأيسر',
  35: 'الضاحك الثاني\nالسفلي الأيسر',
  36: 'الطاحن الأول\nالسفلي الأيسر',
  37: 'الطاحن الثاني\nالسفلي الأيسر',
  38: 'ضرس العقل\nالسفلي الأيسر',
  // Lower right
  41: 'القاطع المركزي\nالسفلي الأيمن',
  42: 'القاطع الجانبي\nالسفلي الأيمن',
  43: 'الناب السفلي الأيمن',
  44: 'الضاحك الأول\nالسفلي الأيمن',
  45: 'الضاحك الثاني\nالسفلي الأيمن',
  46: 'الطاحن الأول\nالسفلي الأيمن',
  47: 'الطاحن الثاني\nالسفلي الأيمن',
  48: 'ضرس العقل\nالسفلي الأيمن',
};

// Short name shown in tooltip title
const ARABIC_TOOTH_SHORT = {
  11: 'القاطع المركزي العلوي الأيمن',
  12: 'القاطع الجانبي العلوي الأيمن',
  13: 'الناب العلوي الأيمن',
  14: 'الضاحك الأول العلوي الأيمن',
  15: 'الضاحك الثاني العلوي الأيمن',
  16: 'الطاحن الأول العلوي الأيمن',
  17: 'الطاحن الثاني العلوي الأيمن',
  18: 'ضرس العقل العلوي الأيمن',
  21: 'القاطع المركزي العلوي الأيسر',
  22: 'القاطع الجانبي العلوي الأيسر',
  23: 'الناب العلوي الأيسر',
  24: 'الضاحك الأول العلوي الأيسر',
  25: 'الضاحك الثاني العلوي الأيسر',
  26: 'الطاحن الأول العلوي الأيسر',
  27: 'الطاحن الثاني العلوي الأيسر',
  28: 'ضرس العقل العلوي الأيسر',
  31: 'القاطع المركزي السفلي الأيسر',
  32: 'القاطع الجانبي السفلي الأيسر',
  33: 'الناب السفلي الأيسر',
  34: 'الضاحك الأول السفلي الأيسر',
  35: 'الضاحك الثاني السفلي الأيسر',
  36: 'الطاحن الأول السفلي الأيسر',
  37: 'الطاحن الثاني السفلي الأيسر',
  38: 'ضرس العقل السفلي الأيسر',
  41: 'القاطع المركزي السفلي الأيمن',
  42: 'القاطع الجانبي السفلي الأيمن',
  43: 'الناب السفلي الأيمن',
  44: 'الضاحك الأول السفلي الأيمن',
  45: 'الضاحك الثاني السفلي الأيمن',
  46: 'الطاحن الأول السفلي الأيمن',
  47: 'الطاحن الثاني السفلي الأيمن',
  48: 'ضرس العقل السفلي الأيمن',
};

/* ─── Tooth SVG Paths ─────────────────────────────────────────────────────── */
// Improved anatomical silhouettes — viewBox 0 0 20 34
const TOOTH_PATHS = {
  incisor: {
    crown: 'M4 2 Q10 0.5 16 2 Q17.5 3.5 17 8 Q16.5 12 10 13.5 Q3.5 12 3 8 Q2.5 3.5 4 2Z',
    root:  'M7.5 13 Q7 20 7 27 Q7 29 8.5 29.5 Q10 29.5 10 27 Q10 20 10 13Z M10 13 Q10 20 10 27 Q10 29 11.5 29.5 Q13 29.5 12.5 27 Q12 20 12.5 13Z',
    shine: 'M6 4 Q9 3 13 4.5',
  },
  canine: {
    crown: 'M4 2.5 Q10 0.5 16 2.5 Q18 4.5 17 9 Q15 14 10 16 Q5 14 3 9 Q2 4.5 4 2.5Z',
    root:  'M8.5 15.5 Q8 24 8 30 Q8 32 10 32 Q12 32 12 30 Q12 24 11.5 15.5Z',
    shine: 'M6 4.5 Q9 3.5 13 5',
  },
  premolar: {
    crown: 'M3.5 3 Q10 1 16.5 3 Q18 5 17.5 10 Q17 14 10 15.5 Q3 14 2.5 10 Q2 5 3.5 3Z',
    grooves: 'M9 7 Q10 5.5 11 7 M10 5.5 L10 11',
    root:  'M6.5 15 Q6 22 5.5 28 Q5.5 30 7 30.5 Q8.5 30.5 8.5 28 Q8.5 22 8.5 15Z M13.5 15 Q14 22 14.5 28 Q14.5 30 13 30.5 Q11.5 30.5 11.5 28 Q11.5 22 11.5 15Z',
    shine: 'M5 5 Q8 3.5 12 5',
  },
  molar: {
    crown: 'M2.5 3.5 Q10 1 17.5 3.5 Q19.5 6 19 11.5 Q18 16 10 17.5 Q2 16 1 11.5 Q0.5 6 2.5 3.5Z',
    grooves: 'M8 8.5 Q10 6.5 12 8.5 M6.5 11 Q8.5 9.5 10 11 Q11.5 9.5 13.5 11 M10 6.5 L10 13',
    root:  'M4.5 17 Q4 22 3.5 27.5 Q3.5 30 5.5 30 Q7.5 30 7.5 27.5 Q7.5 22 7 17Z M10 17 Q10 23 10 28 Q10 30 10 30 Q10 30 10 28 Q10 23 10 17Z M15.5 17 Q16 22 16.5 27.5 Q16.5 30 14.5 30 Q12.5 30 12.5 27.5 Q12.5 22 13 17Z',
    shine: 'M4 6 Q7 4 12 5.5',
  },
};

function toothType(num) {
  const n = num % 10 || 10;
  if (n === 1 || n === 2) return 'incisor';
  if (n === 3) return 'canine';
  if (n === 4 || n === 5) return 'premolar';
  return 'molar';
}

/* ─── Single Tooth Component ─────────────────────────────────────────────── */
function ToothSVG({ toothNum, status, isUpper, isSelected, isHovered, onClick, onHover, onLeave }) {
  const s = getStatus(status);
  const type = toothType(toothNum);
  const paths = TOOTH_PATHS[type];
  const isMissing = status === 'missing';

  const flipY = isUpper ? 1 : -1;
  const flipTranslate = isUpper ? 0 : -34;

  return (
    <g
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      className="tooth-group"
    >
      {/* Hover / selected glow ring */}
      {(isSelected || isHovered) && !isMissing && (
        <ellipse
          cx="10" cy="17" rx="11.5" ry="18"
          fill={isSelected ? s.color + '15' : 'transparent'}
          stroke={s.color}
          strokeWidth={isSelected ? 1.5 : 1}
          strokeDasharray={isSelected ? '3 2' : 'none'}
          opacity={isSelected ? 0.9 : 0.5}
        />
      )}

      <g transform={`scale(1,${flipY}) translate(0,${flipTranslate})`}>
        {isMissing ? (
          <>
            <ellipse cx="10" cy="11" rx="8.5" ry="9" fill="rgba(55,65,81,0.15)" stroke="#374151" strokeWidth="1" strokeDasharray="2.5 2" />
            <line x1="6" y1="7" x2="14" y2="15" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="7" x2="6" y2="15" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Root shadow */}
            <path d={paths.root} fill={`${s.color}20`} stroke={`${s.color}45`} strokeWidth="0.7" strokeLinecap="round" />
            {/* Crown fill with gradient simulation */}
            <path
              d={paths.crown}
              fill={isSelected ? s.color : `${s.color}dd`}
              stroke={s.color}
              strokeWidth={isSelected ? 1.5 : 0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Anatomical grooves (premolar/molar only) */}
            {paths.grooves && (
              <path
                d={paths.grooves}
                fill="none"
                stroke={isSelected ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)'}
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Shine highlight */}
            <path
              d={paths.shine}
              fill="none"
              stroke="rgba(255,255,255,0.40)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
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
  const [activeTab, setActiveTab] = useState('teeth');

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

  // FDI layout
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft  = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerLeft  = [31, 32, 33, 34, 35, 36, 37, 38];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];

  // Increased cell size for more breathing room
  const CELL_W = 44;
  const CELL_H = 58;
  const TOOTH_W = 20;

  function renderRow(nums, isUpper) {
    return nums.map((num, idx) => {
      const tooth = teethByNumber.get(num);
      const cx = idx * CELL_W + CELL_W / 2;
      const isSelected = selectedTooth?.tooth_number === num;
      const isHov = hoveredTooth?.tooth_number === num;
      const s = getStatus(tooth?.status);

      return (
        <g key={num} transform={`translate(${cx - TOOTH_W / 2}, 0)`}>
          <ToothSVG
            toothNum={num}
            status={tooth?.status || 'unknown'}
            isUpper={isUpper}
            isSelected={isSelected}
            isHovered={isHov}
            onClick={() => tooth && openModal(tooth)}
            onHover={(e) => {
              if (!tooth || !chartRef.current) return;
              const r = chartRef.current.getBoundingClientRect();
              setHoverPos({
                x: Math.min(e.clientX - r.left + 16, r.width - 210),
                y: Math.max(e.clientY - r.top - 10, 8),
              });
              setHoveredTooth(tooth);
            }}
            onLeave={() => setHoveredTooth(null)}
          />
          {/* Tooth number badge */}
          <text
            x={TOOTH_W / 2}
            y={isUpper ? CELL_H - 6 : -6}
            textAnchor="middle"
            fill={isSelected ? s.color : isHov ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)'}
            fontSize="8"
            fontFamily="Cairo, sans-serif"
            fontWeight={isSelected ? '700' : '500'}
          >
            {num}
          </text>
        </g>
      );
    });
  }

  const quadW = 8 * CELL_W;
  const GAP = 20;
  const fullW = quadW * 2 + GAP;

  // Heights for upper/lower section
  const UPPER_H = CELL_H;
  const MID_H   = 48;
  const LOWER_H = CELL_H;
  const totalH  = UPPER_H + MID_H + LOWER_H;

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

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

        .pt-title { font-size: 18px; font-weight: 700; color: #f1f5f9; }
        .pt-sub   { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 2px; }

        .pt-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.09); border-radius: 10px;
          padding: 7px 14px; font-size: 13px; font-weight: 500;
          font-family: 'Cairo', sans-serif; cursor: pointer; transition: all 0.2s;
        }
        .pt-btn-ghost:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }

        .pt-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1); color: white;
          border: none; border-radius: 10px; padding: 8px 18px;
          font-size: 13px; font-weight: 600; font-family: 'Cairo', sans-serif;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 0 16px rgba(14,165,233,0.2);
        }
        .pt-btn-primary:hover { opacity: 0.88; }
        .pt-btn-primary:active { transform: scale(0.97); }

        /* Arch chart */
        .pt-arch-wrap {
          background: #0a0c12;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 16px 12px 12px;
          margin-top: 16px;
          position: relative;
          overflow: hidden;
        }

        /* Hover tooltip */
        .pt-tooltip {
          position: absolute;
          background: #1a1d28;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 12px 16px;
          pointer-events: none;
          z-index: 20;
          min-width: 180px;
          max-width: 220px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          transition: opacity 0.1s;
        }
        .pt-tooltip-num {
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35);
          margin-bottom: 3px; letter-spacing: 0.06em;
        }
        .pt-tooltip-name {
          font-size: 13px; font-weight: 700; color: #f1f5f9; margin-bottom: 6px; line-height: 1.4;
        }
        .pt-tooltip-status { font-size: 12px; display: flex; align-items: center; gap: 6px; }
        .pt-tooltip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .pt-tooltip-notes {
          font-size: 11px; color: rgba(255,255,255,0.35);
          margin-top: 6px; line-height: 1.55;
          border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;
        }

        /* Legend */
        .pt-legend {
          display: flex; flex-wrap: wrap; gap: 7px; margin-top: 16px;
        }
        .pt-legend-item {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 4px 10px; font-size: 11px;
          color: rgba(255,255,255,0.50); cursor: pointer; transition: all 0.15s;
        }
        .pt-legend-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); }
        .pt-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* Stats */
        .pt-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;
        }
        .pt-stat {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px 10px; text-align: center;
          transition: border-color 0.2s;
        }
        .pt-stat:hover { border-color: rgba(255,255,255,0.12); }
        .pt-stat-val { font-size: 22px; font-weight: 800; color: #f1f5f9; line-height: 1; }
        .pt-stat-lbl { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 4px; }

        /* Patient info */
        .pt-info-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;
        }
        .pt-info-row:last-child { border-bottom: none; }
        .pt-info-lbl { color: rgba(255,255,255,0.35); }
        .pt-info-val { color: #f1f5f9; font-weight: 500; }

        /* Modal */
        .pt-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px); z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .pt-modal {
          background: #13161f; border: 1px solid rgba(255,255,255,0.09);
          border-radius: 18px; padding: 28px; width: 100%; max-width: 440px;
          position: relative; box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        }
        .pt-modal-title { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
        .pt-modal-subtitle { font-size: 12px; color: rgba(255,255,255,0.35); margin-bottom: 20px; line-height: 1.4; }

        .pt-field-label {
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.4);
          margin-bottom: 8px; display: block;
        }
        .pt-status-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 16px;
        }
        .pt-status-opt {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 9px 12px; cursor: pointer; transition: all 0.15s;
          font-size: 13px; font-family: 'Cairo', sans-serif;
          color: rgba(255,255,255,0.55); text-align: right;
        }
        .pt-status-opt:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
        .pt-status-opt.selected { border-width: 1.5px; color: white; font-weight: 600; }

        .pt-textarea {
          background: #1a1d28; border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px; padding: 10px 14px; color: #f1f5f9;
          font-size: 13px; font-family: 'Cairo', sans-serif; direction: rtl;
          width: 100%; min-height: 80px; resize: vertical; outline: none;
          transition: border-color 0.2s;
        }
        .pt-textarea::placeholder { color: rgba(255,255,255,0.22); }
        .pt-textarea:focus { border-color: rgba(14,165,233,0.4); }
        .pt-modal-actions { display: flex; gap: 10px; justify-content: flex-start; margin-top: 20px; }

        /* Grid */
        .pt-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: start; }
        @media (max-width: 900px) {
          .pt-grid { grid-template-columns: 1fr; }
          .pt-stats { grid-template-columns: repeat(2, 1fr); }
        }

        .pt-arch-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
          color: rgba(255,255,255,0.18); text-transform: uppercase;
        }
        .pt-header-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
        }
        .pt-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .pt-tab {
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pt-tab.active {
          background: linear-gradient(135deg, rgba(14,165,233,0.16), rgba(99,102,241,0.12));
          color: #38bdf8;
          border-color: rgba(14,165,233,0.2);
        }
        .pt-tab:hover {
          color: rgba(255,255,255,0.8);
          border-color: rgba(255,255,255,0.12);
        }
        .pt-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pt-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1); color: white;
          border: none; border-radius: 10px; padding: 8px 18px;
          font-size: 13px; font-weight: 600; font-family: 'Cairo', sans-serif;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 0 16px rgba(14,165,233,0.2);
        }
        .pt-btn-primary:hover { opacity: 0.88; }
        .pt-btn-primary:active { transform: scale(0.97); }
        .pt-badge {
          display: inline-flex; align-items: center; padding: 4px 12px;
          border-radius: 8px; font-size: 11px; font-weight: 600;
          font-family: 'Cairo', sans-serif;
          background: rgba(14,165,233,0.1); color: #38bdf8;
          border: 1px solid rgba(14,165,233,0.2);
        }

        /* Tooth hover transition */
        .tooth-group { transition: transform 0.12s; }
        .tooth-group:hover { transform: translateY(-1px); }

        /* Arch section dividers */
        .pt-arch-section-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.2); text-transform: uppercase; text-align: center;
        }

        /* Quadrant label pills */
        .pt-quad-pill {
          font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
          color: rgba(255,255,255,0.15); text-transform: uppercase;
        }

        /* Selected tooth side card */
        .pt-selected-card {
          border-radius: 14px; padding: 16px;
          background: #13161f; border: 1px solid rgba(255,255,255,0.07);
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

        <div className="pt-tabs">
          <button
            type="button"
            className={`pt-tab${activeTab === 'info' ? ' active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            بيانات المريض
          </button>
          <button
            type="button"
            className={`pt-tab${activeTab === 'teeth' ? ' active' : ''}`}
            onClick={() => setActiveTab('teeth')}
          >
            خريطة الأسنان
          </button>
          <button
            type="button"
            className={`pt-tab${activeTab === 'sessions' ? ' active' : ''}`}
            onClick={() => navigate(`/patients/${id}/sessions`)}
          >
            الجلسات
          </button>
          <button
            type="button"
            className={`pt-tab${activeTab === 'attachments' ? ' active' : ''}`}
            onClick={() => setActiveTab('attachments')}
          >
            المرفقات
          </button>
        </div>

        {pageError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', color: '#f87171', marginBottom: 16, fontSize: 13 }}>
            {pageError}
          </div>
        )}

        {activeTab === 'teeth' && (
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
                <div className="pt-stat-val" style={{ color: '#a855f7' }}>{(stats.crown || 0) + (stats.treated || 0)}</div>
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
                  <div className="pt-tooltip-name">{ARABIC_TOOTH_SHORT[hoveredTooth.tooth_number]}</div>
                  <div className="pt-tooltip-status">
                    <span className="pt-tooltip-dot" style={{ background: getStatus(hoveredTooth.status).color }} />
                    <span style={{ color: getStatus(hoveredTooth.status).color, fontSize: 12 }}>
                      {getStatus(hoveredTooth.status).label}
                    </span>
                  </div>
                  {hoveredTooth.notes && (
                    <div className="pt-tooltip-notes">{hoveredTooth.notes}</div>
                  )}
                </div>
              )}

              {/* Labels row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="pt-arch-label">الفك العلوي ↑</span>
                <span className="pt-arch-label" style={{ color: 'rgba(255,255,255,0.12)' }}>اضغط على سن للتعديل</span>
                <span className="pt-arch-label">الفك العلوي ↑</span>
              </div>

              {/* Main SVG Chart */}
              <svg
                viewBox={`0 0 ${fullW} ${totalH + 20}`}
                style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              >
                {/* Upper arch background */}
                <path
                  d={`M8 ${UPPER_H - 4} Q${fullW/2} ${-8} ${fullW-8} ${UPPER_H - 4}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1.5"
                />
                {/* Lower arch background */}
                <path
                  d={`M8 ${UPPER_H + MID_H + 4} Q${fullW/2} ${totalH + 28} ${fullW-8} ${UPPER_H + MID_H + 4}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1.5"
                />

                {/* Center vertical divider */}
                <line
                  x1={fullW / 2} y1="0"
                  x2={fullW / 2} y2={totalH + 20}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Horizontal arch divider */}
                <line
                  x1="8" y1={UPPER_H + MID_H / 2}
                  x2={fullW - 8} y2={UPPER_H + MID_H / 2}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />

                {/* Midline text */}
                <text
                  x={fullW / 2} y={UPPER_H + MID_H / 2 + 5}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.1)"
                  fontSize="9"
                  fontFamily="Cairo, sans-serif"
                >
                  خط الوسط
                </text>

                {/* Quadrant labels */}
                <text x="6" y="12" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="Cairo, sans-serif" fontWeight="700">UR</text>
                <text x={fullW - 6} y="12" textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="Cairo, sans-serif" fontWeight="700">UL</text>
                <text x="6" y={totalH + 18} fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="Cairo, sans-serif" fontWeight="700">LR</text>
                <text x={fullW - 6} y={totalH + 18} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="Cairo, sans-serif" fontWeight="700">LL</text>

                {/* ─ Upper Right (Q1: 11–18) ─ */}
                <g transform="translate(0, 8)">
                  {renderRow(upperRight, true)}
                </g>

                {/* ─ Upper Left (Q2: 21–28) ─ */}
                <g transform={`translate(${quadW + GAP}, 8)`}>
                  {renderRow(upperLeft, true)}
                </g>

                {/* ─ Lower Right (Q4: 41–48) ─ */}
                <g transform={`translate(0, ${UPPER_H + MID_H})`}>
                  {renderRow(lowerRight, false)}
                </g>

                {/* ─ Lower Left (Q3: 31–38) ─ */}
                <g transform={`translate(${quadW + GAP}, ${UPPER_H + MID_H})`}>
                  {renderRow(lowerLeft, false)}
                </g>
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span className="pt-arch-label">↓ الفك السفلي</span>
                <span className="pt-arch-label">↓ الفك السفلي</span>
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

            {/* ── Right: Patient Info + selected ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="pt-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(14,165,233,0.12)',
                  border: '1px solid rgba(14,165,233,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#38bdf8', fontSize: 16, fontWeight: 700, flexShrink: 0,
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
              <button className="pt-btn-ghost" onClick={() => navigate('/patients')} style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
                قائمة المرضى
              </button>
            </div>

            {/* Selected tooth info card */}
            {selectedTooth ? (
              <div className="pt-selected-card" style={{ borderColor: getStatus(selectedTooth.status).color + '35' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                  السن المحدد
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: getStatus(selectedTooth.status).color + '18',
                    border: `1px solid ${getStatus(selectedTooth.status).color}45`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: getStatus(selectedTooth.status).color, fontSize: 13, fontWeight: 800,
                  }}>
                    {selectedTooth.tooth_number}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.4, marginBottom: 4 }}>
                      {ARABIC_TOOTH_SHORT[selectedTooth.tooth_number]}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: getStatus(selectedTooth.status).color, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: getStatus(selectedTooth.status).color, fontWeight: 600 }}>
                        {getStatus(selectedTooth.status).label}
                      </span>
                    </div>
                    {selectedTooth.notes && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                        {selectedTooth.notes}
                      </div>
                    )}
                  </div>
                </div>
                <button className="pt-btn-primary" onClick={() => openModal(selectedTooth)} style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  تعديل الحالة
                </button>
              </div>
            ) : (
              <div className="pt-selected-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>🦷</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
                  اضغط على أي سن في الخريطة لعرض تفاصيله وتعديل حالته
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="pt-card">
            <div className="pt-title">بيانات المريض</div>
            <div className="pt-sub" style={{ marginBottom: 16 }}>
              تحديث بيانات المريض الأساسية
            </div>
            <div className="pt-info-row">
              <span className="pt-info-lbl">الاسم</span>
              <span className="pt-info-val">{patient?.full_name || '—'}</span>
            </div>
            <div className="pt-info-row">
              <span className="pt-info-lbl">الهاتف</span>
              <span className="pt-info-val">{patient?.phone || '—'}</span>
            </div>
            <div className="pt-info-row">
              <span className="pt-info-lbl">البريد</span>
              <span className="pt-info-val">{patient?.email || '—'}</span>
            </div>
            <div className="pt-info-row">
              <span className="pt-info-lbl">فصيلة الدم</span>
              <span className="pt-info-val">{patient?.blood_type || '—'}</span>
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="pt-card">
            <div className="pt-title">مرفقات المريض</div>
            <div className="pt-sub" style={{ marginBottom: 16 }}>
              سيتم ربط المرفقات من شاشة المريض والجلسات.
            </div>
            <button className="pt-btn-primary" onClick={() => navigate(`/patients/${id}/sessions/new`)}>
              إضافة جلسة مع مرفقات
            </button>
          </div>
        )}
      </div>

      {/* ── Update Modal ── */}
      {modalOpen && (
        <div className="pt-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="pt-modal">
            <div className="pt-modal-title">
              تحديث السن {selectedTooth?.tooth_number}
            </div>
            <div className="pt-modal-subtitle">
              {ARABIC_TOOTH_SHORT[selectedTooth?.tooth_number]}
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
                <button type="submit" className="pt-btn-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  حفظ
                </button>
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
