import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AnimatedButton from '../components/AnimatedButton.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import {
  getPatientRequest,
  getPatientTeethRequest,
  updateToothStatusRequest,
} from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';

const STATUS_OPTIONS = [
  { value: 'unknown', label: 'غير معروف' },
  { value: 'healthy', label: 'سليم' },
  { value: 'cavity', label: 'تسوس' },
  { value: 'treated', label: 'علاج/حشوة' },
  { value: 'crown', label: 'تاج' },
  { value: 'implant', label: 'زرعة' },
  { value: 'root_canal', label: 'عصب' },
  { value: 'missing', label: 'مفقود' },
];

function getFillClass(status) {
  switch (status) {
    case 'healthy':
      return 'fill-green-500';
    case 'cavity':
      return 'fill-red-500';
    case 'treated':
      return 'fill-orange-500';
    case 'crown':
      return 'fill-violet-500';
    case 'implant':
      return 'fill-yellow-500';
    case 'root_canal':
      return 'fill-blue-500';
    case 'missing':
      return 'fill-gray-600';
    case 'unknown':
    default:
      return 'fill-slate-400';
  }
}

function getDotClass(status) {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'cavity':
      return 'bg-red-500';
    case 'treated':
      return 'bg-orange-500';
    case 'crown':
      return 'bg-violet-500';
    case 'implant':
      return 'bg-yellow-500';
    case 'root_canal':
      return 'bg-blue-500';
    case 'missing':
      return 'bg-gray-600';
    case 'unknown':
    default:
      return 'bg-slate-400';
  }
}

