export interface ServerConfig {
  baseUrl: string
  username: string
  password: string
}

export interface EHR {
  ehr_id: { value: string }
  system_id: { value: string }
  ehr_status: EHRStatus
  time_created: { value: string }
}

export interface EHRStatus {
  uid?: { value: string }
  subject: {
    external_ref?: {
      id: { value: string }
      namespace: string
      type: string
    }
  }
  is_queryable: boolean
  is_modifiable: boolean
}

export interface TemplateListItem {
  template_id: string
  concept: string
  archetype_id: string
  created_timestamp: string
}

export interface Composition {
  uid?: { value: string }
  archetype_details?: {
    archetype_id: { value: string }
    template_id?: { value: string }
  }
  [key: string]: unknown
}

export interface CompositionResponse {
  uid: { value: string }
  [key: string]: unknown
}

export interface ApiError {
  message: string
  status?: number
}
