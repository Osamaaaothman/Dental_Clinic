import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

const STATUS_CONFIG = {
  scheduled: {
    label: 'مجدول',
    bg: 'rgba(14,165,233,0.12)',
    border: 'rgba(14,165,233,0.2)',
    color: '#38bdf8',
    dot: '#38bdf8',
  },
  completed: {
    label: 'مكتمل',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.2)',
    color: '#4ade80',
    dot: '#4ade80',
  },
  cancelled: {
    label: 'ملغي',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.2)',
    color: '#f87171',
    dot: '#f87171',
  },
  no_show: {
    label: 'لم يحضر',
    bg: 'rgba(234,179,8,0.12)',
    border: 'rgba(234,179,8,0.2)',
    color: '#fbbf24',
    dot: '#fbbf24',
  },
};

const TYPE_LABELS = {
  checkup: 'فحص',
  followup: 'متابعة',
  extraction: 'خلع',
  cleaning: 'تنظيف',
  filling: 'حشو',
  root_canal: 'عصب',
  crown: 'تاج',
  implant: 'زرعة',
  other: 'أخرى',
};

export default function AppointmentCard({ appointment, onOpen }) {
  const status = STATUS_CONFIG[appointment?.status] || STATUS_CONFIG.scheduled;

  const dateFormatted = appointment?.appointment_date
    ? format(new Date(appointment.appointment_date), 'eee dd MMM • hh:mm a', { locale: arSA })
    : 'غير محدد';

  const initials = appointment?.full_name
    ? appointment.full_name.trim().charAt(0)
    : '؟';

  return (
    <button type="button" className="appt-card" onClick={onOpen}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');

        .appt-card {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          width: 100%;
          text-align: right;
          background: #13161f;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 12px 14px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        .appt-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(180deg, #0ea5e9, #6366f1);
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: 0 12px 12px 0;
        }

        .appt-card:hover {
          background: #1a1d28;
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }

        .appt-card:hover::before {
          opacity: 1;
        }

        .appt-card:active {
          transform: scale(0.98);
        }

        /* ── Top row ── */
        .appt-card-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ── Avatar ── */
        .appt-card-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(14,165,233,0.12);
          border: 1px solid rgba(14,165,233,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #38bdf8;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* ── Name + date ── */
        .appt-card-info {
          flex: 1;
          min-width: 0;
        }

        .appt-card-name {
          font-size: 13px;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .appt-card-date {
          font-size: 11px;
          color: rgba(255,255,255,0.38);
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── Status badge ── */
        .appt-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Cairo', sans-serif;
          border: 1px solid;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .appt-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Bottom row ── */
        .appt-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .appt-card-type {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          font-weight: 500;
        }

        .appt-card-duration {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
        }
      `}</style>

      {/* Top: avatar + name/date + badge */}
      <div className="appt-card-top">
        <div className="appt-card-avatar">{initials}</div>

        <div className="appt-card-info">
          <div className="appt-card-name">{appointment?.full_name || 'بدون اسم'}</div>
          <div className="appt-card-date">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {dateFormatted}
          </div>
        </div>

        <div
          className="appt-card-badge"
          style={{
            background: status.bg,
            borderColor: status.border,
            color: status.color,
          }}
        >
          <div className="appt-badge-dot" style={{ background: status.dot }} />
          {status.label}
        </div>
      </div>

      {/* Bottom: type + duration */}
      <div className="appt-card-bottom">
        <div className="appt-card-type">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          {TYPE_LABELS[appointment?.type] || 'أخرى'}
        </div>

        <div className="appt-card-duration">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {appointment?.duration_minutes || 30} دقيقة
        </div>
      </div>
    </button>
  );
}