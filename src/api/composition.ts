import type { AxiosInstance } from 'axios'

export const COMPOSITION_FORMATS = [
  {
    id: 'JSON',
    label: 'JSON',
    contentType: 'application/json',
    accept: 'application/json',
    formatParam: 'JSON',
    editorType: 'json',
  },
  {
    id: 'STRUCTURED',
    label: 'Structured',
    contentType: 'application/json',
    accept: 'application/json',
    formatParam: 'STRUCTURED',
    editorType: 'json',
  },
  {
    id: 'FLAT',
    label: 'Flat',
    contentType: 'application/openehr.wt.flat.schema+json',
    accept: 'application/openehr.wt.flat.schema+json',
    formatParam: 'FLAT',
    editorType: 'json',
  },
  {
    id: 'XML',
    label: 'XML',
    contentType: 'application/xml',
    accept: 'application/xml',
    formatParam: 'XML',
    editorType: 'xml',
  },
] as const

export type CompositionFormat = (typeof COMPOSITION_FORMATS)[number]

export async function createComposition(
  client: AxiosInstance,
  ehrId: string,
  body: string,
  format: CompositionFormat
): Promise<{ compositionId: string; response: unknown; responseType: 'json' | 'xml' }> {
  const isXml = format.editorType === 'xml'
  const res = await client.post(`/ehr/${ehrId}/composition`, body, {
    params: { format: format.formatParam },
    headers: {
      'Content-Type': format.contentType,
      Accept: format.accept,
      Prefer: 'return=representation',
    },
    responseType: 'text',
  })
  const responseData = isXml ? res.data : JSON.parse(res.data || 'null')

  // Try Location header first; browsers often block it via CORS so fall back to response body
  const location = res.headers['location'] ?? res.headers['Location']
  let compositionId: string = location?.split('/').pop() ?? ''

  if (!compositionId) {
    if (isXml) {
      const match = (res.data as string).match(/<uid[^>]*>\s*<value>(.*?)<\/value>/)
      compositionId = match?.[1] ?? ''
    } else if (responseData && typeof responseData === 'object') {
      const uid = (responseData as Record<string, unknown>).uid
      if (uid && typeof uid === 'object') {
        compositionId = String((uid as Record<string, unknown>).value ?? '')
      }
    }
  }

  return { compositionId, response: responseData, responseType: isXml ? 'xml' : 'json' }
}

export async function getComposition(
  client: AxiosInstance,
  ehrId: string,
  compositionId: string,
  format: CompositionFormat
): Promise<{ data: unknown; type: 'json' | 'xml' }> {
  const isXml = format.editorType === 'xml'
  const res = await client.get<string>(`/ehr/${ehrId}/composition/${compositionId}`, {
    params: { format: format.formatParam },
    headers: { Accept: format.accept },
    responseType: 'text',
  })
  return {
    data: isXml ? res.data : JSON.parse(res.data),
    type: isXml ? 'xml' : 'json',
  }
}

export async function listCompositions(client: AxiosInstance, ehrId: string): Promise<unknown[]> {
  const aql = `SELECT c/uid/value AS uid,
                      c/name/value AS name,
                      c/context/start_time/value AS start_time
               FROM EHR e[ehr_id/value='${ehrId}']
               CONTAINS COMPOSITION c
               ORDER BY c/context/start_time DESC`
  const res = await client.post('/query/aql', { q: aql })
  return res.data?.rows ?? []
}
