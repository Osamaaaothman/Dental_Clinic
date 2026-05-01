import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useUiStore } from '../../store/uiStore.js';
import { useState } from 'react';

/* ─── Icons ─────────────────────────────────────────────────────────────────── */

function DashboardIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PatientsIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 21v-1a6 6 0 0 1 12 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 21v-1a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor" strokeWidth="1.5"
      />
    </svg>
  );
}

function LogoutIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 16l4-4-4-4M20 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Tooth SVG brand mark ───────────────────────────────────────────────────── */
function ToothMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ width: 28, height: 28 }}>
      <path
        d="M7 6c-1.5 1.5-2 4-1.5 6.5.5 2.5 1 5 .5 8-.3 2 .5 5 4 5 2 0 3.5-2 4-4 .5-2 1-4 2-4s1.5 2 2 4c.5 2 2 4 4 4 3.5 0 4.3-3 4-5-.5-3 0-5.5.5-8C27 4 23 2 20 3c-2 .7-3 2-4 2s-2-1.3-4-1.7C11 3 8.5 4.5 7 6z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: 'لوحة التحكم', to: '/dashboard', icon: DashboardIcon },
  { label: 'المرضى', to: '/patients', icon: PatientsIcon },
];

/* ─── Sidebar ─────────────────────────────────────────────────────────────────── */
export default function Sidebar({ collapsed, onToggle, onNavigate }) {
  const logout = useAuthStore((s) => s.logout);
  const openModal = useUiStore((s) => s.openModal);
  const [logoutHover, setLogoutHover] = useState(false);

  function handleLogoutClick() {
    openModal({
      title: 'تأكيد تسجيل الخروج',
      description: 'هل تريد إنهاء الجلسة الحالية والعودة إلى صفحة تسجيل الدخول؟',
      confirmText: 'تسجيل الخروج',
      cancelText: 'إلغاء',
      onConfirm: () => logout(),
    });
  }

  return (
    <>
      {/* Inject styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

        .sb-root {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          background: #0c0e14;
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px 12px 24px;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }

        /* animated background grid */
        .sb-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        /* glow blob */
        .sb-root::after {
          content: '';
          position: absolute;
          top: -80px;
          right: -60px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .sb-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 0;
        }

        /* ── Brand ── */
        .sb-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 6px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 16px;
        }

        .sb-logo {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 0 20px rgba(14,165,233,0.35);
          transition: box-shadow 0.3s;
        }

        .sb-logo:hover {
          box-shadow: 0 0 30px rgba(14,165,233,0.55);
        }

        .sb-brand-text {
          flex: 1;
          overflow: hidden;
        }

        .sb-brand-title {
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        .sb-brand-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          white-space: nowrap;
          margin-top: 1px;
        }

        /* collapse btn */
        .sb-toggle {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
          line-height: 1;
        }

        .sb-toggle:hover {
          background: rgba(255,255,255,0.09);
          color: white;
          border-color: rgba(255,255,255,0.15);
        }

        /* ── Section label ── */
        .sb-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.25);
          text-transform: uppercase;
          padding: 0 10px;
          margin-bottom: 6px;
        }

        /* ── Nav item ── */
        .sb-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          color: rgba(255,255,255,0.45);
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          white-space: nowrap;
          width: 100%;
          text-align: right;
          box-sizing: border-box;
        }

        .sb-item:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.85);
          border-color: rgba(255,255,255,0.07);
        }

        .sb-item.active {
          background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.10));
          color: #38bdf8;
          border-color: rgba(14,165,233,0.2);
          font-weight: 600;
        }

        /* glowing left-border for active */
        .sb-item.active::before {
          content: '';
          position: absolute;
          right: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          border-radius: 4px 0 0 4px;
          background: linear-gradient(180deg, #0ea5e9, #6366f1);
          box-shadow: 0 0 8px rgba(14,165,233,0.7);
        }

        .sb-item-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* disabled */
        .sb-item:disabled,
        .sb-item[disabled] {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* logout */
        .sb-item.logout:hover {
          background: rgba(239,68,68,0.10);
          color: #f87171;
          border-color: rgba(239,68,68,0.15);
        }

        /* ── Divider ── */
        .sb-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 12px 0;
        }

        /* ── Footer ── */
        .sb-footer {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        /* collapsed: center everything */
        .sb-root.collapsed .sb-item {
          justify-content: center;
          gap: 0;
          padding: 10px 0;
        }

        .sb-root.collapsed .sb-section-label {
          opacity: 0;
          height: 0;
          margin: 0;
          overflow: hidden;
        }

        /* text fade */
        .sb-label {
          overflow: hidden;
          transition: opacity 0.2s, max-width 0.3s;
          max-width: 200px;
          opacity: 1;
          flex-shrink: 0;
        }

        .sb-root.collapsed .sb-label {
          max-width: 0;
          opacity: 0;
          flex-shrink: 1;
        }
      `}</style>

      <aside className={`sb-root${collapsed ? ' collapsed' : ''}`} style={{ width: collapsed ? 72 : 248 }}>
        <div className="sb-inner">

          {/* Brand */}
          <div className="sb-brand">
            <div className="sb-logo" onClick={collapsed ? onToggle : undefined} style={{ cursor: collapsed ? 'pointer' : 'default' }}>
              <ToothMark />
            </div>

            {!collapsed && (
              <div className="sb-brand-text">
                <div className="sb-brand-title">عيادة الأسنان</div>
                <div className="sb-brand-sub">لوحة الطبيب</div>
              </div>
            )}

            {!collapsed && (
              <button className="sb-toggle" onClick={onToggle} aria-label="طي الشريط الجانبي">
                ›
              </button>
            )}
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {!collapsed && <div className="sb-section-label">القائمة</div>}
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
              >
                <span className="sb-item-icon">
                  <Icon style={{ width: 20, height: 20 }} />
                </span>
                <span className="sb-label">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="sb-footer">
            <button
              type="button"
              className="sb-item"
              disabled
              title={collapsed ? 'الإعدادات' : undefined}
              style={{ marginBottom: 4 }}
            >
              <span className="sb-item-icon"><SettingsIcon style={{ width: 20, height: 20 }} /></span>
              <span className="sb-label">الإعدادات</span>
            </button>

            <button
              type="button"
              className="sb-item logout"
              onClick={handleLogoutClick}
              title={collapsed ? 'تسجيل الخروج' : undefined}
            >
              <span className="sb-item-icon"><LogoutIcon style={{ width: 20, height: 20 }} /></span>
              <span className="sb-label">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
