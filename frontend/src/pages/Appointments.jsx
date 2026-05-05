import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import AppointmentCalendar from '../components/AppointmentCalendar.jsx';
import AppointmentCard from '../components/AppointmentCard.jsx';
import { getAppointmentsRequest } from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';

const VIEW_LABELS = {
  month: 'شهر',
  week: 'أسبوع',
  day: 'يوم',
};

export default function Appointments() {
  const navigate = useNavigate();
  const selectedClinic = useAuthStore((s) => s.selectedClinic);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);

  const [view, setView] = useState('month');
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  const clinicId = selectedClinic?.id;

  useEffect(() => {
    async function loadAppointments() {
      if (!clinicId) return;
      setGlobalLoading(true);
      setError(null);
      try {
        const data = await getAppointmentsRequest({ clinicId });
        setAppointments(data.appointments || []);
      } catch (err) {
        setError(err.response?.data?.message || 'تعذر تحميل المواعيد');
        setAppointments([]);
      } finally {
        setGlobalLoading(false);
      }
    }
    loadAppointments();
  }, [clinicId, setGlobalLoading]);

  const calendarEvents = useMemo(() => (
    appointments.map((item) => ({
      id: item.id,
      title: item.full_name || 'موعد',
      start: new Date(item.appointment_date),
      end: new Date(new Date(item.appointment_date).getTime() + (item.duration_minutes || 30) * 60000),
      status: item.status,
    }))
  ), [appointments]);

  return (
    <AnimatedPage>
      <div className="appts-page">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

          .appts-page {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 24px;
            color: #f1f5f9;
            display: flex;
            flex-direction: column;
            gap: 20px;
            min-height: 100%;
            background-color: #0c0e14;
            background-image:
              linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
            background-size: 36px 36px;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          }

          .appts-page::after {
            content: '';
            position: absolute;
            top: -60px;
            right: -40px;
            width: 260px;
            height: 260px;
            background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
          }

          .appts-page > * { position: relative; z-index: 1; }

          /* ── Header ── */
          .appts-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
          }

          .appts-title {
            font-size: 22px;
            font-weight: 700;
            color: #f1f5f9;
            line-height: 1.2;
          }

          .appts-subtitle {
            font-size: 13px;
            color: rgba(255,255,255,0.38);
            margin-top: 3px;
            font-weight: 400;
          }

          .appts-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          /* ── View toggle ── */
          .view-toggle {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 11px;
            padding: 5px;
            display: flex;
            gap: 4px;
          }

          .view-btn {
            border: none;
            background: transparent;
            color: rgba(255,255,255,0.45);
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          }

          .view-btn:hover {
            color: rgba(255,255,255,0.75);
            background: rgba(255,255,255,0.05);
          }

          .view-btn.active {
            background: linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.12));
            color: #38bdf8;
            border: 1px solid rgba(14,165,233,0.2);
          }

          /* ── Primary button ── */
          .btn-primary {
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
            box-shadow: 0 0 16px rgba(14,165,233,0.25);
            display: flex;
            align-items: center;
            gap: 7px;
          }
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.97); }

          /* ── Error bar ── */
          .appts-error {
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.18);
            color: #f87171;
            padding: 10px 14px;
            border-radius: 11px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          /* ── Layout ── */
          .appts-layout {
            display: grid;
            grid-template-columns: 1.8fr 1fr;
            gap: 16px;
            align-items: start;
          }

          /* ── Panel ── */
          .appts-panel {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 16px;
            overflow: hidden;
          }

          .panel-heading {
            font-size: 13px;
            font-weight: 600;
            color: rgba(255,255,255,0.5);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .panel-heading-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
          }

          /* ── Appointments list ── */
          .appts-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 540px;
            overflow-y: auto;
            scrollbar-width: none;
          }
          .appts-list::-webkit-scrollbar { display: none; }

          /* ── Empty state ── */
          .appts-empty {
            border: 1px dashed rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 24px 16px;
            font-size: 13px;
            color: rgba(255,255,255,0.28);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          /* ── Calendar overrides ── */
          .appts-panel .rbc-calendar {
            background: transparent;
            color: #e2e8f0;
            font-family: 'Cairo', sans-serif;
          }
          .appts-panel .rbc-toolbar button {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.6);
            border-radius: 8px;
            padding: 5px 11px;
            font-family: 'Cairo', sans-serif;
            font-size: 12px;
            transition: all 0.2s;
          }
          .appts-panel .rbc-toolbar button:hover {
            background: rgba(255,255,255,0.08);
            color: #f1f5f9;
          }
          .appts-panel .rbc-toolbar button.rbc-active {
            background: linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.12));
            color: #38bdf8;
            border-color: rgba(14,165,233,0.2);
          }
          .appts-panel .rbc-month-view,
          .appts-panel .rbc-time-view { border-color: rgba(255,255,255,0.07); }
          .appts-panel .rbc-header { border-color: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); font-size: 11px; }
          .appts-panel .rbc-today { background: rgba(56,189,248,0.06); }
          .appts-panel .rbc-off-range-bg { background: rgba(0,0,0,0.15); }
          .appts-panel .rbc-day-bg + .rbc-day-bg,
          .appts-panel .rbc-time-content > * + * > * { border-color: rgba(255,255,255,0.05); }
          .appts-panel .rbc-event { padding: 2px 6px; border-radius: 5px; font-size: 11px; }
          .appts-panel .rbc-date-cell { color: rgba(255,255,255,0.55); font-size: 12px; }

          @media (max-width: 960px) {
            .appts-layout { grid-template-columns: 1fr; }
          }
        `}</style>

        {/* Header */}
        <div className="appts-header">
          <div>
            <div className="appts-title">المواعيد</div>
            <div className="appts-subtitle">إدارة وجدولة مواعيد العيادة</div>
          </div>
          <div className="appts-actions">
            <div className="view-toggle">
              {['month', 'week', 'day'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`view-btn ${view === item ? 'active' : ''}`}
                  onClick={() => setView(item)}
                >
                  {VIEW_LABELS[item]}
                </button>
              ))}
            </div>
            <button type="button" className="btn-primary" onClick={() => navigate('/appointments/new')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              إضافة موعد
            </button>
          </div>
        </div>

        {error && (
          <div className="appts-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Main layout */}
        <div className="appts-layout">
          {/* Calendar panel */}
          <div className="appts-panel">
            <div className="panel-heading">
              <div className="panel-heading-dot" />
              التقويم
            </div>
            <AppointmentCalendar
              events={calendarEvents}
              view={view}
              onView={setView}
              onSelectEvent={(event) => navigate(`/appointments/${event.id}`)}
              onSelectSlot={(slot) => navigate(`/appointments/new?date=${slot.start.toISOString()}`)}
            />
          </div>

          {/* List panel */}
          <div className="appts-panel">
            <div className="panel-heading">
              <div className="panel-heading-dot" />
              المواعيد القادمة
            </div>
            <div className="appts-list">
              {appointments.slice(0, 8).map((item) => (
                <AppointmentCard
                  key={item.id}
                  appointment={item}
                  onOpen={() => navigate(`/appointments/${item.id}`)}
                />
              ))}
              {appointments.length === 0 && (
                <div className="appts-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  لا توجد مواعيد بعد
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}