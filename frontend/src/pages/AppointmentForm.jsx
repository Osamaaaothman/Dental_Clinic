import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import { createAppointmentRequest, getPatientsRequest } from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';

const TYPES = [
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

export default function AppointmentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedClinic = useAuthStore((s) => s.selectedClinic);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);
  const pushToast = useUiStore((s) => s.pushToast);

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    appointment_date: '',
    duration_minutes: 30,
    type: 'checkup',
    doctor_notes: '',
  });

  const clinicId = selectedClinic?.id;

  useEffect(() => {
    const prefill = searchParams.get('date');
    if (prefill) {
      const date = new Date(prefill);
      if (!Number.isNaN(date.getTime())) {
        setForm((prev) => ({ ...prev, appointment_date: date.toISOString().slice(0, 16) }));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadPatients() {
      if (!clinicId) return;
      setGlobalLoading(true);
      setIsSearching(true);
      try {
        const data = await getPatientsRequest({ clinicId, search, page: 1 });
        setPatients(data.patients || []);
      } catch (err) {
        pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تحميل المرضى' });
      } finally {
        setGlobalLoading(false);
        setIsSearching(false);
      }
    }
    loadPatients();
  }, [clinicId, search, setGlobalLoading, pushToast]);

  const patientOptions = useMemo(() => (
    patients.map((p) => ({ value: p.id, label: p.full_name }))
  ), [patients]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patient_id || !form.appointment_date) {
      pushToast({ type: 'error', message: 'يرجى اختيار المريض وتحديد الموعد' });
      return;
    }
    setGlobalLoading(true);
    try {
      const payload = {
        patient_id: form.patient_id,
        appointment_date: new Date(form.appointment_date).toISOString(),
        duration_minutes: Number(form.duration_minutes || 30),
        type: form.type,
        doctor_notes: form.doctor_notes || null,
      };
      const data = await createAppointmentRequest(payload);
      pushToast({ type: 'success', message: 'تم حفظ الموعد بنجاح' });
      navigate(`/appointments/${data.appointment.id}`);
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر حفظ الموعد' });
    } finally {
      setGlobalLoading(false);
    }
  }

  return (
    <AnimatedPage>
      <div className="appt-form-page">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

          .appt-form-page {
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

          .appt-form-page::after {
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
          .form-back-row {
            display: flex;
            align-items: center;
            gap: 10px;
            position: relative;
            z-index: 1;
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

          .form-page-title {
            font-size: 20px;
            font-weight: 700;
            color: #f1f5f9;
          }

          /* ── Card ── */
          .form-card {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 24px;
            display: grid;
            gap: 18px;
            position: relative;
            z-index: 1;
          }

          /* ── Section divider ── */
          .form-section-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.12em;
            color: rgba(255,255,255,0.22);
            text-transform: uppercase;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            margin-bottom: 2px;
          }

          /* ── Fields ── */
          .form-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .form-field {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .form-label {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255,255,255,0.4);
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .form-label-required {
            color: rgba(239,68,68,0.7);
            font-size: 14px;
            line-height: 1;
          }

          .form-input,
          .form-select,
          .form-textarea {
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
          .form-input::placeholder { color: rgba(255,255,255,0.22); }
          .form-input:focus,
          .form-select:focus,
          .form-textarea:focus { border-color: rgba(14,165,233,0.4); }

          .form-select { cursor: pointer; }
          .form-select option { background: #1a1d28; }

          .form-textarea {
            min-height: 100px;
            resize: vertical;
            line-height: 1.6;
          }

          /* ── Search hint ── */
          .search-hint {
            font-size: 11px;
            color: rgba(255,255,255,0.3);
            display: flex;
            align-items: center;
            gap: 5px;
          }

          /* ── Actions ── */
          .form-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            padding-top: 4px;
          }

          .btn-primary {
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 10px 22px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
            box-shadow: 0 0 16px rgba(14,165,233,0.25);
          }
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.97); }

          .btn-ghost {
            background: rgba(255,255,255,0.04);
            color: rgba(255,255,255,0.55);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 500;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-ghost:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; }

          @media (max-width: 640px) {
            .form-grid-2 { grid-template-columns: 1fr; }
            .appt-form-page { padding: 16px; }
          }
        `}</style>

        {/* Back row */}
        <div className="form-back-row">
          <button type="button" className="btn-back" onClick={() => navigate('/appointments')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            عودة
          </button>
          <div className="form-page-title">إضافة موعد جديد</div>
        </div>

        {/* Form card */}
        <form className="form-card" onSubmit={handleSubmit}>

          {/* Patient section */}
          <div className="form-section-label">بيانات المريض</div>

          <div className="form-field">
            <label className="form-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              بحث عن مريض
            </label>
            <input
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اكتب اسم المريض للبحث..."
            />
            {isSearching && (
              <div className="search-hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.05-4.06"/>
                </svg>
                جاري التحديث...
              </div>
            )}
          </div>

          <div className="form-field">
            <label className="form-label">
              المريض <span className="form-label-required">*</span>
            </label>
            <select
              className="form-select"
              value={form.patient_id}
              onChange={(e) => updateField('patient_id', e.target.value)}
            >
              <option value="">اختر المريض</option>
              {patientOptions.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Appointment details section */}
          <div className="form-section-label">تفاصيل الموعد</div>

          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label">
                تاريخ ووقت الموعد <span className="form-label-required">*</span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.appointment_date}
                onChange={(e) => updateField('appointment_date', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">المدة (بالدقائق)</label>
              <input
                type="number"
                className="form-input"
                min="15"
                step="15"
                value={form.duration_minutes}
                onChange={(e) => updateField('duration_minutes', e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">نوع الموعد</label>
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">ملاحظات الطبيب</label>
            <textarea
              className="form-textarea"
              value={form.doctor_notes}
              placeholder="أضف أي ملاحظات إضافية..."
              onChange={(e) => updateField('doctor_notes', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="submit" className="btn-primary">حفظ الموعد</button>
            <button type="button" className="btn-ghost" onClick={() => navigate('/appointments')}>إلغاء</button>
          </div>

        </form>
      </div>
    </AnimatedPage>
  );
}