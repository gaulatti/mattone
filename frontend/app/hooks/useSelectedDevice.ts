import { useState, useEffect, useCallback } from 'react';

const PERSIST_KEY = 'mattone:selectedDeviceId';

export function useSelectedDevice() {
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(PERSIST_KEY);
    if (stored) {
      setSelectedDeviceIdState(stored);
    }
  }, []);

  const setSelectedDeviceId = useCallback((id: string) => {
    setSelectedDeviceIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        window.localStorage.setItem(PERSIST_KEY, id);
      } else {
        window.localStorage.removeItem(PERSIST_KEY);
      }
    }
  }, []);

  return { selectedDeviceId, setSelectedDeviceId };
}
