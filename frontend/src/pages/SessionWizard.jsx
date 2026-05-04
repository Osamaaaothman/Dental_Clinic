import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import MultiSelectTeethChart from '../components/MultiSelectTeethChart.jsx';
import {
  createSessionRequest,
  getPatientRequest,
  getPatientTeethRequest,
  uploadAttachmentRequest,
} from '../api/index.js';
import { useUiStore } from '../store/uiStore.js';

const STATUS_OPTIONS = [
  { value: 'unknown', label: 'غير معروف' },
  { value: 'healthy', label: 'سليم' },
  { value: 'cavity', label: 'تسوس' },
  { value: 'treated', label: 'حشوة' },
  { value: 'crown', label: 'تاج' },
  { value: 'implant', label: 'زرعة' },
  { value: 'root_canal', label: 'عصب' },
  { value: 'missing', label: 'مفقود' },
];

const FILE_TYPES = [
  { value: 'xray', label: 'أشعة' },
  { value: 'photo', label: 'صورة' },
  { value: 'document', label: 'مستند' },
  { value: 'other', label: 'أخرى' },
];

export default function SessionWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);

  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState(null);
  const [teeth, setTeeth] = useState([]);

  const [form, setForm] = useState({
    session_date: new Date().toISOString().slice(0, 10),
    chief_complaint: '',
    diagnosis: '',
    treatment_done: '',
    medications: '',
    next_visit_notes: '',
    amount_charged: '',
  });

  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [teethUpdates, setTeethUpdates] = useState({});
  const [focusedTooth, setFocusedTooth] = useState(null);

  const [attachments, setAttachments] = useState([]);
  const [attachmentDraft, setAttachmentDraft] = useState({
    file_type: 'xray',
    description: '',
    file: null,
  });

  const steps = useMemo(() => ([
    { id: 1, label: 'بيانات الجلسة' },
    { id: 2, label: 'تحديد الأسنان' },
    { id: 3, label: 'المرفقات' },
    { id: 4, label: 'المالية' },
  ]), []);

  async function loadData() {
    if (!id) return;
    setGlobalLoading(true);
    try {
      const [patientData, teethData] = await Promise.all([
        getPatientRequest(id),
        getPatientTeethRequest(id),
      ]);
      setPatient(patientData.patient || null);
      setTeeth(teethData.teeth || []);
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تحميل بيانات المريض' });
    } finally {
      setGlobalLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function updateFormField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleTooth(number) {
    setSelectedTeeth((prev) => (
      prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number]
    ));
  }

  function updateToothStatus(number, status) {
    setTeethUpdates((prev) => ({
      ...prev,
      [number]: {
        tooth_number: number,
        status,
        notes: prev[number]?.notes || '',
      },
    }));
  }

  function updateToothNotes(number, notes) {
    setTeethUpdates((prev) => ({
      ...prev,
      [number]: {
        tooth_number: number,
        status: prev[number]?.status || 'unknown',
        notes,
      },
    }));
  }

  function addAttachment() {
    if (!attachmentDraft.file) {
      pushToast({ type: 'error', message: 'يرجى اختيار ملف' });
      return;
    }
    setAttachments((prev) => [
      ...prev,
      {
        ...attachmentDraft,
        id: `${Date.now()}-${Math.random()}`,
      },
    ]);
    setAttachmentDraft({ file_type: 'xray', description: '', file: null });
  }

  function removeAttachment(idToRemove) {
    setAttachments((prev) => prev.filter((att) => att.id !== idToRemove));
  }

  async function handleSubmit() {
    if (!form.session_date) {
      pushToast({ type: 'error', message: 'يرجى تحديد تاريخ الجلسة' });
      return;
    }

    const payload = {
      session_date: form.session_date,
      chief_complaint: form.chief_complaint || null,
      diagnosis: form.diagnosis || null,
      treatment_done: form.treatment_done || null,
      medications: form.medications || null,
      next_visit_notes: form.next_visit_notes || null,
      amount_charged: Number(form.amount_charged || 0),
      teeth_treated: selectedTeeth,
      teeth_updates: Object.values(teethUpdates),
    };

    setGlobalLoading(true);
    try {
      const { session } = await createSessionRequest(id, payload);

      if (attachments.length) {
        for (const attachment of attachments) {
          await uploadAttachmentRequest({
            patientId: id,
            sessionId: session.id,
            fileType: attachment.file_type,
            description: attachment.description,
            file: attachment.file,
          });
        }
      }

      pushToast({ type: 'success', message: 'تم إنشاء الجلسة بنجاح' });
      navigate(`/patients/${id}/sessions/${session.id}`);
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر إنشاء الجلسة' });
    } finally {
      setGlobalLoading(false);
    }
  }

  return (
    <AnimatedPage>
      <div className="wizard-page">
        <style>{`
          .wizard-page {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 20px;
            color: #f1f5f9;
          }
          .wizard-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 18px;
          }
          .wizard-title {
            font-size: 20px;
            font-weight: 700;
          }
          .wizard-subtitle {
            font-size: 13px;
            color: rgba(255,255,255,0.5);
            margin-top: 4px;
          }
          .wizard-steps {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .wizard-step {
            padding: 6px 12px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: rgba(255,255,255,0.45);
            font-size: 12px;
            font-weight: 600;
          }
          .wizard-step.active {
            background: linear-gradient(135deg, rgba(14,165,233,0.16), rgba(99,102,241,0.12));
            color: #38bdf8;
            border-color: rgba(14,165,233,0.2);
          }
          .wizard-panel {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 20px;
          }
          .wizard-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .wizard-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .wizard-label {
            font-size: 12px;
            color: rgba(255,255,255,0.45);
          }
          .wizard-input, .wizard-textarea, .wizard-select {
            background: #1a1d28;
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px;
            padding: 9px 14px;
            color: #f1f5f9;
            font-size: 13px;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            outline: none;
            transition: border-color 0.2s;
          }
          .wizard-input:focus, .wizard-textarea:focus, .wizard-select:focus { border-color: rgba(14,165,233,0.4); }
          .wizard-textarea { min-height: 90px; resize: vertical; }
          .wizard-actions {
            margin-top: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }
          .btn-ghost {
            background: rgba(255,255,255,0.04);
            color: rgba(255,255,255,0.6);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 500;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-ghost:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
          .btn-primary {
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
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.97); }
          .teeth-side {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            padding: 14px;
            min-height: 120px;
          }
          .teeth-side-title {
            font-size: 12px;
            font-weight: 700;
            color: #f1f5f9;
            margin-bottom: 10px;
          }
          .attachment-list {
            display: grid;
            gap: 8px;
            margin-top: 12px;
          }
          .attachment-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .attachment-meta {
            font-size: 12px;
            color: rgba(255,255,255,0.55);
          }
          .attachment-remove {
            background: rgba(239,68,68,0.12);
            color: #f87171;
            border: 1px solid rgba(239,68,68,0.2);
            border-radius: 10px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          @media (max-width: 900px) {
            .wizard-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="wizard-header">
          <div>
            <div className="wizard-title">إنشاء جلسة جديدة</div>
            <div className="wizard-subtitle">{patient?.full_name || '...'}</div>
          </div>
          <div className="wizard-steps">
            {steps.map((item) => (
              <span key={item.id} className={`wizard-step${item.id === step ? ' active' : ''}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="wizard-panel">
          {step === 1 && (
            <div className="wizard-grid">
              <div className="wizard-field">
                <label className="wizard-label">تاريخ الجلسة</label>
                <input
                  type="date"
                  className="wizard-input"
                  value={form.session_date}
                  onChange={(e) => updateFormField('session_date', e.target.value)}
                />
              </div>
              <div className="wizard-field">
                <label className="wizard-label">الشكوى الرئيسية</label>
                <input
                  className="wizard-input"
                  value={form.chief_complaint}
                  onChange={(e) => updateFormField('chief_complaint', e.target.value)}
                  placeholder="مثال: ألم في الضرس"
                />
              </div>
              <div className="wizard-field">
                <label className="wizard-label">التشخيص</label>
                <input
                  className="wizard-input"
                  value={form.diagnosis}
                  onChange={(e) => updateFormField('diagnosis', e.target.value)}
                />
              </div>
              <div className="wizard-field">
                <label className="wizard-label">الإجراء المتبع</label>
                <input
                  className="wizard-input"
                  value={form.treatment_done}
                  onChange={(e) => updateFormField('treatment_done', e.target.value)}
                />
              </div>
              <div className="wizard-field">
                <label className="wizard-label">الأدوية / التعليمات</label>
                <textarea
                  className="wizard-textarea"
                  value={form.medications}
                  onChange={(e) => updateFormField('medications', e.target.value)}
                />
              </div>
              <div className="wizard-field">
                <label className="wizard-label">ملاحظات الزيارة القادمة</label>
                <textarea
                  className="wizard-textarea"
                  value={form.next_visit_notes}
                  onChange={(e) => updateFormField('next_visit_notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-grid">
              <div>
                <MultiSelectTeethChart
                  teeth={teeth}
                  selectedNumbers={selectedTeeth}
                  onToggle={toggleTooth}
                  onFocus={setFocusedTooth}
                />
              </div>
              <div className="teeth-side">
                <div className="teeth-side-title">تفاصيل السن المحدد</div>
                {focusedTooth ? (
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                      السن رقم {focusedTooth.tooth_number}
                    </div>
                    <div className="wizard-field">
                      <label className="wizard-label">الحالة الجديدة</label>
                      <select
                        className="wizard-select"
                        value={teethUpdates[focusedTooth.tooth_number]?.status || 'unknown'}
                        onChange={(e) => updateToothStatus(focusedTooth.tooth_number, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="wizard-field">
                      <label className="wizard-label">ملاحظات</label>
                      <textarea
                        className="wizard-textarea"
                        value={teethUpdates[focusedTooth.tooth_number]?.notes || ''}
                        onChange={(e) => updateToothNotes(focusedTooth.tooth_number, e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    اختر سنًا من المخطط لتحديث حالته.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="wizard-grid">
                <div className="wizard-field">
                  <label className="wizard-label">نوع الملف</label>
                  <select
                    className="wizard-select"
                    value={attachmentDraft.file_type}
                    onChange={(e) => setAttachmentDraft((prev) => ({ ...prev, file_type: e.target.value }))}
                  >
                    {FILE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="wizard-field">
                  <label className="wizard-label">الوصف</label>
                  <input
                    className="wizard-input"
                    value={attachmentDraft.description}
                    onChange={(e) => setAttachmentDraft((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="wizard-field" style={{ gridColumn: 'span 2' }}>
                  <label className="wizard-label">الملف</label>
                  <input
                    type="file"
                    className="wizard-input"
                    onChange={(e) => setAttachmentDraft((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button type="button" className="btn-primary" onClick={addAttachment}>إضافة ملف</button>
              </div>

              <div className="attachment-list">
                {attachments.map((att) => (
                  <div key={att.id} className="attachment-card">
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{att.file?.name}</div>
                      <div className="attachment-meta">{FILE_TYPES.find((t) => t.value === att.file_type)?.label || 'ملف'}</div>
                      {att.description && <div className="attachment-meta">{att.description}</div>}
                    </div>
                    <button type="button" className="attachment-remove" onClick={() => removeAttachment(att.id)}>
                      إزالة
                    </button>
                  </div>
                ))}
                {attachments.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>لا توجد مرفقات بعد.</div>
                ) : null}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-grid">
              <div className="wizard-field">
                <label className="wizard-label">المبلغ المطلوب</label>
                <input
                  type="number"
                  className="wizard-input"
                  value={form.amount_charged}
                  onChange={(e) => updateFormField('amount_charged', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="wizard-actions">
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-ghost" onClick={() => navigate(`/patients/${id}`)}>
                إلغاء
              </button>
              {step > 1 && (
                <button type="button" className="btn-ghost" onClick={() => setStep((prev) => prev - 1)}>
                  السابق
                </button>
              )}
            </div>
            {step < 4 ? (
              <button type="button" className="btn-primary" onClick={() => setStep((prev) => prev + 1)}>
                التالي
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleSubmit}>
                حفظ الجلسة
              </button>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
