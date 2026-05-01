import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { useAuthStore } from '../../store/authStore.js';

const PAGE_TITLES = {
  '/dashboard': 'لوحة التحكم',
  '/patients': 'المرضى',
  '/appointments': 'المواعيد',
  '/sessions': 'الجلسات',
  '/finance': 'المالية',
  '/settings': 'الإعدادات',
};

function AppLayout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const title = useMemo(() => {
    if (location.pathname.startsWith('/patients/')) {
      return 'خريطة الأسنان';
    }
    return PAGE_TITLES[location.pathname] || 'لوحة التحكم';
  }, [location.pathname]);

  const subtitle = useMemo(() => {
    if (location.pathname.startsWith('/patients/')) {
      return 'متابعة حالة الأسنان وتحديث البيانات';
    }
    return selectedClinic?.name ? `العيادة: ${selectedClinic.name}` : '';
  }, [location.pathname, selectedClinic]);

  return (
    <div className="shell-container">
      <div className="flex min-h-screen">
        <div className="hidden lg:block sticky top-0 h-[100dvh] self-start">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="h-full w-[85%] max-w-xs" onClick={(e) => e.stopPropagation()}>
              <Sidebar
                collapsed={false}
                onToggle={() => setSidebarCollapsed((prev) => !prev)}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex min-h-screen flex-1 flex-col">
          <Header
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setSidebarOpen(true)}
            actions={
              <div className="hidden items-center gap-2 sm:flex">
                <div className="badge badge-outline badge-primary">{user?.email || 'الطبيب'}</div>
                {selectedClinic?.name ? (
                  <div className="badge badge-outline">{selectedClinic.name}</div>
                ) : null}
              </div>
            }
          />
          <main className="page-shell">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
