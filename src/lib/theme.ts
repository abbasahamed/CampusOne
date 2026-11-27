import { useCallback, useEffect, useState } from 'react';
import { readStorageValue, writeStorageValue } from './storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'campusone.theme.v1';

function parseThemePreference(raw: string | null): ThemePreference {
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }
  return 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function applyThemeToDocument(resolved: ResolvedTheme): void {
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  const themeMeta = document.getElementById('campus-theme-color');
  if (themeMeta instanceof HTMLMetaElement) {
    themeMeta.content = resolved === 'dark' ? '#000000' : '#f2f2f7';
  }
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => readStorageValue(THEME_STORAGE_KEY, parseThemePreference).value,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStorageValue(THEME_STORAGE_KEY, parseThemePreference).value),
  );
  const [persistenceFailed, setPersistenceFailed] = useState<boolean>(
    () => !readStorageValue(THEME_STORAGE_KEY, parseThemePreference).persistedAvailable,
  );

  useEffect(() => {
    const nextResolved = resolveTheme(preference);
    setResolvedTheme(nextResolved);
    applyThemeToDocument(nextResolved);

    if (preference !== 'system' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemResolved = getSystemTheme();
      setResolvedTheme(systemResolved);
      applyThemeToDocument(systemResolved);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [preference]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        setPreferenceState(parseThemePreference(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    const ok = writeStorageValue(THEME_STORAGE_KEY, next);
    setPersistenceFailed(!ok);
  }, []);

  return {
    preference,
    resolvedTheme,
    setPreference,
    persistenceFailed,
  };
}
