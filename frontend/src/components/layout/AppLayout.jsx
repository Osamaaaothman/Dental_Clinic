import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { useAuthStore } from '../../store/authStore.js';

const PAGE_TITLES = {
  '/dashboard':    'لوحة التحكم',
  '/patients':     'المرضى',
  '/appointments': 'المواعيد',
  '/sessions':     'الجلسات',
  '/finance':      'المالية',
  '/settings':     'الإعدادات',
};

function AppLayout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const title = useMemo(() => {
    if (location.pathname.startsWith('/patients/')) return 'خريطة الأسنان';
    return PAGE_TITLES[location.pathname] || 'لوحة التحكم';
  }, [location.pathname]);

  const subtitle = useMemo(() => {
    if (location.pathname.startsWith('/patients/')) return 'متابعة حالة الأسنان وتحديث البيانات';
    return selectedClinic?.name ? `العيادة: ${selectedClinic.name}` : '';
  }, [location.pathname, selectedClinic]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .al-shell {
          display: flex;
          min-height: 100dvh;
          background: #0c0e14;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 36px 36px;
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          overflow: hidden;
        }

        /* ── Sidebar slot ── */
        .al-sidebar-slot {
          position: sticky;
          top: 0;
          height: 100dvh;
          flex-shrink: 0;
          z-index: 30;
        }

        /* ── Mobile overlay ── */
        .al-mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          justify-content: flex-right;
        }

        .al-mobile-drawer {
          height: 100%;
          width: 85%;
          max-width: 280px;
        }

        /* ── Main column ── */
        .al-main-col {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          min-height: 100dvh;
          overflow: hidden;
        }

        /* ── Header bar ── */
        .al-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 20px;
          height: 60px;
          flex-shrink: 0;
          background: rgba(19, 22, 31, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .al-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .al-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .al-menu-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
        }

        @media (max-width: 1023px) {
          .al-sidebar-slot { display: none; }
          .al-menu-btn    { display: flex; }
        }

        .al-page-title {
          font-size: 16px;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .al-page-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Header left actions ── */
        .al-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .al-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Cairo', sans-serif;
          white-space: nowrap;
        }

        .al-badge-blue {
          background: rgba(14, 165, 233, 0.1);
          color: #38bdf8;
          border: 1px solid rgba(14, 165, 233, 0.2);
        }

        .al-badge-neutral {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        @media (max-width: 540px) {
          .al-badge-neutral { display: none; }
        }

        /* Notification dot (decorative) */
        .al-notif-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .al-notif-btn:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.8);
        }

        /* ── Page content ── */
        .al-page-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          /* Custom scrollbar */
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .al-page-body::-webkit-scrollbar { width: 4px; }
        .al-page-body::-webkit-scrollbar-track { background: transparent; }
        .al-page-body::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
        }

        .al-page-inner {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* Breadcrumb divider */
        .al-divider {
          width: 1px;
          height: 16px;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
      `}</style>

      <div className="al-shell">
        {/* ── Desktop Sidebar ── */}
        <div className="al-sidebar-slot">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>

        {/* ── Mobile Overlay Drawer ── */}
        {sidebarOpen && (
          <div
            className="al-mobile-overlay"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="al-mobile-drawer"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                collapsed={false}
                onToggle={() => setSidebarCollapsed((prev) => !prev)}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* ── Main Column ── */}
        <div className="al-main-col">

          {/* ── Header ── */}
          <header className="al-header">
            {/* Right: menu toggle + title */}
            <div className="al-header-right">
              <button
                className="al-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="فتح القائمة"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6"  x2="21" y2="6"  />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="al-divider" />

              <div style={{ minWidth: 0 }}>
                <div className="al-page-title">{title}</div>
                {subtitle && <div className="al-page-subtitle">{subtitle}</div>}
              </div>
            </div>

            {/* Left: badges + notif */}
            <div className="al-header-left">
              {selectedClinic?.name && (
                <span className="al-badge al-badge-neutral">{selectedClinic.name}</span>
              )}
              <span className="al-badge al-badge-blue">
                {user?.email || 'الطبيب'}
              </span>
              <button className="al-notif-btn" aria-label="الإشعارات">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
            </div>
          </header>

          {/* ── Page Content ── */}
          <main className="al-page-body">
            <div className="al-page-inner">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </>
  );
}

export default AppLayout;