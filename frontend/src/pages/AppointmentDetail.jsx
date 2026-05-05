import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import {
  deleteAppointmentRequest,
  getAppointmentRequest,
  updateAppointmentRequest,
} from '../api/index.js';
import { useUiStore } from '../store/uiStore.js';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'مجدول' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'no_show', label: 'لم يحضر' },
];

const TYPE_OPTIONS = [
  { value: 'checkup', label: 'فحص' },
  { value: 'followup', label: 'متابعة' },
  { value: 'extraction', label: 'خلع' },
  { value: 'cleaning', label: 'تنظيف' },
  { value: 'filling', label: 'حشو' },
  { value: 'root_canal', label: 'عصب' },
  { value: 'crown', label: 'تاج' },
  { value: 'implant', label: 'زرعة' },
  { value: 'other', label: 'أخرى' },
];

const STATUS_STYLE = {
  scheduled: { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.2)', color: '#38bdf8', label: 'مجدول' },
  completed: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.2)', color: '#4ade80', label: 'مكتمل' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)', color: '#f87171', label: 'ملغي' },
  no_show:   { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.2)',  color: '#fbbf24', label: 'لم يحضر' },
};

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);
  const pushToast = useUiStore((s) => s.pushToast);

  const [appointment, setAppointment] = useState(null);
  const [form, setForm] = useState({
    appointment_date: '',
    duration_minutes: 30,
    type: 'checkup',
    status: 'scheduled',
    doctor_notes: '',
  });

  useEffect(() => {
    async function loadAppointment() {
      if (!id) return;
      setGlobalLoading(true);
      try {
        const data = await getAppointmentRequest(id);
        const item = data.appointment;
        setAppointment(item);
        const iso = item?.appointment_date
          ? new Date(item.appointment_date).toISOString().slice(0, 16)
          : '';
        setForm({
          appointment_date: iso,
          duration_minutes: item?.duration_minutes || 30,
          type: item?.type || 'checkup',
          status: item?.status || 'scheduled',
          doctor_notes: item?.doctor_notes || '',
        });
      } catch (err) {
        pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تحميل الموعد' });
      } finally {
        setGlobalLoading(false);
      }
    }
    loadAppointment();
  }, [id, pushToast, setGlobalLoading]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(nextOverrides = {}) {
    setGlobalLoading(true);
    try {
      const dateStr = nextOverrides.appointment_date ?? form.appointment_date;
      const appointmentDateValue = dateStr ? new Date(dateStr).toISOString() : null;

      if (!appointmentDateValue) {
        pushToast({ type: 'error', message: 'يرجى تحديد تاريخ ووقت الموعد' });
        setGlobalLoading(false);
        return;
      }

      const payload = {
        appointment_date: appointmentDateValue,
        duration_minutes: Number(nextOverrides.duration_minutes ?? form.duration_minutes ?? 30),
        type: nextOverrides.type ?? form.type,
        status: nextOverrides.status ?? form.status,
        doctor_notes: nextOverrides.doctor_notes ?? form.doctor_notes ?? null,
      };

      await updateAppointmentRequest(id, payload);

      if (appointment) {
        setAppointment({ ...appointment, ...payload });
      }
      setForm((prev) => ({
        ...prev,
        appointment_date: new Date(payload.appointment_date).toISOString().slice(0, 16),
        duration_minutes: payload.duration_minutes,
        type: payload.type,
        status: payload.status,
        doctor_notes: payload.doctor_notes || '',
      }));
      pushToast({ type: 'success', message: 'تم تحديث الموعد' });
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تحديث الموعد' });
    } finally {
      setGlobalLoading(false);
    }
  }

  async function handleCancel() {
    setGlobalLoading(true);
    try {
      await deleteAppointmentRequest(id);
      pushToast({ type: 'info', message: 'تم إلغاء الموعد' });
      navigate('/appointments');
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر إلغاء الموعد' });
    } finally {
      setGlobalLoading(false);
    }
  }

  const statusStyle = STATUS_STYLE[form.status] || STATUS_STYLE.scheduled;

  return (
    <AnimatedPage>
      <div className="appt-detail-page">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

          .appt-detail-page {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 24px;
            color: #f1f5f9;
            min-height: 100%;
            background-color: #0c0e14;
            background-image:
              linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
            background-size: 36px 36px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 20px;
            position: relative;
          }

          .appt-detail-page::after {
            content: '';
            position: absolute;
            top: -60px;
            right: -40px;
            width: 240px;
            height: 240px;
            background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
            pointer-events: none;
          }

          /* ── Back header ── */
          .detail-back-row {
            display: flex;
            align-items: center;
            gap: 10px;
            position: relative;
            z-index: 1;
            flex-wrap: wrap;
          }

          .btn-back {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.09);
            color: rgba(255,255,255,0.5);
            border-radius: 10px;
            padding: 7px 14px;
            font-size: 12px;
            font-weight: 500;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
          }
          .btn-back:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; }

          .detail-page-title {
            font-size: 20px;
            font-weight: 700;
            color: #f1f5f9;
            flex: 1;
          }

          /* ── Status badge (header) ── */
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 5px 12px;
            border-radius: 7px;
            font-size: 12px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            border: 1px solid;
          }

          /* ── Main grid ── */
          .detail-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 16px;
            position: relative;
            z-index: 1;
            align-items: start;
          }

          /* ── Card ── */
          .detail-card {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .card-heading {
            font-size: 13px;
            font-weight: 600;
            color: rgba(255,255,255,0.45);
            display: flex;
            align-items: center;
            gap: 8px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }

          .card-heading-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
          }

          /* ── Patient info block ── */
          .patient-info-block {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .patient-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: rgba(14,165,233,0.12);
            border: 1px solid rgba(14,165,233,0.22);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            font-size: 15px;
            font-weight: 700;
            flex-shrink: 0;
          }

          .patient-name {
            font-size: 15px;
            font-weight: 700;
            color: #f1f5f9;
          }

          .patient-meta {
            font-size: 12px;
            color: rgba(255,255,255,0.38);
            margin-top: 2px;
          }

          /* ── Fields ── */
          .detail-field {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .detail-label {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255,255,255,0.38);
          }

          .detail-input,
          .detail-select,
          .detail-textarea {
            background: #1a1d28;
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px;
            padding: 9px 14px;
            color: #f1f5f9;
            font-family: 'Cairo', sans-serif;
            font-size: 13px;
            direction: rtl;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.2s;
            outline: none;
          }
          .detail-input:focus,
          .detail-select:focus,
          .detail-textarea:focus { border-color: rgba(14,165,233,0.4); }
          .detail-select { cursor: pointer; }
          .detail-select option { background: #1a1d28; }

          .detail-textarea {
            min-height: 110px;
            resize: vertical;
            line-height: 1.6;
          }

          /* Fields row */
          .detail-fields-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          /* ── Quick action card ── */
          .quick-actions-card {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .qa-heading {
            font-size: 13px;
            font-weight: 600;
            color: rgba(255,255,255,0.45);
            display: flex;
            align-items: center;
            gap: 8px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            margin-bottom: 2px;
          }

          /* ── Buttons ── */
          .btn-primary {
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
            box-shadow: 0 0 16px rgba(14,165,233,0.22);
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
          }
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.97); }

          .btn-ghost {
            background: rgba(255,255,255,0.04);
            color: rgba(255,255,255,0.6);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 500;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
          }
          .btn-ghost:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; }

          .btn-success {
            background: rgba(34,197,94,0.1);
            color: #4ade80;
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
          }
          .btn-success:hover { background: rgba(34,197,94,0.18); }

          .btn-danger {
            background: rgba(239,68,68,0.1);
            color: #f87171;
            border: 1px solid rgba(239,68,68,0.2);
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
          }
          .btn-danger:hover { background: rgba(239,68,68,0.18); }

          .btn-divider {
            height: 1px;
            background: rgba(255,255,255,0.06);
            margin: 2px 0;
          }

          @media (max-width: 900px) {
            .detail-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 600px) {
            .detail-fields-2 { grid-template-columns: 1fr; }
            .appt-detail-page { padding: 16px; }
          }
        `}</style>

        {/* Back row */}
        <div className="detail-back-row">
          <button type="button" className="btn-back" onClick={() => navigate('/appointments')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            عودة
          </button>
          <div className="detail-page-title">تفاصيل الموعد</div>
          {/* Live status badge */}
          <div
            className="status-badge"
            style={{
              background: statusStyle.bg,
              borderColor: statusStyle.border,
              color: statusStyle.color,
            }}
          >
            {statusStyle.label}
          </div>
        </div>

        {/* Main layout */}
        <div className="detail-grid">

          {/* Left — edit form */}
          <div className="detail-card">
            <div className="card-heading">
              <div className="card-heading-dot" />
              بيانات الموعد
            </div>

            {/* Patient info */}
            <div className="patient-info-block">
              <div className="patient-avatar">
                {appointment?.full_name?.charAt(0) || '؟'}
              </div>
              <div>
                <div className="patient-name">{appointment?.full_name || 'غير محدد'}</div>
                <div className="patient-meta">مريض</div>
              </div>
            </div>

            {/* Date + Duration */}
            <div className="detail-fields-2">
              <div className="detail-field">
                <div className="detail-label">تاريخ ووقت الموعد</div>
                <input
                  type="datetime-local"
                  className="detail-input"
                  value={form.appointment_date}
                  onChange={(e) => updateField('appointment_date', e.target.value)}
                />
              </div>
              <div className="detail-field">
                <div className="detail-label">المدة (دقيقة)</div>
                <input
                  type="number"
                  className="detail-input"
                  min="15"
                  step="15"
                  value={form.duration_minutes}
                  onChange={(e) => updateField('duration_minutes', e.target.value)}
                />
              </div>
            </div>

            {/* Type + Status */}
            <div className="detail-fields-2">
              <div className="detail-field">
                <div className="detail-label">نوع الموعد</div>
                <select
                  className="detail-select"
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value)}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="detail-field">
                <div className="detail-label">الحالة</div>
                <select
                  className="detail-select"
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="detail-field">
              <div className="detail-label">ملاحظات الطبيب</div>
              <textarea
                className="detail-textarea"
                value={form.doctor_notes}
                placeholder="أضف ملاحظاتك هنا..."
                onChange={(e) => updateField('doctor_notes', e.target.value)}
              />
            </div>

          </div>

          {/* Right — quick actions */}
          <div className="quick-actions-card">
            <div className="qa-heading">
              <div className="card-heading-dot" />
              الإجراءات
            </div>

            <button type="button" className="btn-primary" onClick={() => handleSave()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              حفظ التعديلات
            </button>

            {appointment?.patient_id && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigate(`/patients/${appointment.patient_id}/sessions/new?appointmentId=${id}`)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                بدء جلسة علاجية
              </button>
            )}

            <button
              type="button"
              className="btn-success"
              onClick={() => {
                updateField('status', 'completed');
                handleSave({ status: 'completed' });
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              وضع كمكتمل
            </button>

            <div className="btn-divider" />

            <button type="button" className="btn-danger" onClick={handleCancel}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              إلغاء الموعد
            </button>
          </div>

        </div>
      </div>
    </AnimatedPage>
  );
}