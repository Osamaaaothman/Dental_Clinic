import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import SessionCard from '../components/SessionCard.jsx';
import { getPatientsRequest, getPatientSessionsRequest, getSesstionsFoClinic } from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';

export default function SessionsOverview() {
  const navigate = useNavigate();
  const selectedClinic = useAuthStore((s) => s.selectedClinic);
  const pushToast = useUiStore((s) => s.pushToast);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);

  const [sessions, setSessions] = useState([]);
  const [pageError, setPageError] = useState(null);

  const clinicId = selectedClinic?.id;

  const listLabel = useMemo(() => {
    return clinicId ? `جلسات العيادة: ${selectedClinic?.name || ''}` : 'الجلسات';
  }, [clinicId, selectedClinic]);

  useEffect(() => {
    async function loadSessions() {
      if (!clinicId) return;
      setGlobalLoading(true);
      setPageError(null);
      try {
        // const patientData = await getPatientsRequest({ clinicId, page: 1 });
        // const firstPatient = patientData?.patients?.[0];
        // if (!firstPatient?.id) {
        //   setSessions([]);
        //   return;
        // }
        const sessionsData = await getSesstionsFoClinic(clinicId, { page: 1 });
        console.log(sessionsData.sessions)
        setSessions(sessionsData.sessions.sessions || []);
      } catch (err) {
        setPageError(err.response?.data?.message || 'تعذر تحميل الجلسات');
        setSessions([]);
      } finally {
        setGlobalLoading(false);
      }
    }

    loadSessions();
  }, [clinicId, setGlobalLoading]);

  return (
    <AnimatedPage>
      <div className="sessions-overview">
        <style>{`
          .sessions-overview {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 20px;
            color: #f1f5f9;
          }
          .overview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }
          .overview-title { font-size: 20px; font-weight: 700; }
          .overview-subtitle { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 4px; }
          .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
          .overview-empty {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            padding: 24px;
            text-align: center;
            color: rgba(255,255,255,0.55);
          }
          .overview-alert {
            background: rgba(239,68,68,0.1);
            border: 1px solid rgba(239,68,68,0.2);
            color: #f87171;
            border-radius: 12px;
            padding: 10px 12px;
            font-size: 13px;
            margin-bottom: 12px;
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
        `}</style>

        <div className="overview-header">
          <div>
            <div className="overview-title">الجلسات</div>
            <div className="overview-subtitle">{listLabel}</div>
          </div>
          <button type="button" className="btn-ghost" onClick={() => navigate('/patients')}>
            اختر مريضًا لعرض جلساته
          </button>
        </div>

        {pageError && <div className="overview-alert">{pageError}</div>}

        <div className="overview-grid">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={() => navigate(`/patients/${session.patient_id}/sessions/${session.id}`)}
            />
          ))}
          {sessions.length === 0 ? (
            <div className="overview-empty">لا توجد جلسات متاحة. اختر مريضًا لعرض الجلسات.</div>
          ) : null}
        </div>
      </div>
    </AnimatedPage>
  );
}
