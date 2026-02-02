import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.tsx'),

  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('devices', 'routes/devices.tsx'),
    route('channels', 'routes/channels.tsx'),
    route('import', 'routes/import.tsx')
  ])
] satisfies RouteConfig;
