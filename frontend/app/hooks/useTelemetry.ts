import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { reportFrontendEvent } from '~/services/telemetry';

export function usePageViewTelemetry() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) return;
    lastPath.current = path;

    reportFrontendEvent('page_view', path);
  }, [location.pathname, location.search]);
}
