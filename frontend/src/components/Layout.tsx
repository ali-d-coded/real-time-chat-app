import { Outlet } from 'react-router-dom';
import Sidebar from './SideBar';

export default function Layout() {
  return (
    <div className="h-screen flex">
      <Sidebar />
      {/* {children} */}
      <main className='overflow-y-scroll w-full'>
      <Outlet />
      </main>
    </div>
  );
}

// Updated Home.tsx
