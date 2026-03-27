import { useEffect, useState } from 'react';
import { Button, Card, IconBadge, LoadingSpinner, SectionHeader, StatusBadge } from '@gaulatti/bleecker';
import { useSearchParams, useNavigate } from 'react-router';
import { useAddDevice } from '../services/queries/useDevices';
import { useAuthStatus } from '../hooks/useAuth';
import { Tv, CheckCircle, AlertCircle } from 'lucide-react';

const REDIRECT_DELAY_MS = 2000;

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoaded } = useAuthStatus();
  const addDevice = useAddDevice();

  const deviceCode = searchParams.get('code') || '';
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated, preserving the return URL
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(`/register?code=${deviceCode}`)}`);
    }
  }, [isLoaded, isAuthenticated, navigate, deviceCode]);

  const handleRegister = () => {
    if (!deviceCode.trim()) return;
    setError(null);
    addDevice.mutate(deviceCode, {
      onSuccess: () => {
        setRegistered(true);
        setTimeout(() => navigate('/devices'), REDIRECT_DELAY_MS);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || 'Failed to register device. Please try again.';
        setError(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    });
  };

  if (!isLoaded) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-light-sand dark:bg-dark-sand p-4'>
      <Card className='w-full max-w-md rounded-2xl p-8 text-center shadow-lg'>
        <div className='flex justify-center mb-6'>
          <IconBadge size='lg' className='rounded-full bg-sea/10 text-sea dark:bg-accent-blue/10 dark:text-accent-blue'>
            <Tv size={32} className='text-sea dark:text-accent-blue' />
          </IconBadge>
        </div>

        {registered ? (
          <>
            <CheckCircle size={48} className='text-green-500 mx-auto mb-4' />
            <SectionHeader className='mb-2 text-center' title='Device Registered!' />
            <div className='mb-4 flex justify-center'>
              <StatusBadge label='Registered' variant='info' />
            </div>
            <p className='text-text-secondary dark:text-text-secondary'>
              <span className='font-mono font-semibold'>{deviceCode}</span> has been added to your account.
              Redirecting to devices…
            </p>
          </>
        ) : (
          <>
            <SectionHeader className='mb-2 text-center' title='Register TV' />

            <p className='mb-6 text-text-secondary dark:text-text-secondary'>
              {deviceCode ? (
                <>
                  Confirm adding device <span className='font-mono font-semibold text-sea dark:text-accent-blue'>{deviceCode}</span> to your account.
                </>
              ) : (
                'No device code provided. Please scan the QR code from your TV.'
              )}
            </p>

            {error && (
              <div className='mb-4 flex items-center gap-2 rounded-lg bg-terracotta/10 p-3 text-sm text-terracotta'>
                <AlertCircle size={16} className='shrink-0' />
                <span>{error}</span>
              </div>
            )}

            {deviceCode && (
              <Button
                onClick={handleRegister}
                disabled={addDevice.isPending}
                className='w-full rounded-xl px-6 py-3 text-base'
              >
                {addDevice.isPending ? <><LoadingSpinner size='sm' /><span className='ml-2'>Registering…</span></> : 'Register Device'}
              </Button>
            )}

            <Button
              variant='secondary'
              onClick={() => navigate('/devices')}
              className='mt-3 w-full rounded-xl border-sand/30 bg-white px-6 py-3 text-base dark:border-sand/50 dark:bg-sand/10 dark:hover:bg-sand/20'
            >
              Go to Devices
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
