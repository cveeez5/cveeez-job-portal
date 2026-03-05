import { useEffect, useRef, useCallback } from 'react';

const STORAGE_PREFIX = 'cveeez_form_';
const AUTOSAVE_DELAY = 1000; // 1 second debounce

export function useFormAutosave<T>(key: string, data: T) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `${STORAGE_PREFIX}${key}`;

  // Save data with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(storageKey, serialized);
      } catch (error) {
        console.warn('Failed to autosave form data:', error);
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, storageKey]);

  return null;
}

export function loadSavedFormData<T>(key: string): T | null {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function clearSavedFormData(key: string): void {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore errors
  }
}
