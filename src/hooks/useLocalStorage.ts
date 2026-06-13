import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  hydrate: (value: unknown) => T = (value) => value as T,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? hydrate(JSON.parse(item)) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage key', key, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing localStorage key', key, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
