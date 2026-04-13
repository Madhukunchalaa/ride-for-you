import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const location = useLocation();
  const titleMap = {
    '/dashboard': 'Dashboard Overview',
    '/riders': 'Riders Management',
    '/hala': 'Hala Fleet Management',
    '/payments': 'Payments Tracking',
  };

  const currentTitle = titleMap[location.pathname] || 'Admin Portal';

  return (
    <div className="flex min-h-screen bg-dark-300">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <Header title={currentTitle} />
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
