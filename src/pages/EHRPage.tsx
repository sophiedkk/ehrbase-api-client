import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Toggle } from '../components/ui/Toggle'
import { JsonViewer } from '../components/shared/JsonViewer'
import { useServerConfig } from '../context/ServerConfigContext'
import { useActiveEHR } from '../context/ActiveEHRContext'
import { createApiClient, formatError } from '../api/client'
import { createEHR, getEHR, getEHRBySubjectId, listEHRs } from '../api/ehr'
import type { EHRSummary } from '../api/ehr'

export function EHRPage() {
  const { config } = useServerConfig()
  const { activeEHR, setActiveEHR } = useActiveEHR()
  const client = createApiClient(config)

  const [subjectId, setSubjectId] = useState('')
  const [subjectNamespace, setSubjectNamespace] = useState('')
  const [isQueryable, setIsQueryable] = useState(true)
  const [isModifiable, setIsModifiable] = useState(true)
  const [lookupEhrId, setLookupEhrId] = useState('')
  const [lookupSubjectId, setLookupSubjectId] = useState('')
  const [lookupNamespace, setLookupNamespace] = useState('')
  const [copied, setCopied] = useState(false)

  const listMutation = useMutation({
    mutationFn: () => listEHRs(client),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createEHR(client, subjectId ? { id: subjectId, namespace: subjectNamespace } : undefined, {
        isQueryable,
        isModifiable,
      }),
    onSuccess: (data) => setActiveEHR(data),
  })

  const getByIdMutation = useMutation({
    mutationFn: () => getEHR(client, lookupEhrId.trim()),
    onSuccess: (data) => setActiveEHR(data),
  })

  const getBySubjectMutation = useMutation({
    mutationFn: () => getEHRBySubjectId(client, lookupSubjectId.trim(), lookupNamespace.trim()),
    onSuccess: (data) => setActiveEHR(data),
  })

  async function copyEhrId() {
    if (!activeEHR?.ehr_id?.value) return
    await navigator.clipboard.writeText(activeEHR.ehr_id.value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const subjectRef = activeEHR?.ehr_status?.subject?.external_ref

  return (
    <div>
      <PageHeader
        title="EHR Management"
        description="Create and retrieve Electronic Health Records"
      />

      {/* Active EHR banner */}
      <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-1">
                Active EHR
              </p>
              {activeEHR ? (
                <p className="font-mono text-sm text-blue-900 dark:text-blue-100 break-all font-semibold">
                  {activeEHR.ehr_id?.value}
                </p>
              ) : (
                <p className="text-sm text-blue-400 dark:text-blue-500 italic">
                  No EHR selected — create one or look one up below.
                </p>
              )}
            </div>
            {activeEHR && (
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={copyEhrId}>
                  {copied ? 'Copied!' : 'Copy ID'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveEHR(null)}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout: actions left, details right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left column: stacked action cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create EHR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Subject ID (optional)"
                placeholder="e.g. patient-001"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              />
              <Input
                label="Subject Namespace (optional)"
                placeholder="e.g. local"
                value={subjectNamespace}
                onChange={(e) => setSubjectNamespace(e.target.value)}
              />
              <div className="space-y-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5">
                <Toggle label="Queryable" checked={isQueryable} onChange={setIsQueryable} />
                <Toggle label="Modifiable" checked={isModifiable} onChange={setIsModifiable} />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                className="w-full"
              >
                Create EHR
              </Button>
              {createMutation.isError && (
                <Alert variant="error" onDismiss={() => createMutation.reset()}>
                  {formatError(createMutation.error)}
                </Alert>
              )}
              {createMutation.isSuccess && (
                <Alert variant="success" onDismiss={() => createMutation.reset()}>
                  EHR created and set as active.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get EHR by ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="EHR ID"
                placeholder="e.g. 7d44b88c-4199-4bad-97dc-d78268e01398"
                value={lookupEhrId}
                onChange={(e) => setLookupEhrId(e.target.value)}
              />
              <Button
                onClick={() => getByIdMutation.mutate()}
                loading={getByIdMutation.isPending}
                disabled={!lookupEhrId.trim()}
                className="w-full"
              >
                Load EHR
              </Button>
              {getByIdMutation.isError && (
                <Alert variant="error" onDismiss={() => getByIdMutation.reset()}>
                  {formatError(getByIdMutation.error)}
                </Alert>
              )}
              {getByIdMutation.isSuccess && (
                <Alert variant="success" onDismiss={() => getByIdMutation.reset()}>
                  EHR loaded and set as active.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get EHR by Subject</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Subject ID"
                placeholder="e.g. patient-001"
                value={lookupSubjectId}
                onChange={(e) => setLookupSubjectId(e.target.value)}
              />
              <Input
                label="Subject Namespace"
                placeholder="e.g. local"
                value={lookupNamespace}
                onChange={(e) => setLookupNamespace(e.target.value)}
              />
              <Button
                onClick={() => getBySubjectMutation.mutate()}
                loading={getBySubjectMutation.isPending}
                disabled={!lookupSubjectId.trim()}
                className="w-full"
              >
                Find EHR
              </Button>
              {getBySubjectMutation.isError && (
                <Alert variant="error" onDismiss={() => getBySubjectMutation.reset()}>
                  {formatError(getBySubjectMutation.error)}
                </Alert>
              )}
              {getBySubjectMutation.isSuccess && (
                <Alert variant="success" onDismiss={() => getBySubjectMutation.reset()}>
                  EHR found and set as active.
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: details + list */}
        <div className="space-y-4 lg:sticky lg:top-8">
          {activeEHR ? (
            <Card>
              <CardHeader>
                <CardTitle>EHR Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">EHR ID</p>
                    <p className="font-mono text-gray-900 dark:text-gray-100 break-all">{activeEHR.ehr_id?.value}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">System ID</p>
                    <p className="font-mono text-gray-700 dark:text-gray-300">{activeEHR.system_id?.value ?? '—'}</p>
                  </div>
                  {subjectRef && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Subject</p>
                      <p className="text-gray-900 dark:text-gray-100">{subjectRef.id?.value}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {subjectRef.namespace} · {subjectRef.type}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Queryable</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {activeEHR.ehr_status?.is_queryable ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Modifiable</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {activeEHR.ehr_status?.is_modifiable ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                  {activeEHR.time_created && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Created</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {String(activeEHR.time_created?.value ?? activeEHR.time_created)}
                      </p>
                    </div>
                  )}
                </div>
                <JsonViewer data={activeEHR} title="Raw JSON" defaultCollapsed />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed dark:border-gray-700">
              <CardContent className="py-8 text-center text-gray-400 dark:text-gray-500">
                <p className="text-3xl mb-3">👤</p>
                <p className="text-sm">EHR details will appear here once one is selected.</p>
              </CardContent>
            </Card>
          )}

          {/* EHR list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Existing EHRs</CardTitle>
                <div className="flex items-center gap-2">
                  {listMutation.data && <Badge variant="blue">{listMutation.data.length}</Badge>}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => listMutation.mutate()}
                    loading={listMutation.isPending}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!listMutation.data && !listMutation.isPending && (
                <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 italic">
                  Click Refresh to load EHRs.
                </p>
              )}
              {listMutation.isError && (
                <div className="px-4 py-3">
                  <Alert variant="error">{formatError(listMutation.error)}</Alert>
                </div>
              )}
              {listMutation.data?.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No EHRs found.</p>
              )}
              {listMutation.data && listMutation.data.length > 0 && (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-72">
                  {listMutation.data.map((e: EHRSummary) => (
                    <li
                      key={e.ehrId}
                      className={`px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${activeEHR?.ehr_id?.value === e.ehrId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => getEHR(client, e.ehrId).then(setActiveEHR)}
                    >
                      <p className="font-mono text-xs text-blue-700 dark:text-blue-400 break-all">{e.ehrId}</p>
                      {e.subjectId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {e.subjectId} · {e.subjectNamespace}
                        </p>
                      )}
                      {e.timeCreated && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{e.timeCreated}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
