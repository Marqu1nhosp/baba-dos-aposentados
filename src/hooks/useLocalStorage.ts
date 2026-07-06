import { useEffect, useState } from 'react';

type StoredItem<T> = {
    value: T;
    expiry?: number;
};

export function useLocalStorage<T>(key: string, initialValue: T, ttlMinutes?: number) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;

        try {
            const item = window.localStorage.getItem(key);
            if (!item) return initialValue;

            const parsed = JSON.parse(item) as StoredItem<T> | T;
            if (parsed && typeof parsed === 'object' && 'expiry' in parsed) {
                if (parsed.expiry && Date.now() > parsed.expiry) {
                    window.localStorage.removeItem(key);
                    return initialValue;
                }

                return (parsed as StoredItem<T>).value ?? initialValue;
            }

            return (parsed as T) ?? initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const storageValue: StoredItem<T> = {
                value: storedValue,
            };

            if (ttlMinutes) {
                storageValue.expiry = Date.now() + ttlMinutes * 60 * 1000;
            }

            window.localStorage.setItem(key, JSON.stringify(storageValue));
        } catch {
            // ignore
        }
    }, [key, storedValue, ttlMinutes]);

    return [storedValue, setStoredValue] as const;
}
