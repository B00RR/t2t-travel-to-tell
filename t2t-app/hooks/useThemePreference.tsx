import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Theme preference persistence + context.
 *
 * "system" (default) — follow the OS color scheme (useColorScheme)
 * "light"            — always light
 * "dark"             — always dark
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 't2t.theme_preference';

interface ThemePreferenceContextValue {
  preference: ThemePreference;
  resolved: ResolvedScheme;
  setPreference: (pref: ThemePreference) => Promise<void>;
  ready: boolean;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

function isValidPreference(v: string | null): v is ThemePreference {
  return v === 'system' || v === 'light' || v === 'dark';
}

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (isValidPreference(stored)) {
          setPreferenceState(stored);
        }
      } catch {
        // Ignore — fall back to "system"
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, pref);
    } catch {
      // Storage is best-effort; the in-memory value still changes.
    }
  }, []);

  const resolved: ResolvedScheme =
    preference === 'system' ? (system ?? 'light') : preference;

  return (
    <ThemePreferenceContext.Provider value={{ preference, resolved, setPreference, ready }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

/**
 * Returns the current user-selected theme preference.
 * Always safe to call; if the provider isn't mounted (e.g. tests that
 * don't wrap the tree) we return the system scheme as "system" pref.
 */
export function useThemePreference(): ThemePreferenceContextValue {
  const ctx = useContext(ThemePreferenceContext);
  const system = useSystemColorScheme();
  if (ctx) return ctx;
  return {
    preference: 'system',
    resolved: system ?? 'light',
    setPreference: async () => {},
    ready: true,
  };
}
