import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import {
  addSessionPaymentRequest,
  deleteSessionRequest,
  getSessionPaymentsRequest,
  getSessionRequest,
  refundPaymentRequest,
  updateSessionRequest,
} from '../api/index.js';
import { useUiStore } from '../store/uiStore.js';

const TABS = [
  { id: 'info', label: 'الملخص' },
  { id: 'teeth', label: 'الأسنان' },
  { id: 'attachments', label: 'المرفقات' },
  { id: 'payments', label: 'المدفوعات' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي' },
  { value: 'card', label: 'بطاقة' },
  { value: 'insurance', label: 'تأمين' },
];

function formatDate(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('ar-EG');
}

export default function SessionDetail() {
  const { id, sessionId } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);
  const openModal = useUiStore((s) => s.openModal);

  const [activeTab, setActiveTab] = useState('info');
  const [session, setSession] = useState(null);
  const [payments, setPayments] = useState([]);
  const [edit, setEdit] = useState({
    chief_complaint: '',
    diagnosis: '',
    treatment_done: '',
    medications: '',
    next_visit_notes: '',
    amount_charged: '',
  });

  const [paymentDraft, setPaymentDraft] = useState({
    amount: '',
    payment_method: 'cash',
    notes: '',
  });

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const balance = useMemo(() => {
    const charged = Number(session?.amount_charged || 0);
    return charged - totalPaid;
  }, [session, totalPaid]);

  async function loadSession() {
    if (!sessionId) return;
    setGlobalLoading(true);
    try {
      const { session: sessionData } = await getSessionRequest(sessionId);
      setSession(sessionData);
      setEdit({
        chief_complaint: sessionData.chief_complaint || '',
        diagnosis: sessionData.diagnosis || '',
        treatment_done: sessionData.treatment_done || '',
        medications: sessionData.medications || '',
        next_visit_notes: sessionData.next_visit_notes || '',
        amount_charged: sessionData.amount_charged ?? '',
      });
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تحميل الجلسة' });
    } finally {
      setGlobalLoading(false);
    }
  }

  async function loadPayments() {
    if (!sessionId) return;
    try {
      const { payments: data } = await getSessionPaymentsRequest(sessionId);
      setPayments(data || []);
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تحميل المدفوعات' });
    }
  }

  useEffect(() => {
    loadSession();
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleUpdate() {
    setGlobalLoading(true);
    try {
      const { session: updated } = await updateSessionRequest(sessionId, {
        chief_complaint: edit.chief_complaint || null,
        diagnosis: edit.diagnosis || null,
        treatment_done: edit.treatment_done || null,
        medications: edit.medications || null,
        next_visit_notes: edit.next_visit_notes || null,
        amount_charged: Number(edit.amount_charged || 0),
      });
      setSession(updated);
      pushToast({ type: 'success', message: 'تم تحديث الجلسة' });
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تحديث الجلسة' });
    } finally {
      setGlobalLoading(false);
    }
  }

  async function handleDelete() {
    openModal({
      title: 'حذف الجلسة',
      description: 'هل تريد حذف هذه الجلسة؟ سيتم حذف جميع البيانات المرتبطة بها.',
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        setGlobalLoading(true);
        try {
          await deleteSessionRequest(sessionId);
          pushToast({ type: 'success', message: 'تم حذف الجلسة' });
          navigate(`/patients/${id}/sessions`);
        } catch (err) {
          pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر حذف الجلسة' });
        } finally {
          setGlobalLoading(false);
        }
      },
    });
  }

  async function handleAddPayment() {
    if (!paymentDraft.amount) {
      pushToast({ type: 'error', message: 'يرجى إدخال مبلغ الدفع' });
      return;
    }
    setGlobalLoading(true);
    try {
      await addSessionPaymentRequest(sessionId, {
        amount: Number(paymentDraft.amount),
        payment_method: paymentDraft.payment_method,
        notes: paymentDraft.notes || null,
      });
      setPaymentDraft({ amount: '', payment_method: 'cash', notes: '' });
      await loadPayments();
      await loadSession();
      pushToast({ type: 'success', message: 'تم تسجيل الدفعة' });
    } catch (err) {
      pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر تسجيل الدفع' });
    } finally {
      setGlobalLoading(false);
    }
  }

  async function handleRefund(paymentId) {
    openModal({
      title: 'استرجاع دفعة',
      description: 'سيتم تسجيل دفعة سالبة (استرجاع) بدلًا من الحذف. هل تريد المتابعة؟',
      confirmText: 'استرجاع',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        setGlobalLoading(true);
        try {
          await refundPaymentRequest(paymentId);
          await loadPayments();
          await loadSession();
          pushToast({ type: 'success', message: 'تم تسجيل الاسترجاع' });
        } catch (err) {
          pushToast({ type: 'error', message: err.response?.data?.message || 'تعذر استرجاع الدفعة' });
        } finally {
          setGlobalLoading(false);
        }
      },
    });
  }

  return (
    <AnimatedPage>
      <div className="session-detail">
        <style>{`
          .session-detail {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 20px;
            color: #f1f5f9;
          }
          .detail-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }
          .detail-title { font-size: 20px; font-weight: 700; }
          .detail-subtitle { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 4px; }
          .detail-actions { display: flex; gap: 8px; flex-wrap: wrap; }
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
          .btn-danger {
            background: rgba(239,68,68,0.12);
            color: #f87171;
            border: 1px solid rgba(239,68,68,0.2);
            border-radius: 10px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
          }
          .tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 14px;
          }
          .tab {
            padding: 6px 12px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: rgba(255,255,255,0.45);
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          .tab.active {
            background: linear-gradient(135deg, rgba(14,165,233,0.16), rgba(99,102,241,0.12));
            color: #38bdf8;
            border-color: rgba(14,165,233,0.2);
          }
          .panel {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 20px;
          }
          .grid {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .field { display: flex; flex-direction: column; gap: 6px; }
          .label { font-size: 12px; color: rgba(255,255,255,0.45); }
          .input, .textarea, .select {
            background: #1a1d28;
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px;
            padding: 9px 14px;
            color: #f1f5f9;
            font-size: 13px;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            outline: none;
          }
          .textarea { min-height: 90px; resize: vertical; }
          .stat-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
          .stat {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 10px;
            padding: 10px;
            text-align: center;
          }
          .stat .value { font-size: 14px; font-weight: 700; }
          .stat .label { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 4px; }
          .payment-grid { display: grid; gap: 10px; }
          .payment-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px;
            padding: 10px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
          }
          .payment-meta { font-size: 12px; color: rgba(255,255,255,0.55); }
          .btn-primary {
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.15s;
            box-shadow: 0 0 16px rgba(14,165,233,0.2);
          }
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.97); }
          @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
        `}</style>

        <div className="detail-header">
          <div>
            <div className="detail-title">تفاصيل الجلسة</div>
            <div className="detail-subtitle">تاريخ الجلسة: {formatDate(session?.session_date)}</div>
          </div>
          <div className="detail-actions">
            <button className="btn-ghost" type="button" onClick={() => navigate(`/patients/${id}/sessions`)}>
              رجوع
            </button>
            <button className="btn-danger" type="button" onClick={handleDelete}>
              حذف
            </button>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab${tab.id === activeTab ? ' active' : ''}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="panel">
          {activeTab === 'info' && (
            <>
              <div className="grid">
                <div className="field">
                  <label className="label">الشكوى الرئيسية</label>
                  <input className="input" value={edit.chief_complaint} onChange={(e) => setEdit((p) => ({ ...p, chief_complaint: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">التشخيص</label>
                  <input className="input" value={edit.diagnosis} onChange={(e) => setEdit((p) => ({ ...p, diagnosis: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">الإجراء المتبع</label>
                  <input className="input" value={edit.treatment_done} onChange={(e) => setEdit((p) => ({ ...p, treatment_done: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">المبلغ المطلوب</label>
                  <input className="input" type="number" value={edit.amount_charged} onChange={(e) => setEdit((p) => ({ ...p, amount_charged: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">الأدوية / التعليمات</label>
                  <textarea className="textarea" value={edit.medications} onChange={(e) => setEdit((p) => ({ ...p, medications: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">ملاحظات الزيارة القادمة</label>
                  <textarea className="textarea" value={edit.next_visit_notes} onChange={(e) => setEdit((p) => ({ ...p, next_visit_notes: e.target.value }))} />
                </div>
              </div>
              <div className="stat-row">
                <div className="stat">
                  <div className="value">{formatNumber(session?.amount_charged)}</div>
                  <div className="label">المبلغ</div>
                </div>
                <div className="stat">
                  <div className="value">{formatNumber(totalPaid)}</div>
                  <div className="label">المدفوع</div>
                </div>
                <div className="stat">
                  <div className="value">{formatNumber(balance)}</div>
                  <div className="label">المتبقي</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="btn-primary" type="button" onClick={handleUpdate}>حفظ التعديلات</button>
              </div>
            </>
          )}

          {activeTab === 'teeth' && (
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
                الأسنان المعالجة في هذه الجلسة
              </div>
              <div className="payment-grid">
                {session?.treated_teeth_details?.length ? (
                  session.treated_teeth_details.map((tooth) => (
                    <div key={tooth.id || tooth.tooth_number} className="payment-card">
                      <div>السن رقم {tooth.tooth_number}</div>
                      <div className="payment-meta">الحالة: {tooth.status || 'غير معروف'}</div>
                    </div>
                  ))
                ) : (session?.teeth_treated || []).length ? (
                  session.teeth_treated.map((tooth) => (
                    <div key={tooth} className="payment-card">
                      <div>السن رقم {tooth}</div>
                      <div className="payment-meta">تمت معالجته</div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>لا توجد أسنان مرتبطة بهذه الجلسة.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              سيتم إدارة مرفقات الجلسة من شاشة المريض.
            </div>
          )}

          {activeTab === 'payments' && (
            <>
              <div className="grid">
                <div className="field">
                  <label className="label">المبلغ</label>
                  <input
                    className="input"
                    type="number"
                    value={paymentDraft.amount}
                    onChange={(e) => setPaymentDraft((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="label">طريقة الدفع</label>
                  <select
                    className="select"
                    value={paymentDraft.payment_method}
                    onChange={(e) => setPaymentDraft((p) => ({ ...p, payment_method: e.target.value }))}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label className="label">ملاحظات</label>
                  <input
                    className="input"
                    value={paymentDraft.notes}
                    onChange={(e) => setPaymentDraft((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn-primary" type="button" onClick={handleAddPayment}>إضافة دفعة</button>
              </div>
              <div className="payment-grid" style={{ marginTop: 16 }}>
                {payments.map((payment) => (
                  <div key={payment.id} className="payment-card">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{formatNumber(payment.amount)}</div>
                      <div className="payment-meta">{formatDate(payment.payment_date)} · {payment.payment_method}</div>
                      {payment.notes && <div className="payment-meta">{payment.notes}</div>}
                    </div>
                    <button className="btn-ghost" type="button" onClick={() => handleRefund(payment.id)}>
                      استرجاع
                    </button>
                  </div>
                ))}
                {payments.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>لا توجد مدفوعات بعد.</div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
