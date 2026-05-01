import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/AnimatedButton.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import FormField from '../components/FormField.jsx';
import {
  createPatientRequest,
  deletePatientRequest,
  getPatientRequest,
  getPatientsRequest,
  updatePatientRequest,
} from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';

const EMPTY_FORM = {
  full_name: '',
  birth_date: '',
  gender: '',
  phone: '',
  email: '',
  blood_type: '',
  allergies: '',
  notes: '',
};

function normalizePatientForm(form) {
  return {
    full_name: form.full_name?.trim() || '',
    birth_date: form.birth_date || null,
    gender: form.gender || null,
    phone: form.phone?.trim() || null,
    email: form.email?.trim() || null,
    blood_type: form.blood_type?.trim() || null,
    allergies: form.allergies?.trim() || null,
    notes: form.notes?.trim() || null,
  };
}

function Patients() {
  const navigate = useNavigate();
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const user = useAuthStore((state) => state.user);

  const pushToast = useUiStore((state) => state.pushToast);
  const openModal = useUiStore((state) => state.openModal);
  const setGlobalLoading = useUiStore((state) => state.setGlobalLoading);

  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [listError, setListError] = useState(null);

  const dialogRef = useRef(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

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
      const message = error.response?.data?.message || 'تعذر تحميل قائمة المرضى';
      setPatients([]);
      setTotalPages(1);
      setListError(message);
    } finally {
      setGlobalLoading(false);
    }
  }

  useEffect(() => {
    loadPatients({ nextPage: 1, nextSearch: '' });
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
        full_name: fullPatient.full_name || '',
        birth_date: fullPatient.birth_date ? String(fullPatient.birth_date).slice(0, 10) : '',
        gender: fullPatient.gender || '',
        phone: fullPatient.phone || '',
        email: fullPatient.email || '',
        blood_type: fullPatient.blood_type || '',
        allergies: fullPatient.allergies || '',
        notes: fullPatient.notes || '',
      });
      dialogRef.current?.showModal?.();
    } catch (error) {
      const message = error.response?.data?.message || 'تعذر تحميل بيانات المريض';
      pushToast({ type: 'error', message });
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
    setFormError(null);

    const payload = normalizePatientForm(form);
    if (!payload.full_name) {
      setFormError('اسم المريض مطلوب');
      return;
    }

    setGlobalLoading(true);
    try {
      if (editingPatient?.id) {
        await updatePatientRequest(editingPatient.id, payload);
        pushToast({ type: 'success', message: 'تم تحديث بيانات المريض' });
        closePatientDialog();
        await loadPatients();
      } else {
        const data = await createPatientRequest(payload);
        pushToast({ type: 'success', message: 'تمت إضافة المريض بنجاح' });
        closePatientDialog();
        await loadPatients({ nextPage: 1 });
        if (data?.patient?.id) {
          navigate(`/patients/${data.patient.id}`);
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'تعذر حفظ بيانات المريض';
      setFormError(message);
      pushToast({ type: 'error', message });
    } finally {
      setGlobalLoading(false);
    }
  }

  function handleDeletePatient(patient) {
    openModal({
      title: 'حذف المريض',
      description: `هل تريد حذف المريض: ${patient.full_name}؟ سيتم حذف السجل المرتبط.`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        setGlobalLoading(true);
        try {
          await deletePatientRequest(patient.id);
          pushToast({ type: 'success', message: 'تم حذف المريض' });
          await loadPatients({ nextPage: 1 });
        } catch (error) {
          const message = error.response?.data?.message || 'تعذر حذف المريض';
          pushToast({ type: 'error', message });
        } finally {
          setGlobalLoading(false);
        }
      },
    });
  }

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="panel-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="field-label">ملف المرضى</p>
              <h2 className="section-title">إدارة المرضى</h2>
              <p className="subtle-text mt-1">{user?.email || ''}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="badge badge-outline badge-primary">{selectedClinic?.name || 'بدون عيادة'}</div>
            </div>
          </div>
        </div>

        <div className="panel-card p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="label" htmlFor="search">
                <span className="label-text font-semibold">بحث بالاسم</span>
              </label>
              <div className="join w-full">
                <input
                  id="search"
                  className="input input-bordered join-item w-full"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="اكتب اسم المريض"
                />
                <button
                  type="button"
                  className="btn btn-primary join-item"
                  onClick={() => {
                    setPage(1);
                    setSearch(searchDraft.trim());
                  }}
                >
                  بحث
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AnimatedButton className="btn btn-primary" type="button" onClick={() => openPatientDialog(null)}>
                إضافة مريض
              </AnimatedButton>
            </div>
          </div>

          {listError ? <div className="alert alert-error text-sm mt-4">{listError}</div> : null}

          <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-base-300 lg:block">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>النوع</th>
                  <th>التاريخ</th>
                  <th className="text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="font-semibold">{patient.full_name}</td>
                    <td>{patient.phone || '-'}</td>
                    <td>{patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : '-'}</td>
                    <td>{patient.created_at ? String(patient.created_at).slice(0, 10) : '-'}</td>
                    <td className="text-left">
                      <div className="flex flex-wrap gap-2">
                        <AnimatedButton
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                          الأسنان
                        </AnimatedButton>
                        <AnimatedButton
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => openPatientDialog(patient)}
                        >
                          تعديل
                        </AnimatedButton>
                        <AnimatedButton
                          type="button"
                          className="btn btn-error btn-outline btn-sm"
                          onClick={() => handleDeletePatient(patient)}
                        >
                          حذف
                        </AnimatedButton>
                      </div>
                    </td>
                  </tr>
                ))}

                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-6 text-center text-sm text-base-content/70">لا توجد بيانات.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 lg:hidden">
            {patients.map((patient) => (
              <div key={patient.id} className="stat-tile">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-base-content">{patient.full_name}</h3>
                  <span className="text-xs text-base-content/60">{patient.created_at ? String(patient.created_at).slice(0, 10) : '-'}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-base-content/70">
                  <div>الهاتف: {patient.phone || '-'}</div>
                  <div>النوع: {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : '-'}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AnimatedButton type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/patients/${patient.id}`)}>
                    الأسنان
                  </AnimatedButton>
                  <AnimatedButton type="button" className="btn btn-outline btn-sm" onClick={() => openPatientDialog(patient)}>
                    تعديل
                  </AnimatedButton>
                  <AnimatedButton type="button" className="btn btn-error btn-outline btn-sm" onClick={() => handleDeletePatient(patient)}>
                    حذف
                  </AnimatedButton>
                </div>
              </div>
            ))}

            {patients.length === 0 ? (
              <div className="stat-tile text-center text-sm text-base-content/70">لا توجد بيانات.</div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-base-content/70">الصفحة: {pageLabel}</div>
            <div className="join">
              <button
                type="button"
                className="btn join-item btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </button>
              <button
                type="button"
                className="btn join-item btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>

      <dialog ref={dialogRef} className="modal">
        <div className="modal-box w-11/12 max-w-2xl border border-base-300/70 bg-base-100">
          <h3 className="text-lg font-extrabold text-neutral">
            {editingPatient ? 'تعديل بيانات المريض' : 'إضافة مريض'}
          </h3>

          <form className="mt-4 space-y-2" onSubmit={handleSavePatient}>
            <FormField
              id="full_name"
              name="full_name"
              label="الاسم الكامل"
              value={form.full_name}
              onChange={handleFormChange}
              required
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="form-control">
                <label className="label" htmlFor="birth_date">
                  <span className="label-text font-semibold">تاريخ الميلاد</span>
                </label>
                <input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  className="input input-bordered"
                  value={form.birth_date}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="gender">
                  <span className="label-text font-semibold">النوع</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="select select-bordered"
                  value={form.gender}
                  onChange={handleFormChange}
                >
                  <option value="">-</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <FormField id="phone" name="phone" label="الهاتف" value={form.phone} onChange={handleFormChange} />
              <FormField id="email" name="email" type="email" label="البريد الإلكتروني" value={form.email} onChange={handleFormChange} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <FormField
                id="blood_type"
                name="blood_type"
                label="فصيلة الدم"
                value={form.blood_type}
                onChange={handleFormChange}
              />
              <FormField
                id="allergies"
                name="allergies"
                label="الحساسية"
                value={form.allergies}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="notes">
                <span className="label-text font-semibold">ملاحظات</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                className="textarea textarea-bordered min-h-24"
                value={form.notes}
                onChange={handleFormChange}
                placeholder="ملاحظات إضافية"
              />
            </div>

            {formError ? <div className="alert alert-error py-2 text-sm">{formError}</div> : null}

            <div className="modal-action">
              <button type="button" className="btn" onClick={closePatientDialog}>
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

export default Patients;
