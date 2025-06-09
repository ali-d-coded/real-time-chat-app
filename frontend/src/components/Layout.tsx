import { type ReactNode } from 'react';
import Sidebar from './SideBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex">
      <Sidebar />
      {children}
    </div>
  );
}

// Updated Home.tsx
