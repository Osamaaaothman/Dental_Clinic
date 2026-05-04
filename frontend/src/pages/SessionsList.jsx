import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage.jsx';
import SessionCard from '../components/SessionCard.jsx';
import { getPatientRequest, getPatientSessionsRequest } from '../api/index.js';
import { useUiStore } from '../store/uiStore.js';

function formatDate(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

export default function SessionsList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);

  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageError, setPageError] = useState(null);

  const pageLabel = useMemo(() => {
    const safeTotal = Math.max(1, totalPages || 1);
    const safePage = Math.min(Math.max(1, page), safeTotal);
    return `${safePage} / ${safeTotal}`;
  }, [page, totalPages]);

  async function loadData({ nextPage = page } = {}) {
    if (!id) return;
    setPageError(null);
    setGlobalLoading(true);
    try {
      const [patientData, sessionsData] = await Promise.all([
        getPatientRequest(id),
        getPatientSessionsRequest(id, { page: nextPage }),
      ]);
      setPatient(patientData.patient || null);
      setSessions(sessionsData.sessions || []);
      setPage(sessionsData.page || nextPage);
      setTotalPages(sessionsData.totalPages || 1);
    } catch (err) {
      const message = err.response?.data?.message || 'تعذر تحميل الجلسات';
      setPageError(message);
      setSessions([]);
      setTotalPages(1);
    } finally {
      setGlobalLoading(false);
    }
  }

  useEffect(() => {
    loadData({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <AnimatedPage>
      <div className="sessions-page">
        <style>{`
          .sessions-page {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 20px;
            color: #f1f5f9;
          }
          .sessions-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }
          .sessions-title {
            font-size: 20px;
            font-weight: 700;
          }
          .sessions-subtitle {
            font-size: 13px;
            color: rgba(255,255,255,0.5);
            margin-top: 4px;
          }
          .sessions-actions {
            display: flex;
            align-items: center;
            gap: 10px;
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
          .sessions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 14px;
          }
          .sessions-alert {
            background: rgba(239,68,68,0.1);
            border: 1px solid rgba(239,68,68,0.2);
            color: #f87171;
            border-radius: 12px;
            padding: 10px 12px;
            font-size: 13px;
            margin-bottom: 12px;
          }
          .sessions-empty {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            padding: 24px;
            text-align: center;
            color: rgba(255,255,255,0.55);
          }
          .sessions-pagination {
            margin-top: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }
          .sessions-page-label {
            font-size: 12px;
            color: rgba(255,255,255,0.5);
          }
        `}</style>

        <div className="sessions-header">
          <div>
            <div className="sessions-title">جلسات المريض</div>
            <div className="sessions-subtitle">
              {patient?.full_name || '...'} · آخر تحديث {formatDate(patient?.updated_at || patient?.created_at)}
            </div>
          </div>
          <div className="sessions-actions">
            <button type="button" className="btn-ghost" onClick={() => navigate(`/patients/${id}`)}>
              الرجوع للملف
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/patients/${id}/sessions/new`)}
            >
              إنشاء جلسة
            </button>
          </div>
        </div>

        {pageError && <div className="sessions-alert">{pageError}</div>}

        <div className="sessions-grid">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={() => navigate(`/patients/${id}/sessions/${session.id}`)}
            />
          ))}

          {sessions.length === 0 ? (
            <div className="sessions-empty">لا توجد جلسات بعد.</div>
          ) : null}
        </div>

        <div className="sessions-pagination">
          <div className="sessions-page-label">الصفحة: {pageLabel}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
