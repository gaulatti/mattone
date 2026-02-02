import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import 'aws-amplify/auth/enable-oauth-listener';
import { Provider } from 'react-redux';

import type { Route } from './+types/root';
import './app.css';
import './services/auth'; // Initialize Amplify
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { getStore } from './state';
import AuthListener from './components/common/AuthListener';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Encode+Sans:wght@700&family=Libre+Franklin:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap'
  }
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className='bg-white dark:bg-deep-sea text-text-primary'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body className='bg-white dark:bg-deep-sea text-text-primary'>
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
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false
          }
        }
      })
  );

  const { store } = getStore();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthListener />
        <div className='min-h-screen flex flex-col'>
          <Header />
          <main className='flex-1 pt-20 flex flex-col min-h-0'>
            <div className='flex-1 flex flex-col min-h-0'>
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
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
      <div className='min-h-screen flex flex-col'>
        <Header />
        <main className='flex-1 flex items-center justify-center bg-light-sand dark:bg-dark-sand pt-20'>
          <div className='text-center px-4 max-w-2xl mx-auto'>
            <h1 className='text-6xl font-bold text-text-primary dark:text-text-primary mb-4'>{message}</h1>
            <p className='text-xl text-text-secondary dark:text-text-secondary mb-8'>{details}</p>
            {stack && (
              <pre className='w-full p-4 overflow-x-auto text-left bg-sand/20 dark:bg-sand/30 rounded-lg text-sm mb-8'>
                <code>{stack}</code>
              </pre>
            )}
            <a
              href='/'
              className='inline-flex items-center justify-center px-6 py-3 bg-sea dark:bg-accent-blue text-white rounded-lg hover:opacity-90 transition-opacity'
            >
              Go Home
            </a>
          </div>
        </main>
        <Footer />
      </div>
    </Provider>
  );
}
