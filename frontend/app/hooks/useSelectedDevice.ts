import { useState, useEffect, useCallback } from 'react';

const PERSIST_KEY = 'mattone:selectedDeviceId';

let globalSelectedDeviceId = '';
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function getInitialValue(): string {
  if (globalSelectedDeviceId) return globalSelectedDeviceId;
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(PERSIST_KEY) || '';
}

export function useSelectedDevice() {
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>(getInitialValue);

  useEffect(() => {
    setSelectedDeviceIdState(globalSelectedDeviceId);
    const listener = () => {
      setSelectedDeviceIdState(globalSelectedDeviceId);
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const setSelectedDeviceId = useCallback((id: string) => {
    globalSelectedDeviceId = id;
    if (typeof window !== 'undefined') {
      if (id) {
        window.localStorage.setItem(PERSIST_KEY, id);
      } else {
        window.localStorage.removeItem(PERSIST_KEY);
      }
    }
    notifyListeners();
  }, []);

  return { selectedDeviceId, setSelectedDeviceId };
}
