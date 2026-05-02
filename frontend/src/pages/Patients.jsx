import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedButton from "../components/AnimatedButton.jsx";
import AnimatedPage from "../components/AnimatedPage.jsx";
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
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
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
    if (!clinicId) {
      return;
    }

    setListError(null);
    setGlobalLoading(true);
    try {
      const data = await getPatientsRequest({
        clinicId,
        search: nextSearch,
        page: nextPage,
      });

      setPatients(data.patients || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || nextPage);
    } catch (error) {
      const message =
        error.response?.data?.message || "تعذر تحميل قائمة المرضى";
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
        birth_date: fullPatient.birth_date
          ? String(fullPatient.birth_date).slice(0, 10)
          : "",
        gender: fullPatient.gender || "",
        phone: fullPatient.phone || "",
        email: fullPatient.email || "",
        blood_type: fullPatient.blood_type || "",
        allergies: fullPatient.allergies || "",
        notes: fullPatient.notes || "",
      });
      dialogRef.current?.showModal?.();
    } catch (error) {
      const message =
        error.response?.data?.message || "تعذر تحميل بيانات المريض";
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
    if (isSaving) {
      return;
    }
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
        if (data?.patient?.id) {
          navigate(`/patients/${data.patient.id}`);
        }
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
            --bg-overlay: rgba(255,255,255,0.04);
            --border-subtle: rgba(255,255,255,0.06);
            --border-default: rgba(255,255,255,0.09);
            --border-active: rgba(14,165,233,0.2);
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

          .patients-page *, .patients-page *::before, .patients-page *::after { box-sizing: border-box; }

          @media (max-width: 640px) {
            .patients-page { padding: 16px; }
          }

          .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }

          .page-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-primary);
          }

          .page-subtitle {
            font-size: 13px;
            color: var(--text-secondary);
            margin-top: 4px;
          }

          .section-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.13em;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 6px;
            font-family: 'Cairo', sans-serif;
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

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

          .badge-info { background: rgba(14,165,233,0.12); color: #38bdf8; border: 1px solid rgba(14,165,233,0.2); }
          .badge-neutral { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.09); }

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

          .search-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .search-field { flex: 1; min-width: 220px; }

          .field-label {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255,255,255,0.4);
            margin-bottom: 6px;
            display: block;
          }

          .label {
            display: block;
            margin-bottom: 6px;
          }

          .label-text {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255,255,255,0.4);
          }

          .label-text-alt {
            font-size: 11px;
            color: rgba(255,255,255,0.45);
          }

          .text-error { color: #f87171; }
          .input-error { border-color: rgba(239,68,68,0.45); }

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
            box-sizing: border-box;
            transition: border-color 0.2s;
            outline: none;
          }

          .input::placeholder, .textarea::placeholder { color: rgba(255,255,255,0.22); }
          .input:focus, .select:focus, .textarea:focus { border-color: rgba(14,165,233,0.4); }
          .input:disabled, .select:disabled, .textarea:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .card {
            background: var(--bg-surface);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            padding: 16px 20px;
            transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          }

          .card:hover {
            border-color: rgba(255,255,255,0.12);
            background: var(--bg-raised);
          }

          .patients-grid {
            margin-top: 16px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 14px;
          }

          .patient-card { display: flex; flex-direction: column; gap: 12px; }

          .patient-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .patient-identity {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(14,165,233,0.15);
            border: 1px solid rgba(14,165,233,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            font-size: 13px;
            font-weight: 700;
            flex-shrink: 0;
          }

          .patient-name {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
          }

          .patient-meta {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 2px;
          }

          .patient-badges {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
          }

          .divider {
            height: 1px;
            background: var(--border-subtle);
            margin: 6px 0;
          }

          .patient-details {
            display: grid;
            gap: 6px;
          }

          .detail-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .detail-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            letter-spacing: 0.06em;
          }

          .detail-value {
            font-size: 13px;
            color: var(--text-secondary);
            text-align: left;
          }

          .patient-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

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
          .btn-ghost:hover {
            background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.9);
          }
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

          .btn-sm {
            padding: 7px 14px;
            font-size: 12px;
          }

          .patients-alert {
            margin-top: 12px;
            background: rgba(239,68,68,0.09);
            border: 1px solid rgba(239,68,68,0.14);
            color: #f87171;
            border-radius: 12px;
            padding: 10px 12px;
            font-size: 13px;
          }

          .empty-card {
            text-align: center;
            color: var(--text-secondary);
            font-size: 13px;
          }

          .pagination-row {
            margin-top: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .pagination-label { font-size: 12px; color: var(--text-secondary); }
          .pagination-actions { display: flex; align-items: center; gap: 8px; }

          /* ===== MODAL ===== */

          .patients-modal {
            background: transparent;
            border: none;
            padding: 0;
            max-height: 92vh;
            overflow: visible;
          }

          .patients-modal::backdrop {
            background: rgba(0,0,0,0.65);
            backdrop-filter: blur(6px);
          }

          .patients-modal-panel {
            background: var(--bg-surface);
            border: 1px solid var(--border-default);
            border-radius: 18px;
            width: min(95vw, 680px);
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04);
            position: relative;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.1) transparent;
            background-image:
              linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
            background-size: 36px 36px;
          }

          .patients-modal-panel::before {
            content: '';
            position: absolute;
            top: -60px;
            right: -40px;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
          }

          .modal-inner {
            position: relative;
            z-index: 1;
            padding: 28px 28px 24px;
          }

          /* Header */
          .modal-header-bar {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
            direction: rtl;
          }

          .modal-icon-wrap {
            width: 50px;
            height: 50px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(14,165,233,0.2), rgba(99,102,241,0.2));
            border: 1px solid rgba(14,165,233,0.28);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            flex-shrink: 0;
            box-shadow: 0 0 20px rgba(14,165,233,0.18);
          }

          .modal-header-text { flex: 1; min-width: 0; }

          .modal-header-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.13em;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 4px;
          }

          .modal-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1.3;
          }

          .modal-subtitle {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 5px;
            line-height: 1.65;
          }

          .modal-header-end {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }

          .modal-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
            background: rgba(14,165,233,0.12);
            color: #38bdf8;
            border: 1px solid rgba(14,165,233,0.22);
          }

          .modal-close-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
            padding: 0;
          }
          .modal-close-btn:hover {
            background: rgba(239,68,68,0.1);
            border-color: rgba(239,68,68,0.22);
            color: #f87171;
          }

          .modal-hr {
            height: 1px;
            background: rgba(255,255,255,0.06);
            margin: 0 0 22px 0;
            border: none;
          }

          /* Form body */
          .modal-body {
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .form-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .form-section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            direction: rtl;
          }

          .form-section-icon {
            width: 26px;
            height: 26px;
            border-radius: 7px;
            background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.1));
            border: 1px solid rgba(14,165,233,0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            flex-shrink: 0;
          }

          .form-section-title {
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: rgba(255,255,255,0.32);
            text-transform: uppercase;
          }

          .form-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .form-full { grid-column: 1 / -1; }

          .form-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .field-label {
            font-size: 11.5px;
            font-weight: 600;
            color: rgba(255,255,255,0.45);
            display: block;
            direction: rtl;
          }

          .field-required {
            color: rgba(239,68,68,0.75);
            margin-right: 3px;
          }

          .input-date {
            padding-inline-end: 36px;
            color-scheme: dark;
          }
          .input-date::-webkit-calendar-picker-indicator {
            cursor: pointer;
            filter: invert(1);
            opacity: 0.65;
          }

          .textarea {
            resize: vertical;
            min-height: 90px;
          }

          .form-error-bar {
            margin-top: 6px;
            background: rgba(239,68,68,0.09);
            border: 1px solid rgba(239,68,68,0.2);
            color: #f87171;
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 12.5px;
            direction: rtl;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          /* Action bar */
          .modal-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: flex-start;
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid rgba(255,255,255,0.05);
            direction: rtl;
          }

          @media (max-width: 820px) {
            .page-header { flex-direction: column; align-items: flex-start; }
            .patients-panel { padding: 16px; }
          }

          @media (max-width: 600px) {
            .modal-inner { padding: 20px 16px 18px; }
            .form-grid-2 { grid-template-columns: 1fr; }
            .modal-header-bar { flex-wrap: wrap; }
          }
        `}</style>

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
              إضافة مريض
            </AnimatedButton>
          </div>
        </div>

        <div className="patients-panel">
          <div className="search-row">
            <div className="search-field">
              <label className="field-label" htmlFor="search">
                بحث بالاسم
              </label>
              <input
                id="search"
                className="input"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="اكتب اسم المريض"
              />
            </div>
            <div className="search-actions">
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
          </div>

          {listError ? <div className="patients-alert">{listError}</div> : null}

          <div className="patients-grid">
            {patients.map((patient) => {
              const genderLabel =
                patient.gender === "male"
                  ? "ذكر"
                  : patient.gender === "female"
                    ? "أنثى"
                    : "غير محدد";
              const createdLabel = patient.created_at
                ? String(patient.created_at).slice(0, 10)
                : "بدون تاريخ";
              return (
                <div key={patient.id} className="card patient-card">
                  <div className="patient-card-header">
                    <div className="patient-identity">
                      <div className="avatar">
                        {getPatientInitials(patient.full_name)}
                      </div>
                      <div>
                        <div className="patient-name">{patient.full_name}</div>
                        <div className="patient-meta">
                          الهاتف: {patient.phone || "غير متوفر"}
                        </div>
                      </div>
                    </div>
                    <div className="patient-badges">
                      <span className="badge badge-neutral">{genderLabel}</span>
                      <span className="badge badge-info">{createdLabel}</span>
                    </div>
                  </div>
                  <div className="divider" />
                  <div className="patient-details">
                    <div className="detail-row">
                      <span className="detail-label">الهاتف</span>
                      <span className="detail-value">
                        {patient.phone || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">النوع</span>
                      <span className="detail-value">{genderLabel}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">تاريخ الإضافة</span>
                      <span className="detail-value">{createdLabel}</span>
                    </div>
                  </div>
                  <div className="patient-actions">
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
                      className="btn-danger btn-sm"
                      onClick={() => handleDeletePatient(patient)}
                    >
                      حذف
                    </AnimatedButton>
                  </div>
                </div>
              );
            })}

            {patients.length === 0 ? (
              <div className="card empty-card">لا توجد بيانات.</div>
            ) : null}
          </div>

          <div className="pagination-row">
            <div className="pagination-label">الصفحة: {pageLabel}</div>
            <div className="pagination-actions">
              <AnimatedButton
                type="button"
                className="btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </AnimatedButton>
              <AnimatedButton
                type="button"
                className="btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                التالي
              </AnimatedButton>
            </div>
          </div>
        </div>

        <dialog ref={dialogRef} className="patients-modal">
          <div className="patients-modal-panel">
            <div className="modal-inner">

              {/* ── Header ── */}
              <div className="modal-header-bar">
                <div className="modal-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="modal-header-text">
                  <p className="modal-header-label">نموذج المريض</p>
                  <h3 className="modal-title">
                    {editingPatient ? "تعديل بيانات المريض" : "إضافة مريض جديد"}
                  </h3>
                  <p className="modal-subtitle">
                    أدخل المعلومات بدقة لضمان متابعة حالة المريض وسجلاته بشكل منظم.
                  </p>
                </div>
                <div className="modal-header-end">
                  <span className="modal-chip">
                    {editingPatient ? "تعديل" : "جديد"}
                  </span>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={closePatientDialog}
                    aria-label="إغلاق"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="1" y1="1" x2="13" y2="13"/>
                      <line x1="13" y1="1" x2="1" y2="13"/>
                    </svg>
                  </button>
                </div>
              </div>

              <hr className="modal-hr" />

              <form onSubmit={handleSavePatient}>
                <div className="modal-body">

                  {/* ── Section 1: Basic Data ── */}
                  <div className="form-section">
                    <div className="form-section-header">
                      <div className="form-section-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="3"/>
                          <path d="M8 10h8M8 14h5"/>
                        </svg>
                      </div>
                      <p className="form-section-title">البيانات الأساسية</p>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="field-label" htmlFor="full_name">
                          الاسم الكامل<span className="field-required">*</span>
                        </label>
                        <input
                          id="full_name"
                          name="full_name"
                          className="input"
                          value={form.full_name}
                          onChange={handleFormChange}
                          disabled={isSaving || isGlobalLoading}
                          placeholder="اسم المريض كاملاً"
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label" htmlFor="birth_date">
                          تاريخ الميلاد
                        </label>
                        <input
                          id="birth_date"
                          name="birth_date"
                          type="date"
                          className="input input-date"
                          value={form.birth_date}
                          onChange={handleFormChange}
                          disabled={isSaving || isGlobalLoading}
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label" htmlFor="gender">
                          النوع
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          className="select"
                          value={form.gender}
                          onChange={handleFormChange}
                          disabled={isSaving || isGlobalLoading}
                        >
                          <option value="">— اختر —</option>
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="field-label" htmlFor="phone">
                          رقم الهاتف
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          className="input"
                          value={form.phone}
                          onChange={handleFormChange}
                          disabled={isSaving || isGlobalLoading}
                          placeholder="+966 5XX XXX XXXX"
                        />
                      </div>
                      <div className="form-field form-full">
                        <label className="field-label" htmlFor="email">
                          البريد الإلكتروني
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="input"
                          value={form.email}
                          onChange={handleFormChange}
                          disabled={isSaving || isGlobalLoading}
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Section 2: Medical Info ── */}
                  <div className="form-section">
                    <div className="form-section-header">
                      <div className="form-section-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                      </div>
                      <p className="form-section-title">المعلومات الطبية</p>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="field-label" htmlFor="blood_type">
                          فصيلة الدم
                        </label>
                        <input
                          id="blood_type"
                          name="blood_type"
                          className="input"
                          value={form.blood_type}
                          onChange={handleFormChange}
                          disabled={isSaving || isGlobalLoading}
                          placeholder="مثال: A+"
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label" htmlFor="allergies">
                          الحساسية
                        </label>
                        <input
                          id="allergies"
                          name="allergies"
                          className="input"
                          value={form.allergies}
                          onChange={handleFormChange}
                          disabled={isSaving || isGlobalLoading}
                          placeholder="نوع الحساسية إن وجدت"
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="field-label" htmlFor="notes">
                        ملاحظات إضافية
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        className="textarea"
                        value={form.notes}
                        onChange={handleFormChange}
                        placeholder="أي ملاحظات طبية أو تنبيهات مهمة..."
                        disabled={isSaving || isGlobalLoading}
                      />
                    </div>
                  </div>

                </div>

                {formError ? (
                  <div className="form-error-bar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                    </svg>
                    {formError}
                  </div>
                ) : null}

                <div className="modal-actions">
                  <AnimatedButton
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving || isGlobalLoading}
                  >
                    {isSaving
                      ? "جارٍ الحفظ..."
                      : editingPatient
                        ? "حفظ التعديلات"
                        : "إضافة المريض"}
                  </AnimatedButton>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={closePatientDialog}
                    disabled={isSaving || isGlobalLoading}
                  >
                    إلغاء
                  </button>
                </div>
              </form>

            </div>
          </div>
        </dialog>
      </div>
    </AnimatedPage>
  );
}

export default Patients;
