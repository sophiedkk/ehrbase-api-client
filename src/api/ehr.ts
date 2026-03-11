import type { AxiosInstance } from 'axios'
import type { EHR } from '../types/openehr'

export interface EHRSummary {
  ehrId: string
  subjectId?: string
  subjectNamespace?: string
  timeCreated?: string
}

export async function listEHRs(client: AxiosInstance): Promise<EHRSummary[]> {
  const aql = `SELECT e/ehr_id/value AS ehr_id,
                      e/ehr_status/subject/external_ref/id/value AS subject_id,
                      e/ehr_status/subject/external_ref/namespace AS subject_namespace,
                      e/time_created/value AS time_created
               FROM EHR e
               ORDER BY e/time_created DESC
               LIMIT 50`
  const res = await client.post('/query/aql', { q: aql })
  const rows: string[][] = res.data?.rows ?? []
  return rows.map(([ehrId, subjectId, subjectNamespace, timeCreated]) => ({
    ehrId,
    subjectId: subjectId || undefined,
    subjectNamespace: subjectNamespace || undefined,
    timeCreated: timeCreated || undefined,
  }))
}

export async function createEHR(
  client: AxiosInstance,
  subject?: { id: string; namespace: string },
  options?: { isQueryable?: boolean; isModifiable?: boolean }
): Promise<EHR> {
  const body = {
    _type: 'EHR_STATUS',
    archetype_node_id: 'openEHR-EHR-EHR_STATUS.generic.v1',
    name: { _type: 'DV_TEXT', value: 'EHR Status' },
    subject: subject
      ? {
          _type: 'PARTY_SELF',
          external_ref: {
            _type: 'PARTY_REF',
            id: { _type: 'GENERIC_ID', value: subject.id, scheme: 'id_scheme' },
            namespace: subject.namespace,
            type: 'PERSON',
          },
        }
      : { _type: 'PARTY_SELF' },
    is_queryable: options?.isQueryable ?? true,
    is_modifiable: options?.isModifiable ?? true,
  }
  const res = await client.post<EHR>('/ehr', body, {
    headers: { Prefer: 'return=representation' },
  })
  return res.data
}

export async function getEHR(client: AxiosInstance, ehrId: string): Promise<EHR> {
  const res = await client.get<EHR>(`/ehr/${ehrId}`)
  return res.data
}

export async function getEHRBySubjectId(
  client: AxiosInstance,
  subjectId: string,
  subjectNamespace: string
): Promise<EHR> {
  const res = await client.get<EHR>('/ehr', {
    params: { subject_id: subjectId, subject_namespace: subjectNamespace },
  })
  return res.data
}
