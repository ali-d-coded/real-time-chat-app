import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import type { JSX } from 'react';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation();
  const currentPath = location.pathname;
  console.log({currentPath,user});
  

  if(currentPath === '/campaign-messages' && user!.role !== 'admin') {
    return <Navigate to="/" />;

  }

  return token ? children : <Navigate to="/login" />;
}