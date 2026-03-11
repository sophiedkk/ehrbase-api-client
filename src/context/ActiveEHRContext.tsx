import { createContext, useContext, useState, type ReactNode } from 'react'
import type { EHR } from '../types/openehr'

const STORAGE_KEY = 'ehrbase_active_ehr'

function loadEHR(): EHR | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

interface ActiveEHRContextValue {
  activeEHR: EHR | null
  setActiveEHR: (ehr: EHR | null) => void
}

const ActiveEHRContext = createContext<ActiveEHRContextValue | null>(null)

export function ActiveEHRProvider({ children }: { children: ReactNode }) {
  const [activeEHR, setActiveEHRState] = useState<EHR | null>(loadEHR)

  function setActiveEHR(ehr: EHR | null) {
    setActiveEHRState(ehr)
    if (ehr) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ehr))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <ActiveEHRContext.Provider value={{ activeEHR, setActiveEHR }}>
      {children}
    </ActiveEHRContext.Provider>
  )
}

export function useActiveEHR() {
  const ctx = useContext(ActiveEHRContext)
  if (!ctx) throw new Error('useActiveEHR must be used within ActiveEHRProvider')
  return ctx
}
