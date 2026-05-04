import { useMemo } from 'react';

const STATUS_OPTIONS = [
  { value: 'unknown', label: 'غير معروف', color: '#64748b' },
  { value: 'healthy', label: 'سليم', color: '#22c55e' },
  { value: 'cavity', label: 'تسوس', color: '#ef4444' },
  { value: 'treated', label: 'حشوة', color: '#f97316' },
  { value: 'crown', label: 'تاج', color: '#a855f7' },
  { value: 'implant', label: 'زرعة', color: '#eab308' },
  { value: 'root_canal', label: 'عصب', color: '#3b82f6' },
  { value: 'missing', label: 'مفقود', color: '#374151' },
];

const STATUS_MAP = new Map(STATUS_OPTIONS.map((s) => [s.value, s]));
function getStatus(value) {
  return STATUS_MAP.get(value) || STATUS_MAP.get('unknown');
}

const TOOTH_PATHS = {
  incisor: {
    crown: 'M4 2 Q10 0.5 16 2 Q17.5 3.5 17 8 Q16.5 12 10 13.5 Q3.5 12 3 8 Q2.5 3.5 4 2Z',
    root: 'M7.5 13 Q7 20 7 27 Q7 29 8.5 29.5 Q10 29.5 10 27 Q10 20 10 13Z M10 13 Q10 20 10 27 Q10 29 11.5 29.5 Q13 29.5 12.5 27 Q12 20 12.5 13Z',
    shine: 'M6 4 Q9 3 13 4.5',
  },
  canine: {
    crown: 'M4 2.5 Q10 0.5 16 2.5 Q18 4.5 17 9 Q15 14 10 16 Q5 14 3 9 Q2 4.5 4 2.5Z',
    root: 'M8.5 15.5 Q8 24 8 30 Q8 32 10 32 Q12 32 12 30 Q12 24 11.5 15.5Z',
    shine: 'M6 4.5 Q9 3.5 13 5',
  },
  premolar: {
    crown: 'M3.5 3 Q10 1 16.5 3 Q18 5 17.5 10 Q17 14 10 15.5 Q3 14 2.5 10 Q2 5 3.5 3Z',
    grooves: 'M9 7 Q10 5.5 11 7 M10 5.5 L10 11',
    root: 'M6.5 15 Q6 22 5.5 28 Q5.5 30 7 30.5 Q8.5 30.5 8.5 28 Q8.5 22 8.5 15Z M13.5 15 Q14 22 14.5 28 Q14.5 30 13 30.5 Q11.5 30.5 11.5 28 Q11.5 22 11.5 15Z',
    shine: 'M5 5 Q8 3.5 12 5',
  },
  molar: {
    crown: 'M2.5 3.5 Q10 1 17.5 3.5 Q19.5 6 19 11.5 Q18 16 10 17.5 Q2 16 1 11.5 Q0.5 6 2.5 3.5Z',
    grooves: 'M8 8.5 Q10 6.5 12 8.5 M6.5 11 Q8.5 9.5 10 11 Q11.5 9.5 13.5 11 M10 6.5 L10 13',
    root: 'M4.5 17 Q4 22 3.5 27.5 Q3.5 30 5.5 30 Q7.5 30 7.5 27.5 Q7.5 22 7 17Z M10 17 Q10 23 10 28 Q10 30 10 30 Q10 30 10 28 Q10 23 10 17Z M15.5 17 Q16 22 16.5 27.5 Q16.5 30 14.5 30 Q12.5 30 12.5 27.5 Q12.5 22 13 17Z',
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

const FDI_LAYOUT = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
};

function ToothSVG({ toothNum, status, isUpper, selected, onClick }) {
  const s = getStatus(status);
  const type = toothType(toothNum);
  const paths = TOOTH_PATHS[type];
  const isMissing = status === 'missing';
  const flipY = isUpper ? 1 : -1;
  const flipTranslate = isUpper ? 0 : -34;

  return (
    <g role="button" tabIndex={0} onClick={onClick} style={{ cursor: 'pointer' }}>
      {selected && !isMissing && (
        <ellipse
          cx="10"
          cy="17"
          rx="11.5"
          ry="18"
          fill={`${s.color}18`}
          stroke={s.color}
          strokeWidth="1.3"
          strokeDasharray="3 2"
          opacity="0.9"
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
            <path d={paths.root} fill={`${s.color}20`} stroke={`${s.color}45`} strokeWidth="0.7" strokeLinecap="round" />
            <path
              d={paths.crown}
              fill={selected ? s.color : `${s.color}dd`}
              stroke={s.color}
              strokeWidth={selected ? 1.5 : 0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {paths.grooves && (
              <path
                d={paths.grooves}
                fill="none"
                stroke={selected ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)'}
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <path d={paths.shine} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round" />
          </>
        )}
      </g>
    </g>
  );
}

export default function MultiSelectTeethChart({
  teeth,
  selectedNumbers,
  onToggle,
  onFocus,
}) {
  const teethByNumber = useMemo(() => {
    const map = new Map();
    (teeth || []).forEach((t) => map.set(t.tooth_number, t));
    return map;
  }, [teeth]);

  const selectedSet = useMemo(() => new Set(selectedNumbers || []), [selectedNumbers]);

  const CELL_W = 40;
  const CELL_H = 56;
  const TOOTH_W = 20;

  const quadW = 8 * CELL_W;
  const GAP = 18;
  const fullW = quadW * 2 + GAP;
  const UPPER_H = CELL_H;
  const MID_H = 44;
  const LOWER_H = CELL_H;
  const totalH = UPPER_H + MID_H + LOWER_H;

  function renderRow(nums, isUpper) {
    return nums.map((num, idx) => {
      const tooth = teethByNumber.get(num);
      const cx = idx * CELL_W + CELL_W / 2;
      const isSelected = selectedSet.has(num);
      const status = tooth?.status || 'unknown';
      return (
        <g key={num} transform={`translate(${cx - TOOTH_W / 2}, 0)`}>
          <ToothSVG
            toothNum={num}
            status={status}
            isUpper={isUpper}
            selected={isSelected}
            onClick={() => {
              onToggle?.(num);
              onFocus?.(tooth || { tooth_number: num, status });
            }}
          />
          <text
            x={TOOTH_W / 2}
            y={isUpper ? CELL_H - 6 : -6}
            textAnchor="middle"
            fill={isSelected ? getStatus(status).color : 'rgba(255,255,255,0.22)'}
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

  return (
    <div className="ms-teeth">
      <style>{`
        .ms-teeth {
          background: #0a0c12;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 16px 12px;
          position: relative;
          overflow: hidden;
        }
        .ms-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .ms-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.18);
          text-transform: uppercase;
        }
        .ms-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 14px;
        }
        .ms-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 11px;
          color: rgba(255,255,255,0.55);
        }
        .ms-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
      `}</style>

      <div className="ms-labels">
        <span className="ms-label">الفك العلوي ↑</span>
        <span className="ms-label">اضغط للتحديد</span>
        <span className="ms-label">الفك العلوي ↑</span>
      </div>

      <svg viewBox={`0 0 ${fullW} ${totalH + 20}`} style={{ width: '100%', height: 'auto' }}>
        <line
          x1={fullW / 2}
          y1="0"
          x2={fullW / 2}
          y2={totalH + 20}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1="8"
          y1={UPPER_H + MID_H / 2}
          x2={fullW - 8}
          y2={UPPER_H + MID_H / 2}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />

        <g transform="translate(0, 8)">
          {renderRow(FDI_LAYOUT.upperRight, true)}
        </g>
        <g transform={`translate(${quadW + GAP}, 8)`}>
          {renderRow(FDI_LAYOUT.upperLeft, true)}
        </g>
        <g transform={`translate(0, ${UPPER_H + MID_H})`}>
          {renderRow(FDI_LAYOUT.lowerRight, false)}
        </g>
        <g transform={`translate(${quadW + GAP}, ${UPPER_H + MID_H})`}>
          {renderRow(FDI_LAYOUT.lowerLeft, false)}
        </g>
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span className="ms-label">↓ الفك السفلي</span>
        <span className="ms-label">↓ الفك السفلي</span>
      </div>

      <div className="ms-legend">
        {STATUS_OPTIONS.map((s) => (
          <div key={s.value} className="ms-legend-item">
            <span className="ms-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
