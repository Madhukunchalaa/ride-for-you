import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const titleMap = {
    '/dashboard': 'Dashboard Overview',
    '/riders': 'Riders Management',
    '/hala': 'Hala Fleet Management',
    '/payments': 'Payments Tracking',
  };

  const currentTitle = titleMap[location.pathname] || 'Admin Portal';

  return (
    <div className="flex min-h-screen bg-dark-300 overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-64'}`}>
        <Header 
          title={currentTitle} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
