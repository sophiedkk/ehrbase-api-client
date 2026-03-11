import type { AxiosInstance } from 'axios'
import type { TemplateListItem } from '../types/openehr'

export async function listTemplates(client: AxiosInstance): Promise<TemplateListItem[]> {
  const res = await client.get<TemplateListItem[]>('/definition/template/adl1.4')
  return res.data
}

export async function uploadTemplate(client: AxiosInstance, optXml: string): Promise<void> {
  await client.post('/definition/template/adl1.4', optXml, {
    headers: { 'Content-Type': 'application/xml', Accept: 'application/xml' },
  })
}

export async function getTemplate(client: AxiosInstance, templateId: string): Promise<string> {
  const res = await client.get<string>(
    `/definition/template/adl1.4/${encodeURIComponent(templateId)}`,
    {
      headers: { Accept: 'application/xml' },
      responseType: 'text',
    }
  )
  return res.data
}

export const EXAMPLE_FORMATS = [
  {
    id: 'STRUCTURED',
    label: 'Structured',
    accept: 'application/json',
    format: 'STRUCTURED',
    type: 'json',
  },
  { id: 'FLAT', label: 'Flat', accept: 'application/json', format: 'FLAT', type: 'json' },
  { id: 'RAW', label: 'Raw (canonical)', accept: 'application/json', format: 'JSON', type: 'json' },
  { id: 'XML', label: 'XML', accept: 'application/xml', format: 'XML', type: 'xml' },
] as const

export type ExampleFormat = (typeof EXAMPLE_FORMATS)[number]

export async function getTemplateExample(
  client: AxiosInstance,
  templateId: string,
  format: ExampleFormat
): Promise<{ data: unknown; type: 'json' | 'xml' }> {
  const res = await client.get<string>(
    `/definition/template/adl1.4/${encodeURIComponent(templateId)}/example`,
    {
      params: { format: format.format },
      headers: { Accept: format.accept },
      responseType: 'text',
    }
  )
  if (format.type === 'xml') {
    return { data: res.data, type: 'xml' }
  }
  return { data: JSON.parse(res.data), type: 'json' }
}
