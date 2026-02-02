import { Outlet } from 'react-router';
import ProtectedRoute from '../components/common/ProtectedRoute';

export default function Layout() {
  return (
    <ProtectedRoute>
      <div className='container mx-auto'>
        <Outlet />
      </div>
    </ProtectedRoute>
  );
}
