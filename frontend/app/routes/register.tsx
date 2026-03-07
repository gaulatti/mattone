import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAddDevice } from '../services/queries/useDevices';
import { useAuthStatus } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
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
      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-2xl shadow-lg p-8 w-full max-w-md text-center'>
        <div className='flex justify-center mb-6'>
          <div className='w-16 h-16 rounded-full bg-sea/10 dark:bg-accent-blue/10 flex items-center justify-center'>
            <Tv size={32} className='text-sea dark:text-accent-blue' />
          </div>
        </div>

        {registered ? (
          <>
            <CheckCircle size={48} className='text-green-500 mx-auto mb-4' />
            <h1 className='text-2xl font-bold text-text-primary dark:text-text-primary mb-2'>Device Registered!</h1>
            <p className='text-text-secondary dark:text-text-secondary'>
              <span className='font-mono font-semibold'>{deviceCode}</span> has been added to your account.
              Redirecting to devices…
            </p>
          </>
        ) : (
          <>
            <h1 className='text-2xl font-bold text-text-primary dark:text-text-primary mb-2'>Register TV</h1>
            <p className='text-text-secondary dark:text-text-secondary mb-6'>
              {deviceCode
                ? <>Confirm adding device <span className='font-mono font-semibold text-sea dark:text-accent-blue'>{deviceCode}</span> to your account.</>
                : 'No device code provided. Please scan the QR code from your TV.'}
            </p>

            {error && (
              <div className='mb-4 flex items-center gap-2 text-sm text-terracotta bg-terracotta/10 rounded-lg p-3'>
                <AlertCircle size={16} className='flex-shrink-0' />
                <span>{error}</span>
              </div>
            )}

            {deviceCode && (
              <button
                onClick={handleRegister}
                disabled={addDevice.isPending}
                className='w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-sea dark:bg-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400'
              >
                {addDevice.isPending ? <><LoadingSpinner size='sm' /><span className='ml-2'>Registering…</span></> : 'Register Device'}
              </button>
            )}

            <button
              onClick={() => navigate('/devices')}
              className='mt-3 w-full inline-flex items-center justify-center px-6 py-3 border border-sand/30 dark:border-sand/50 text-base font-medium rounded-xl text-text-primary dark:text-text-primary bg-white dark:bg-sand/10 hover:bg-sand/10 dark:hover:bg-sand/20 transition-all duration-400'
            >
              Go to Devices
            </button>
          </>
        )}
      </div>
    </div>
  );
}
