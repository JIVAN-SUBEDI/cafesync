// // app/admin/layout.tsx
// "use client";

// import AdminAuthGuard from "@/providers/adminAuthGuard";
// import { Provider } from "react-redux";
// import { store } from "@/store";

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <Provider store={store}>
//       <AdminAuthGuard>
//         {children}
//       </AdminAuthGuard>
//     </Provider>
//   );
// }





// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import AdminAuthGuard from '@/providers/adminAuthGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Provider store={store}>
      <AdminAuthGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminSidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={toggleSidebar}
          />
          
          {/* Main content */}
          <div
            className={`transition-all duration-300 ${
              isMobile
                ? 'ml-0 pt-16'
                : isSidebarCollapsed
                ? 'ml-20'
                : 'ml-64'
            }`}
          >
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </AdminAuthGuard>
    </Provider>
  );
}