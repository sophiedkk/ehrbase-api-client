import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ServerConfig } from '../types/openehr'

const DEFAULT_CONFIG: ServerConfig = {
  baseUrl: 'http://localhost:8080/ehrbase/rest/openehr/v1',
  username: 'ehrbase-user',
  password: 'SuperSecretPassword1!',
}

const STORAGE_KEY = 'ehrbase_config'

function loadConfig(): ServerConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
  } catch {}
  return DEFAULT_CONFIG
}

interface ServerConfigContextValue {
  config: ServerConfig
  setConfig: (config: ServerConfig) => void
}

const ServerConfigContext = createContext<ServerConfigContextValue | null>(null)

export function ServerConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<ServerConfig>(loadConfig)

  function setConfig(newConfig: ServerConfig) {
    setConfigState(newConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
  }

  return (
    <ServerConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ServerConfigContext.Provider>
  )
}

export function useServerConfig() {
  const ctx = useContext(ServerConfigContext)
  if (!ctx) throw new Error('useServerConfig must be used within ServerConfigProvider')
  return ctx
}
