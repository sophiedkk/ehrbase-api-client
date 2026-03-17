import axios from 'axios'
import type { ServerConfig } from '../types/openehr'

export function createApiClient(config: ServerConfig) {
  return axios.create({
    baseURL: `${config.baseUrl}/rest/openehr/v1`,
    auth: {
      username: config.username,
      password: config.password,
    },
    headers: {
      Accept: 'application/json',
    },
  })
}

export async function pingServer(config: ServerConfig): Promise<void> {
  await axios.get(`${config.baseUrl}/rest/status`, {
    auth: { username: config.username, password: config.password },
    timeout: 5000,
  })
}

export async function isServerOnline(config: ServerConfig): Promise<boolean> {
  try {
    await pingServer(config)
    return true
  } catch {
    return false
  }
}

export function formatError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data === 'string') return data
    if (data?.message) return data.message
    if (data?.error) return data.error
    return `HTTP ${err.response?.status}: ${err.message}`
  }
  return String(err)
}
