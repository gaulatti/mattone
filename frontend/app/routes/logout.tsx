import type { Route } from './+types/logout';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import LoadingSpinner from '../components/common/LoadingSpinner';
import { logout as logoutDispatcher, setAuthLoaded } from '../state/dispatchers/auth';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Logout - celesti' }, { name: 'description', content: 'Signing out of celesti' }];
}

export default function Logout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // The hosted UI typically redirects here after sign-out (see Amplify redirectSignOut).
    // Ensure local state is cleared, mark auth check as complete, then send the user to login.
    dispatch(logoutDispatcher());
    dispatch(setAuthLoaded());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return (
    <div className='flex-1 flex items-center justify-center bg-light-sand dark:bg-deep-sea'>
      <div className='w-full max-w-md mx-4 rounded-2xl border border-sand/20 dark:border-sand/40 bg-white/60 dark:bg-dark-sand/50 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] px-6 py-10'>
        <div className='flex flex-col items-center text-center gap-5'>
          <LoadingSpinner size='lg' />
          <div>
            <h1 className='text-2xl font-semibold tracking-tight text-text-primary dark:text-white'>Signing you out</h1>
            <p className='mt-2 text-sm text-text-secondary dark:text-text-secondary'>Clearing your session and returning you to the login screen.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
