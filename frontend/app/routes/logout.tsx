import type { Route } from './+types/logout';
import { Card, LoadingSpinner, SectionHeader } from '@gaulatti/bleecker';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

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
      <Card className='w-full max-w-md mx-4 rounded-2xl px-6 py-10 shadow-lg'>
        <div className='flex flex-col items-center text-center gap-5'>
          <LoadingSpinner size='lg' />
          <SectionHeader className='text-center' title='Signing you out' description='Clearing your session and returning you to the login screen.' />
        </div>
      </Card>
    </div>
  );
}
