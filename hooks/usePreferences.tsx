'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'light' | 'dark'

interface PreferencesContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Shows simulation and portal-switching tools used for demos and judging. */
  demoMode: boolean
  setDemoMode: (on: boolean) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

const THEME_KEY = 'aeris-theme'
const DEMO_KEY = 'aeris-demo-mode'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode); preferences then last for the session only.
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [demoMode, setDemoModeState] = useState(false)

  useEffect(() => {
    setThemeState(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
    setDemoModeState(readStorage(DEMO_KEY) === 'true')
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.dataset.theme = next
    writeStorage(THEME_KEY, next)
  }, [])

  const setDemoMode = useCallback((on: boolean) => {
    setDemoModeState(on)
    writeStorage(DEMO_KEY, String(on))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, demoMode, setDemoMode }), [theme, setTheme, demoMode, setDemoMode])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider')
  return ctx
}
