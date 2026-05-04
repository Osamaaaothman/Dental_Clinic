import { useMemo } from 'react';

const STATUS_STYLES = {
  paid: {
    label: 'مدفوع',
    color: '#4ade80',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.2)',
  },
  partial: {
    label: 'جزئي',
    color: '#fbbf24',
    bg: 'rgba(234,179,8,0.12)',
    border: 'rgba(234,179,8,0.2)',
  },
  pending: {
    label: 'غير مدفوع',
    color: '#f87171',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.2)',
  },
};

function formatDate(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('ar-EG');
}

export default function SessionCard({ session, onOpen }) {
  const status = STATUS_STYLES[session.payment_status] || STATUS_STYLES.pending;
  const amountCharged = Number(session.amount_charged) || 0;
  const amountPaid = Number(session.amount_paid) || 0;
  const balance = amountCharged - amountPaid;

  const summary = useMemo(() => {
    return [session.chief_complaint, session.treatment_done]
      .filter(Boolean)
      .join(' · ');
  }, [session.chief_complaint, session.treatment_done]);

  return (
    <div className="session-card">
      <style>{`
        .session-card {
          background: #13161f;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .session-card:hover {
          border-color: rgba(255,255,255,0.12);
          background: #1a1d28;
        }
        .session-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .session-title {
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
        }
        .session-meta {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }
        .session-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid;
        }
        .session-summary {
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          line-height: 1.6;
        }
        .session-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .session-stat {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 10px 8px;
          text-align: center;
        }
        .session-stat .value {
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
        }
        .session-stat .label {
          font-size: 10px;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
        }
        .session-actions {
          display: flex;
          justify-content: flex-start;
        }
        .session-btn {
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 0 16px rgba(14,165,233,0.2);
        }
        .session-btn:hover { opacity: 0.88; }
        .session-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="session-row">
        <div>
          <div className="session-title">جلسة {formatDate(session.session_date)}</div>
          <div className="session-meta">تم الإنشاء: {formatDate(session.created_at)}</div>
        </div>
        <span
          className="session-badge"
          style={{
            color: status.color,
            background: status.bg,
            borderColor: status.border,
          }}
        >
          {status.label}
        </span>
      </div>

      {summary ? <div className="session-summary">{summary}</div> : null}

      <div className="session-stats">
        <div className="session-stat">
          <div className="value">{formatNumber(amountCharged)}</div>
          <div className="label">المبلغ</div>
        </div>
        <div className="session-stat">
          <div className="value">{formatNumber(amountPaid)}</div>
          <div className="label">المدفوع</div>
        </div>
        <div className="session-stat">
          <div className="value">{formatNumber(balance)}</div>
          <div className="label">المتبقي</div>
        </div>
      </div>

      <div className="session-actions">
        <button type="button" className="session-btn" onClick={onOpen}>
          عرض التفاصيل
        </button>
      </div>
    </div>
  );
}
