import { Navigate } from 'react-router';
import { useAuthStatus } from '../../hooks/useAuth';
import { LogIn } from 'lucide-react';
import { signInWithRedirect } from 'aws-amplify/auth';
import { Button, Card, IconBadge, SectionHeader } from '@gaulatti/bleecker';

export default function LoginForm() {
  const { isAuthenticated, isLoaded } = useAuthStatus();

  /**
   * Redirect the user to the dashboard if they are authenticated.
   */
  if (isLoaded && isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  return (
    <Card className='rounded-2xl p-8 shadow-lg'>
      <div className='text-center mb-8'>
        <IconBadge size='lg' className='mx-auto mb-4 rounded-full bg-sea text-white dark:bg-accent-blue dark:text-white'>
          <LogIn className='h-8 w-8 text-white' />
        </IconBadge>
        <SectionHeader title='Welcome Back' description='Sign in to access the admin panel' className='items-center text-center' />
      </div>

      <Button
        onClick={() => signInWithRedirect({ provider: 'Google' }).catch((e) => console.error('Error signing in', e))}
        className='w-full rounded-lg px-6 py-3'
      >
        <svg className='w-5 h-5' viewBox='0 0 24 24'>
          <path
            fill='currentColor'
            d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.107-1.453-.267-2.133H12.48z'
          />
        </svg>
        Sign in with Google
      </Button>

      <p className='mt-6 text-center text-sm text-text-secondary dark:text-text-secondary'>
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </Card>
  );
}
