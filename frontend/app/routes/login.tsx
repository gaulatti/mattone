import type { Route } from './+types/login';
import { useAuthStatus } from '../hooks/useAuth';
import { Navigate } from 'react-router';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LoginForm from '../components/forms/LoginForm';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Login - celesti' }, { name: 'description', content: 'Login to celesti' }];
}

export default function Login() {
  const { isLoaded, isAuthenticated } = useAuthStatus();

  if (!isLoaded) {
    return (
      <div className='flex items-center justify-center bg-light-sand dark:bg-deep-sea h-full'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  return (
    <div className='flex-1 flex items-center justify-center bg-light-sand dark:bg-deep-sea'>
      <div className='max-w-md w-full mx-4'>
        <LoginForm />
      </div>
    </div>
  );
}
