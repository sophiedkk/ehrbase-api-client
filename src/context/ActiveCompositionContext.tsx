import { createContext, useContext, useState, type ReactNode } from 'react'

export interface ActiveComposition {
  compositionId: string
  ehrId: string
}

const STORAGE_KEY = 'ehrbase_active_composition'

function load(): ActiveComposition | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

interface ActiveCompositionContextValue {
  activeComposition: ActiveComposition | null
  setActiveComposition: (c: ActiveComposition | null) => void
}

const ActiveCompositionContext = createContext<ActiveCompositionContextValue | null>(null)

export function ActiveCompositionProvider({ children }: { children: ReactNode }) {
  const [activeComposition, setActiveCompositionState] = useState<ActiveComposition | null>(load)

  function setActiveComposition(c: ActiveComposition | null) {
    setActiveCompositionState(c)
    if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    else localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <ActiveCompositionContext.Provider value={{ activeComposition, setActiveComposition }}>
      {children}
    </ActiveCompositionContext.Provider>
  )
}

export function useActiveComposition() {
  const ctx = useContext(ActiveCompositionContext)
  if (!ctx) throw new Error('useActiveComposition must be used within ActiveCompositionProvider')
  return ctx
}
