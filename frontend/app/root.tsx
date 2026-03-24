import {
  AppShell,
  BleeckerThemeScript,
  Button,
  Footer as BleeckerFooter,
  Header as BleeckerHeader,
  HeaderSelect,
  ThemeProvider,
  ThemeToggle,
  type NavItem,
  type RenderLinkProps
} from '@gaulatti/bleecker';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogIn, LogOut, Tv } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { signInWithRedirect } from 'aws-amplify/auth';
import 'aws-amplify/auth/enable-oauth-listener';

import type { Route } from './+types/root';
import './app.css';
import './services/auth';
import AuthListener from './components/common/AuthListener';
import { useAuthStatus, useLogout } from './hooks/useAuth';
import { useSelectedDevice } from './hooks/useSelectedDevice';
import { useDevices } from './services/queries/useDevices';
import { getStore } from './state';

const GITHUB_REPO_URL = 'https://github.com/gaulatti/mattone';

export const links: Route.LinksFunction = () => [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }];

function renderAppLink({ children, className, item, onClick }: RenderLinkProps<NavItem>) {
  if (item.external) {
    return (
      <a href={item.href} className={className} onClick={onClick} target='_blank' rel='noopener noreferrer'>
        {children}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function HeaderActions({ mobile = false }: { mobile?: boolean }) {
  const { isAuthenticated } = useAuthStatus();
  const { logout } = useLogout();
  const { selectedDeviceId, setSelectedDeviceId } = useSelectedDevice();
  const { data: devices = [] } = useDevices();

  return (
    <div className={mobile ? 'flex w-full flex-wrap items-center gap-3' : 'flex items-center gap-3'}>
      {isAuthenticated && devices.length > 0 ? (
        <HeaderSelect
          aria-label='Active TV'
          icon={<Tv size={15} className='text-sea dark:text-accent-blue' strokeWidth={1.5} />}
          options={devices.map((device) => ({
            label: device.nickname || device.deviceCode,
            value: device.id
          }))}
          placeholder='Select TV'
          value={selectedDeviceId}
          wrapperClassName={mobile ? 'w-full' : undefined}
          onChange={setSelectedDeviceId}
        />
      ) : null}

      <ThemeToggle />

      {isAuthenticated ? (
        <Button onClick={logout} variant='destructive' size='sm' className={mobile ? 'w-full justify-center' : ''}>
          <LogOut size={16} strokeWidth={1.5} />
          <span>Logout</span>
        </Button>
      ) : (
        <Button
          onClick={() => {
            signInWithRedirect({ provider: 'Google' }).catch((error) => {
              console.error('Error signing in', error);
            });
          }}
          variant='primary'
          size='sm'
          className={mobile ? 'w-full justify-center' : ''}
        >
          <LogIn size={16} strokeWidth={1.5} />
          <span>Login</span>
        </Button>
      )}
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuthStatus();

  const navigation: NavItem[] = isAuthenticated
    ? [
        { href: '/', label: 'Dashboard' },
        { href: '/devices', label: 'Devices' },
        { href: '/channels', label: 'Channels' },
        { href: '/groups', label: 'Groups' },
        { href: '/import', label: 'Import' }
      ]
    : [];

  const footerSections: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'Navigation',
      items: [
        { href: '/', label: 'Home' },
        { href: '/devices', label: 'Devices' },
        { href: '/channels', label: 'Channels' },
        { href: '/import', label: 'Import' }
      ]
    },
    {
      title: 'Resources',
      items: [{ href: GITHUB_REPO_URL, label: 'GitHub', external: true }]
    },
    {
      title: 'Legal',
      items: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' }
      ]
    }
  ];

  return (
    <AppShell
      className='antialiased'
      header={
        <BleeckerHeader
          brand={{
            href: '/',
            logoAlt: 'celesti',
            logoSrc: '/logo.svg',
            name: 'celesti'
          }}
          navigation={navigation}
          actions={<HeaderActions />}
          mobileActions={<HeaderActions mobile />}
          renderLink={renderAppLink}
        />
      }
      footer={
        <BleeckerFooter
          brand={{
            href: '/',
            logoAlt: 'celesti',
            logoSrc: '/logo.svg',
            name: 'celesti',
            description: 'Stream management made simple.'
          }}
          sections={footerSections}
          bottomLeft={
            <>
              © {new Date().getFullYear()}{' '}
              <a href='https://gaulatti.com' target='_blank' rel='noopener noreferrer' className='font-semibold hover:underline underline-offset-4'>
                gaulatti
              </a>
              . All rights reserved.
            </>
          }
          bottomRight={
            <a href={GITHUB_REPO_URL} target='_blank' rel='noopener noreferrer' className='hover:underline underline-offset-4'>
              View source on GitHub
            </a>
          }
          renderLink={renderAppLink}
        />
      }
    >
      <Outlet />
    </AppShell>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
        <BleeckerThemeScript storageKey='theme' />
      </head>
      <body className='bg-light-sand text-text-primary'>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  const { store } = getStore();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme='system' storageKey='theme'>
          <AuthListener />
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  const { store } = getStore();

  return (
    <Provider store={store}>
      <main className='container mx-auto p-4 pt-24'>
        <h1>{message}</h1>
        <p>{details}</p>
        {stack ? (
          <pre className='w-full overflow-x-auto p-4'>
            <code>{stack}</code>
          </pre>
        ) : null}
      </main>
    </Provider>
  );
}
