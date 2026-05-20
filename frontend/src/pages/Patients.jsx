import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedButton from "../components/AnimatedButton.jsx";
import AnimatedPage from "../components/AnimatedPage.jsx";
import FormField from "../components/FormField.jsx";
import {
  createPatientRequest,
  deletePatientRequest,
  getPatientRequest,
  getPatientsRequest,
  updatePatientRequest,
} from "../api/index.js";
import { useAuthStore } from "../store/authStore.js";
import { useUiStore } from "../store/uiStore.js";

const EMPTY_FORM = {
  full_name: "",
  birth_date: "",
  gender: "",
  phone: "",
  email: "",
  blood_type: "",
  allergies: "",
  notes: "",
};

function normalizePatientForm(form) {
  return {
    full_name: form.full_name?.trim() || "",
    birth_date: form.birth_date || null,
    gender: form.gender || null,
    phone: form.phone?.trim() || null,
    email: form.email?.trim() || null,
    blood_type: form.blood_type?.trim() || null,
    allergies: form.allergies?.trim() || null,
    notes: form.notes?.trim() || null,
  };
}

function getPatientInitials(name) {
  if (!name) return "؟";
  const parts = String(name).trim().split(" ").filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]).join("");
  return initials || String(name).slice(0, 1);
}

function Patients() {
  const navigate = useNavigate();
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const user = useAuthStore((state) => state.user);

  const pushToast = useUiStore((state) => state.pushToast);
  const openModal = useUiStore((state) => state.openModal);
  const setGlobalLoading = useUiStore((state) => state.setGlobalLoading);
  const isGlobalLoading = useUiStore((state) => state.isGlobalLoading);

  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [listError, setListError] = useState(null);

  const dialogRef = useRef(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const clinicId = selectedClinic?.id;

  const pageLabel = useMemo(() => {
    const safeTotal = Math.max(1, totalPages || 1);
    const safePage = Math.min(Math.max(1, page), safeTotal);
    return `${safePage} / ${safeTotal}`;
  }, [page, totalPages]);

  async function loadPatients({ nextPage = page, nextSearch = search } = {}) {
    if (!clinicId) return;
    setListError(null);
    setGlobalLoading(true);
    try {
      const data = await getPatientsRequest({ clinicId, search: nextSearch, page: nextPage });
      setPatients(data.patients || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || nextPage);
    } catch (error) {
      const message = error.response?.data?.message || "تعذر تحميل قائمة المرضى";
      setPatients([]);
      setTotalPages(1);
      setListError(message);
    } finally {
      setGlobalLoading(false);
    }
  }

  useEffect(() => {
    loadPatients({ nextPage: 1, nextSearch: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  async function openPatientDialog(patient) {
    setFormError(null);
    if (!patient) {
      setEditingPatient(null);
      setForm(EMPTY_FORM);
      dialogRef.current?.showModal?.();
      return;
    }
    setGlobalLoading(true);
    try {
      const data = await getPatientRequest(patient.id);
      const fullPatient = data.patient;
      setEditingPatient(fullPatient);
      setForm({
        full_name: fullPatient.full_name || "",
        birth_date: fullPatient.birth_date ? String(fullPatient.birth_date).slice(0, 10) : "",
        gender: fullPatient.gender || "",
        phone: fullPatient.phone || "",
        email: fullPatient.email || "",
        blood_type: fullPatient.blood_type || "",
        allergies: fullPatient.allergies || "",
        notes: fullPatient.notes || "",
      });
      dialogRef.current?.showModal?.();
    } catch (error) {
      const message = error.response?.data?.message || "تعذر تحميل بيانات المريض";
      pushToast({ type: "error", message });
    } finally {
      setGlobalLoading(false);
    }
  }

  function closePatientDialog() {
    dialogRef.current?.close?.();
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSavePatient(event) {
    event.preventDefault();
    if (isSaving) return;
    setFormError(null);
    const payload = normalizePatientForm(form);
    if (!payload.full_name) {
      setFormError("اسم المريض مطلوب");
      return;
    }
    setIsSaving(true);
    setGlobalLoading(true);
    try {
      if (editingPatient?.id) {
        await updatePatientRequest(editingPatient.id, payload);
        pushToast({ type: "success", message: "تم تحديث بيانات المريض" });
        closePatientDialog();
        await loadPatients();
      } else {
        const data = await createPatientRequest(payload);
        pushToast({ type: "success", message: "تمت إضافة المريض بنجاح" });
        closePatientDialog();
        await loadPatients({ nextPage: 1 });
        if (data?.patient?.id) navigate(`/patients/${data.patient.id}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || "تعذر حفظ بيانات المريض";
      setFormError(message);
      pushToast({ type: "error", message });
    } finally {
      setGlobalLoading(false);
      setIsSaving(false);
    }
  }

  function handleDeletePatient(patient) {
    openModal({
      title: "حذف المريض",
      description: `هل تريد حذف المريض: ${patient.full_name}؟ سيتم حذف السجل المرتبط.`,
      confirmText: "حذف",
      cancelText: "إلغاء",
      onConfirm: async () => {
        setGlobalLoading(true);
        try {
          await deletePatientRequest(patient.id);
          pushToast({ type: "success", message: "تم حذف المريض" });
          await loadPatients({ nextPage: 1 });
        } catch (error) {
          const message = error.response?.data?.message || "تعذر حذف المريض";
          pushToast({ type: "error", message });
        } finally {
          setGlobalLoading(false);
        }
      },
    });
  }

  return (
    <AnimatedPage>
      <div className="patients-page">
        <style>{`
          .patients-page {
            --bg-base: #0c0e14;
            --bg-surface: #13161f;
            --bg-raised: #1a1d28;
            --border-subtle: rgba(255,255,255,0.06);
            --border-default: rgba(255,255,255,0.09);
            --text-primary: #f1f5f9;
            --text-secondary: rgba(255,255,255,0.55);
            --text-muted: rgba(255,255,255,0.25);
            --text-active: #38bdf8;
            color: var(--text-primary);
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .patients-page *, .patients-page *::before, .patients-page *::after {
            box-sizing: border-box;
          }

          /* ── Header ── */
          .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }
          .section-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.13em;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .page-title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
          .page-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
          .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

          /* ── Badges ── */
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            white-space: nowrap;
          }
          .badge-info    { background: rgba(14,165,233,0.12); color: #38bdf8; border: 1px solid rgba(14,165,233,0.2); }
          .badge-neutral { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.09); }
          .badge-success { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }

          /* ── Panel ── */
          .patients-panel {
            background: var(--bg-surface);
            border: 1px solid var(--border-default);
            border-radius: 16px;
            padding: 18px 20px;
            position: relative;
            overflow: hidden;
          }
          .patients-panel::after {
            content: '';
            position: absolute;
            top: -60px;
            right: -40px;
            width: 220px;
            height: 220px;
            background: radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%);
            pointer-events: none;
          }

          /* ── Search Row ── */
          .search-row {
            display: flex;
            align-items: flex-end;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }
          .search-field { flex: 1; min-width: 200px; }
          .field-label {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255,255,255,0.4);
            margin-bottom: 6px;
            display: block;
          }
          .input, .select, .textarea {
            background: var(--bg-raised);
            border: 1px solid var(--border-default);
            border-radius: 10px;
            padding: 9px 14px;
            color: var(--text-primary);
            font-size: 13px;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            width: 100%;
            transition: border-color 0.2s;
            outline: none;
          }
          .input::placeholder, .textarea::placeholder { color: rgba(255,255,255,0.22); }
          .input:focus, .select:focus, .textarea:focus { border-color: rgba(14,165,233,0.4); }
          .input:disabled, .select:disabled, .textarea:disabled { opacity: 0.6; cursor: not-allowed; }

          /* ── Table ── */
          .table-wrapper {
            width: 100%;
            overflow-x: auto;
            border-radius: 12px;
            border: 1px solid var(--border-subtle);
          }
          .patients-table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            min-width: 600px;
          }
          .patients-table th {
            font-size: 11px;
            font-weight: 600;
            color: rgba(255,255,255,0.3);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 11px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            text-align: right;
            background: rgba(255,255,255,0.02);
            white-space: nowrap;
          }
          .patients-table td {
            font-size: 13px;
            color: rgba(255,255,255,0.7);
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            vertical-align: middle;
          }
          .patients-table tr:last-child td { border-bottom: none; }
          .patients-table tbody tr {
            transition: background 0.15s;
          }
          .patients-table tbody tr:hover td {
            background: rgba(255,255,255,0.03);
          }

          /* ── Patient name cell ── */
          .patient-identity {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(14,165,233,0.15);
            border: 1px solid rgba(14,165,233,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
          }
          .patient-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
          }

          /* ── Row actions ── */
          .row-actions {
            display: flex;
            align-items: center;
            gap: 6px;
            justify-content: flex-end;
          }

          /* ── Buttons ── */
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
          }
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.97); }
          .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

          .btn-ghost {
            background: rgba(255,255,255,0.04);
            color: rgba(255,255,255,0.6);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 10px;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 500;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-ghost:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
          .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

          .btn-danger {
            background: rgba(239,68,68,0.12);
            color: #f87171;
            border: 1px solid rgba(239,68,68,0.2);
            border-radius: 10px;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-danger:hover { background: rgba(239,68,68,0.2); }
          .btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }

          .btn-sm { padding: 6px 12px; font-size: 12px; }
          .btn-icon {
            width: 30px;
            height: 30px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          /* ── Alerts & Empty ── */
          .patients-alert {
            background: rgba(239,68,68,0.09);
            border: 1px solid rgba(239,68,68,0.14);
            color: #f87171;
            border-radius: 12px;
            padding: 10px 12px;
            font-size: 13px;
            margin-bottom: 12px;
          }
          .empty-row td {
            text-align: center;
            color: var(--text-secondary);
            padding: 32px 16px;
          }

          /* ── Pagination ── */
          .pagination-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 14px;
          }
          .pagination-label { font-size: 12px; color: var(--text-secondary); }
          .pagination-actions { display: flex; align-items: center; gap: 8px; }

          /* ── Modal ── */
          .patients-modal::backdrop {
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
          }
          .patients-modal-panel {
            background: var(--bg-surface);
            border: 1px solid var(--border-default);
            border-radius: 16px;
            padding: 24px;
            width: min(92vw, 520px);
          }
          .modal-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
          }
          .modal-action {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: flex-start;
            margin-top: 16px;
          }
          .modal-backdrop { background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
          .modal-backdrop button { opacity: 0; }

          @media (max-width: 640px) {
            .patients-page { padding: 14px; }
            .page-header { flex-direction: column; align-items: flex-start; }
            .patients-panel { padding: 14px; }
          }
        `}</style>

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <p className="section-label">ملف المرضى</p>
            <h2 className="page-title">إدارة المرضى</h2>
            <p className="page-subtitle">{user?.email || ""}</p>
          </div>
          <div className="header-actions">
            <span className="badge badge-info">
              {selectedClinic?.name || "بدون عيادة"}
            </span>
            <AnimatedButton
              className="btn-primary"
              type="button"
              onClick={() => openPatientDialog(null)}
            >
              + إضافة مريض
            </AnimatedButton>
          </div>
        </div>

        {/* ── Main Panel ── */}
        <div className="patients-panel">

          {/* Search */}
          <div className="search-row">
            <div className="search-field">
              <label className="field-label" htmlFor="search">بحث بالاسم</label>
              <input
                id="search"
                className="input"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setSearch(searchDraft.trim());
                  }
                }}
                placeholder="اكتب اسم المريض..."
              />
            </div>
            <AnimatedButton
              type="button"
              className="btn-primary"
              onClick={() => {
                setPage(1);
                setSearch(searchDraft.trim());
              }}
            >
              بحث
            </AnimatedButton>
          </div>

          {listError && <div className="patients-alert">{listError}</div>}

          {/* Table */}
          <div className="table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>المريض</th>
                  <th>الهاتف</th>
                  <th>النوع</th>
                  <th>فصيلة الدم</th>
                  <th>تاريخ الإضافة</th>
                  <th style={{ textAlign: "left" }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={6}>لا توجد بيانات.</td>
                  </tr>
                ) : (
                  patients.map((patient) => {
                    const genderLabel =
                      patient.gender === "male"
                        ? "ذكر"
                        : patient.gender === "female"
                          ? "أنثى"
                          : "—";
                    const createdLabel = patient.created_at
                      ? String(patient.created_at).slice(0, 10)
                      : "—";

                    return (
                      <tr key={patient.id}>
                        {/* Name */}
                        <td>
                          <div className="patient-identity">
                            <div className="avatar">
                              {getPatientInitials(patient.full_name)}
                            </div>
                            <span className="patient-name">{patient.full_name}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td>{patient.phone || "—"}</td>

                        {/* Gender */}
                        <td>
                          <span className="badge badge-neutral">{genderLabel}</span>
                        </td>

                        {/* Blood type */}
                        <td>
                          {patient.blood_type
                            ? <span className="badge badge-info">{patient.blood_type}</span>
                            : "—"}
                        </td>

                        {/* Created */}
                        <td style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                          {createdLabel}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="row-actions">
                            <AnimatedButton
                              type="button"
                              className="btn-primary btn-sm"
                              onClick={() => navigate(`/patients/${patient.id}`)}
                            >
                              الأسنان
                            </AnimatedButton>
                            <AnimatedButton
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => openPatientDialog(patient)}
                            >
                              تعديل
                            </AnimatedButton>
                            <AnimatedButton
                              type="button"
                              className="btn-danger btn-sm btn-icon"
                              title="حذف"
                              onClick={() => handleDeletePatient(patient)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </AnimatedButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-row">
            <div className="pagination-label">
              الصفحة: <strong style={{ color: "var(--text-primary)" }}>{pageLabel}</strong>
              {" · "}
              {patients.length} مريض في هذه الصفحة
            </div>
            <div className="pagination-actions">
              <AnimatedButton
                type="button"
                className="btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← السابق
              </AnimatedButton>
              <AnimatedButton
                type="button"
                className="btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                التالي →
              </AnimatedButton>
            </div>
          </div>
        </div>

        {/* ── Patient Dialog ── */}
        <dialog ref={dialogRef} className="modal patients-modal">
          <div className="modal-box patients-modal-panel">
            <h3 className="modal-title">
              {editingPatient ? "تعديل بيانات المريض" : "إضافة مريض"}
            </h3>

            <form className="mt-4 space-y-2" onSubmit={handleSavePatient}>
              <FormField
                id="full_name"
                name="full_name"
                label="الاسم الكامل"
                value={form.full_name}
                onChange={handleFormChange}
                disabled={isSaving || isGlobalLoading}
                required
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="form-control">
                  <label className="field-label" htmlFor="birth_date">تاريخ الميلاد</label>
                  <input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    className="input"
                    value={form.birth_date}
                    onChange={handleFormChange}
                    disabled={isSaving || isGlobalLoading}
                  />
                </div>
                <div className="form-control">
                  <label className="field-label" htmlFor="gender">النوع</label>
                  <select
                    id="gender"
                    name="gender"
                    className="select"
                    value={form.gender}
                    onChange={handleFormChange}
                    disabled={isSaving || isGlobalLoading}
                  >
                    <option value="">-</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <FormField id="phone" name="phone" label="الهاتف" value={form.phone} onChange={handleFormChange} disabled={isSaving || isGlobalLoading} />
                <FormField id="email" name="email" type="email" label="البريد الإلكتروني" value={form.email} onChange={handleFormChange} disabled={isSaving || isGlobalLoading} />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <FormField id="blood_type" name="blood_type" label="فصيلة الدم" value={form.blood_type} onChange={handleFormChange} disabled={isSaving || isGlobalLoading} />
                <FormField id="allergies" name="allergies" label="الحساسية" value={form.allergies} onChange={handleFormChange} disabled={isSaving || isGlobalLoading} />
              </div>

              <div className="form-control">
                <label className="field-label" htmlFor="notes">ملاحظات</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="textarea min-h-24"
                  value={form.notes}
                  onChange={handleFormChange}
                  placeholder="ملاحظات إضافية"
                  disabled={isSaving || isGlobalLoading}
                />
              </div>

              {formError && <div className="patients-alert">{formError}</div>}

              <div className="modal-action">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={closePatientDialog}
                  disabled={isSaving || isGlobalLoading}
                >
                  إغلاق
                </button>
                <AnimatedButton
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving || isGlobalLoading}
                >
                  {isSaving ? "جارٍ الحفظ..." : "حفظ"}
                </AnimatedButton>
              </div>
            </form>
          </div>

          <form method="dialog" className="modal-backdrop">
            <button aria-label="close">close</button>
          </form>
        </dialog>
      </div>
    </AnimatedPage>
  );
}

export default Patients;