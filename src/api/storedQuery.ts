import type { AxiosInstance } from 'axios'

export interface StoredQuery {
  name: string
  type: string
  version: string
  saved: string
  q: string
}

export async function listStoredQueries(client: AxiosInstance): Promise<StoredQuery[]> {
  const res = await client.get<StoredQuery[] | { versions: StoredQuery[] }>('/definition/query')
  return Array.isArray(res.data) ? res.data : (res.data.versions ?? [])
}

export async function getStoredQueryVersions(
  client: AxiosInstance,
  name: string
): Promise<StoredQuery[]> {
  const res = await client.get<StoredQuery[]>(`/definition/query/${encodeURIComponent(name)}`)
  return Array.isArray(res.data) ? res.data : []
}

export async function getStoredQuery(
  client: AxiosInstance,
  name: string,
  version: string
): Promise<StoredQuery> {
  const res = await client.get<StoredQuery>(
    `/definition/query/${encodeURIComponent(name)}/${encodeURIComponent(version)}`
  )
  return res.data
}

export async function saveStoredQuery(
  client: AxiosInstance,
  name: string,
  query: string,
  version?: string
): Promise<void> {
  const path = version
    ? `/definition/query/${encodeURIComponent(name)}/${encodeURIComponent(version)}`
    : `/definition/query/${encodeURIComponent(name)}`
  await client.put(path, query, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
