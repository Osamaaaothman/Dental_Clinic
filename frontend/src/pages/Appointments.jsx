import AnimatedPage from '../components/AnimatedPage.jsx';

export default function Appointments() {
  return (
    <AnimatedPage>
      <div className="appointments-page">
        <style>{`
          .appointments-page {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 20px;
            color: #f1f5f9;
          }
          .appointments-panel {
            background: #13161f;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 20px;
            position: relative;
            overflow: hidden;
          }
          .appointments-panel::after {
            content: '';
            position: absolute;
            top: -60px;
            right: -40px;
            width: 220px;
            height: 220px;
            background: radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%);
            pointer-events: none;
          }
          .appointments-title {
            font-size: 20px;
            font-weight: 700;
            color: #f1f5f9;
          }
          .appointments-sub {
            font-size: 13px;
            color: rgba(255,255,255,0.5);
            margin-top: 4px;
          }
          .appointments-empty {
            margin-top: 16px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 16px;
            font-size: 13px;
            color: rgba(255,255,255,0.55);
          }
        `}</style>

        <div className="appointments-panel">
          <div className="appointments-title">المواعيد</div>
          <div className="appointments-sub">هذه الصفحة قيد التطوير للمرحلة الرابعة.</div>
          <div className="appointments-empty">
            قريباً: عرض تقويم المواعيد وإدارة الزيارات والتنبيهات.
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
