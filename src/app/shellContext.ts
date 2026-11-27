import { createContext, useContext } from 'react';
import type { ResolvedTheme } from '../lib/theme';

export interface ShellChromeContextValue {
  resolvedTheme: ResolvedTheme;
  onToggleQuickTheme: () => void;
  onOpenProfile: () => void;
}

export const ShellChromeContext = createContext<ShellChromeContextValue | null>(null);

export function useShellChrome(): ShellChromeContextValue | null {
  return useContext(ShellChromeContext);
}
