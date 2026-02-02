import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  routes(context) {
    return [
      {
        path: '/',
        lazy: () => import('./routes/layout'),
        children: [
          { index: true, lazy: () => import('./routes/home') },
          { path: 'devices', lazy: () => import('./routes/devices') },
          { path: 'channels', lazy: () => import('./routes/channels') },
          { path: 'import', lazy: () => import('./routes/import') }
        ]
      }
    ];
  }
} satisfies Config;
