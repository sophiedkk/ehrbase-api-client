import type { AxiosInstance } from 'axios'

export interface AqlResult {
  columns: { name: string; path: string }[]
  rows: unknown[][]
  meta?: unknown
}

export async function runAql(client: AxiosInstance, query: string): Promise<AqlResult> {
  const res = await client.post<AqlResult>('/query/aql', { q: query })
  return res.data
}
