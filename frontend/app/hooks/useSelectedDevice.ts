import { useState, useEffect, useCallback } from 'react';

const PERSIST_KEY = 'mattone:selectedDeviceId';

function readPersistedId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(PERSIST_KEY) || '';
  } catch {
    return '';
  }
}

let globalSelectedDeviceId = readPersistedId();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function useSelectedDevice() {
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>(globalSelectedDeviceId);

  useEffect(() => {
    const listener = () => {
      setSelectedDeviceIdState(globalSelectedDeviceId);
    };
    listeners.add(listener);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PERSIST_KEY) {
        globalSelectedDeviceId = event.newValue || '';
        notifyListeners();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
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