function PatientTeeth() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const logout = useAuthStore((state) => state.logout);

  const pushToast = useUiStore((state) => state.pushToast);
  const openModal = useUiStore((state) => state.openModal);
  const setGlobalLoading = useUiStore((state) => state.setGlobalLoading);

  const [patient, setPatient] = useState(null);
  const [teeth, setTeeth] = useState([]);
  const [pageError, setPageError] = useState(null);

  const statusDialogRef = useRef(null);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [statusDraft, setStatusDraft] = useState('unknown');
  const [notesDraft, setNotesDraft] = useState('');

  const teethByNumber = useMemo(() => {
    const map = new Map();
    for (const tooth of teeth) {
      map.set(tooth.tooth_number, tooth);
    }
    return map;
  }, [teeth]);

  async function loadData() {
    if (!id) {
      return;
    }

    setPageError(null);
    setGlobalLoading(true);
    try {
      const [patientData, teethData] = await Promise.all([getPatientRequest(id), getPatientTeethRequest(id)]);
      setPatient(patientData.patient || null);
      setTeeth(teethData.teeth || []);
    } catch (error) {
      const message = error.response?.data?.message || 'تعذر تحميل بيانات المريض';
      setPageError(message);
      setPatient(null);
      setTeeth([]);
    } finally {
      setGlobalLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleLogoutClick() {
    openModal({
      title: 'تأكيد تسجيل الخروج',
      description: 'هل تريد إنهاء الجلسة الحالية والعودة إلى صفحة تسجيل الدخول؟',
      confirmText: 'تسجيل الخروج',
      cancelText: 'إلغاء',
      onConfirm: () => {
        logout();
      },
    });
  }

  function openStatusDialog(tooth) {
    setSelectedTooth(tooth);
    setStatusDraft(tooth?.status || 'unknown');
    setNotesDraft(tooth?.notes || '');
    statusDialogRef.current?.showModal?.();
  }

  function closeStatusDialog() {
    statusDialogRef.current?.close?.();
    setSelectedTooth(null);
  }

  async function handleUpdateTooth(event) {
    event.preventDefault();
    if (!selectedTooth?.id) {
      return;
    }

    setGlobalLoading(true);
    try {
      const data = await updateToothStatusRequest(selectedTooth.id, {
        status: statusDraft,
        notes: notesDraft,
      });

      const updated = data.tooth;
      setTeeth((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      pushToast({ type: 'success', message: `تم تحديث السن ${updated.tooth_number}` });
      closeStatusDialog();
    } catch (error) {
      const message = error.response?.data?.message || 'تعذر تحديث حالة السن';
      pushToast({ type: 'error', message });
    } finally {
      setGlobalLoading(false);
    }
  }

  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  function renderTooth(toothNumber, x, y) {
    const tooth = teethByNumber.get(toothNumber);
    const fillClass = getFillClass(tooth?.status);
    const isActive = selectedTooth?.id && tooth?.id === selectedTooth.id;

    return (
      <g
        key={toothNumber}
        transform={`translate(${x}, ${y})`}
        className={`cursor-pointer select-none text-base-content/60 hover:text-base-content ${isActive ? 'text-base-content' : ''}`}
        onClick={() => tooth && openStatusDialog(tooth)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && tooth) {
            openStatusDialog(tooth);
          }
        }}
      >
        <circle
          r={18}
          cx={0}
          cy={0}
          className={`${fillClass} stroke-current`}
          strokeWidth={isActive ? 3 : 2}
        />
        <text x={0} y={5} textAnchor="middle" className="fill-current text-xs font-bold text-base-100">
          {toothNumber}
        </text>
      </g>
    );
  }

  return (
    <AnimatedPage className="page-shell">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100/85 px-4 py-4 shadow sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/patients')}>
                رجوع
              </button>
              <h1 className="text-xl font-extrabold text-neutral sm:text-2xl">خريطة الأسنان</h1>
            </div>
            <p className="text-sm text-base-content/70">{patient?.full_name || '...'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="badge badge-primary badge-outline">{selectedClinic?.name || 'بدون عيادة'}</div>
            <AnimatedButton className="btn btn-outline btn-sm" type="button" onClick={loadData}>
              تحديث
            </AnimatedButton>
            <AnimatedButton className="btn btn-error btn-outline btn-sm" type="button" onClick={handleLogoutClick}>
              تسجيل الخروج
            </AnimatedButton>
          </div>
        </div>

        {pageError ? <div className="alert alert-error text-sm">{pageError}</div> : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="glass-card lg:col-span-2">
            <div className="card-body gap-3 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-base">الأسنان (32)</h2>
                <div className="text-xs text-base-content/60">اضغط على أي سن لتغيير الحالة</div>
              </div>

              <div className="rounded-2xl border border-base-300 bg-base-100 p-3">
                <svg viewBox="0 0 820 240" className="h-auto w-full">
                  <rect x="10" y="20" width="800" height="200" rx="18" className="fill-base-200" />

                  {upperRight.map((num, idx) => renderTooth(num, 70 + idx * 42, 80))}
                  {upperLeft.map((num, idx) => renderTooth(num, 430 + idx * 42, 80))}

                  {lowerRight.map((num, idx) => renderTooth(num, 70 + idx * 42, 170))}
                  {lowerLeft.map((num, idx) => renderTooth(num, 430 + idx * 42, 170))}

                  <line x1="410" y1="40" x2="410" y2="220" className="stroke-base-content/15" strokeWidth="2" />
                  <line x1="10" y1="125" x2="810" y2="125" className="stroke-base-content/10" strokeWidth="2" />
                </svg>
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <div key={opt.value} className="badge badge-outline gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${getDotClass(opt.value)}`} />
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="card-body gap-2 p-4 sm:p-6">
              <h2 className="card-title text-base">بيانات المريض</h2>
              <div className="space-y-1 text-sm text-base-content/70">
                <div>
                  <span className="font-semibold text-base-content">الاسم: </span>
                  <span>{patient?.full_name || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-base-content">الهاتف: </span>
                  <span>{patient?.phone || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-base-content">البريد: </span>
                  <span>{patient?.email || '-'}</span>
                </div>
              </div>

              <div className="mt-2">
                <Link className="btn btn-outline btn-sm w-full" to="/patients">
                  العودة لقائمة المرضى
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <dialog ref={statusDialogRef} className="modal">
        <div className="modal-box w-11/12 max-w-lg">
          <h3 className="text-lg font-extrabold text-neutral">
            تحديث حالة السن {selectedTooth?.tooth_number || ''}
          </h3>

          <form className="mt-4 space-y-3" onSubmit={handleUpdateTooth}>
            <div className="form-control">
              <label className="label" htmlFor="status">
                <span className="label-text font-semibold">الحالة</span>
              </label>
              <select
                id="status"
                className="select select-bordered"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="notes">
                <span className="label-text font-semibold">ملاحظات</span>
              </label>
              <textarea
                id="notes"
                className="textarea textarea-bordered min-h-24"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="اختياري"
              />
            </div>

            <div className="modal-action">
              <button type="button" className="btn" onClick={closeStatusDialog}>
                إغلاق
              </button>
              <button type="submit" className="btn btn-primary">
                حفظ
              </button>
            </div>
          </form>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button aria-label="close">close</button>
        </form>
      </dialog>
    </AnimatedPage>
  );
}

export default PatientTeeth;
