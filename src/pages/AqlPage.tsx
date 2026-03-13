import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { JsonViewer } from '../components/shared/JsonViewer'
import { AqlEditor } from '../components/shared/AqlEditor'
import { useServerConfig } from '../context/ServerConfigContext'
import { useActiveEHR } from '../context/ActiveEHRContext'
import { createApiClient, formatError } from '../api/client'
import { formatTimestamp } from '../utils/date'
import { runAql, type AqlResult } from '../api/aql'
import {
  listStoredQueries,
  getStoredQueryVersions,
  getStoredQuery,
  saveStoredQuery,
  type StoredQuery,
} from '../api/storedQuery'

const EXAMPLE_QUERIES = [
  {
    label: 'All EHRs',
    q: `SELECT e/ehr_id/value AS ehr_id, e/time_created/value AS created
FROM EHR e
LIMIT 20`,
  },
  {
    label: 'Compositions for active EHR',
    q: `SELECT c/uid/value AS uid,
       c/name/value AS name,
       c/context/start_time/value AS start_time
FROM EHR e[ehr_id/value='{EHR_ID}']
CONTAINS COMPOSITION c
ORDER BY c/context/start_time DESC`,
  },
  {
    label: 'All compositions',
    q: `SELECT e/ehr_id/value AS ehr_id,
       c/uid/value AS uid,
       c/name/value AS name
FROM EHR e
CONTAINS COMPOSITION c
LIMIT 20`,
  },
  {
    label: 'Compositions by template',
    q: `SELECT e/ehr_id/value AS ehr_id,
       c/uid/value AS uid,
       c/context/start_time/value AS start_time
FROM EHR e
CONTAINS COMPOSITION c[openEHR-EHR-COMPOSITION.encounter.v1]
ORDER BY c/context/start_time DESC
LIMIT 20`,
  },
  {
    label: 'Observations in active EHR',
    q: `SELECT o/name/value AS observation,
       o/data[at0001]/events[at0006]/data[at0003]/items/value AS value,
       o/data[at0001]/events[at0006]/time/value AS time
FROM EHR e[ehr_id/value='{EHR_ID}']
CONTAINS COMPOSITION c
CONTAINS OBSERVATION o
ORDER BY o/data[at0001]/events[at0006]/time DESC
LIMIT 20`,
  },
  {
    label: 'EHR count',
    q: `SELECT COUNT(e/ehr_id/value) AS total
FROM EHR e`,
  },
  {
    label: 'Composition count for active EHR',
    q: `SELECT COUNT(c/uid/value) AS composition_count
FROM EHR e[ehr_id/value='{EHR_ID}']
CONTAINS COMPOSITION c`,
  },
  {
    label: 'Compositions in date range',
    q: `SELECT e/ehr_id/value AS ehr_id,
       c/uid/value AS uid,
       c/name/value AS name,
       c/context/start_time/value AS start_time
FROM EHR e
CONTAINS COMPOSITION c
WHERE c/context/start_time/value >= '2024-01-01T00:00:00'
  AND c/context/start_time/value <  '2025-01-01T00:00:00'
ORDER BY c/context/start_time DESC
LIMIT 50`,
  },
]

export function AqlPage() {
  const { config } = useServerConfig()
  const { activeEHR } = useActiveEHR()
  const client = createApiClient(config)
  const qc = useQueryClient()

  const [query, setQuery] = useState(EXAMPLE_QUERIES[0].q)
  const [result, setResult] = useState<AqlResult | null>(null)

  // Save form
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveVersion, setSaveVersion] = useState('')

  // Versions panel
  const [selectedQuery, setSelectedQuery] = useState<StoredQuery | null>(null)
  const [newVersionInput, setNewVersionInput] = useState('')

  const {
    data: storedQueries = [],
    isError: isListError,
    error: listError,
    isFetching: isListFetching,
  } = useQuery({
    queryKey: ['storedQueries', config.baseUrl],
    queryFn: () => listStoredQueries(client),
    retry: false,
  })

  const { data: versions = [], isFetching: isVersionsFetching } = useQuery({
    queryKey: ['storedQueryVersions', config.baseUrl, selectedQuery?.name],
    queryFn: () => getStoredQueryVersions(client, selectedQuery!.name),
    enabled: !!selectedQuery,
    retry: false,
  })

  const runMutation = useMutation({
    mutationFn: () => runAql(client, query),
    onSuccess: (data) => setResult(data),
  })

  const loadStoredMutation = useMutation({
    mutationFn: ({ name, version }: { name: string; version: string }) =>
      getStoredQuery(client, name, version),
    onSuccess: (sq) => loadQuery(sq.q),
  })

  const saveMutation = useMutation({
    mutationFn: ({ name, q, version }: { name: string; q: string; version?: string }) =>
      saveStoredQuery(client, name, q, version || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['storedQueries'] })
      if (selectedQuery) qc.invalidateQueries({ queryKey: ['storedQueryVersions'] })
      setShowSaveForm(false)
      setSaveName('')
      setSaveVersion('')
    },
  })

  function fillActiveEhr(q: string) {
    return activeEHR ? q.replace('{EHR_ID}', activeEHR.ehr_id.value) : q
  }

  function loadQuery(q: string) {
    setQuery(fillActiveEhr(q))
    setResult(null)
    runMutation.reset()
  }

  // Deduplicate by name for the list view
  const uniqueQueries = storedQueries.reduce<StoredQuery[]>((acc, sq) => {
    if (!acc.find((q) => q.name === sq.name)) acc.push(sq)
    return acc
  }, [])

  const columns = result?.columns ?? []
  const rows = result?.rows ?? []

  return (
    <div>
      <PageHeader
        title="AQL Query"
        description="Run Archetype Query Language queries against the EHRBase server"
      />

      <div className="space-y-6">
        {/* Query panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle>Query Editor</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowSaveForm((v) => !v)}
                  >
                    {showSaveForm ? 'Cancel' : 'Store Query'}
                  </Button>
                  <Button
                    onClick={() => runMutation.mutate()}
                    loading={runMutation.isPending}
                    disabled={!query.trim()}
                    size="sm"
                  >
                    Run Query
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeEHR && (
                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                  <span className="font-medium">Active EHR:</span>
                  <span className="font-mono">{activeEHR.ehr_id.value}</span>
                </div>
              )}
              <AqlEditor
                value={query}
                rows={10}
                onChange={(v) => {
                  setQuery(v)
                  setResult(null)
                  runMutation.reset()
                }}
              />

              {showSaveForm && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Store Query</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Qualified Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        autoFocus
                        placeholder="e.g. org.example::find_all_ehrs"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500">[namespace::] query-name</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Version (optional)
                      </label>
                      <input
                        placeholder="e.g. 1.0.0"
                        value={saveVersion}
                        onChange={(e) => setSaveVersion(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500">SEMVER — omit to auto-version</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!saveName.trim()}
                    loading={saveMutation.isPending}
                    onClick={() =>
                      saveMutation.mutate({ name: saveName.trim(), q: query, version: saveVersion.trim() })
                    }
                  >
                    Store
                  </Button>
                  {saveMutation.isError && (
                    <Alert variant="error" onDismiss={() => saveMutation.reset()}>
                      {formatError(saveMutation.error)}
                    </Alert>
                  )}
                  {saveMutation.isSuccess && (
                    <Alert variant="success" onDismiss={() => saveMutation.reset()}>
                      Query stored successfully.
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {runMutation.isError && (
            <Alert variant="error" onDismiss={() => runMutation.reset()}>
              {formatError(runMutation.error)}
            </Alert>
          )}

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle>Results</CardTitle>
                  <Badge variant="blue">
                    {rows.length} row{rows.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-0">
                {rows.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">No rows returned.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 sticky top-0">
                        <tr>
                          {columns.length > 0
                            ? columns.map((col, i) => (
                                <th
                                  key={i}
                                  className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap"
                                >
                                  {col.name ?? col.path ?? `col${i}`}
                                </th>
                              ))
                            : (rows[0] as unknown[]).map((_, i) => (
                                <th
                                  key={i}
                                  className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                                >
                                  col{i}
                                </th>
                              ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {rows.map((row, ri) => (
                          <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            {(row as unknown[]).map((cell, ci) => (
                              <td
                                key={ci}
                                className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-mono text-xs max-w-xs truncate"
                              >
                                {cell === null || cell === undefined ? (
                                  <span className="text-gray-400 dark:text-gray-500 italic">null</span>
                                ) : typeof cell === 'object' ? (
                                  JSON.stringify(cell)
                                ) : (
                                  String(cell)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <JsonViewer data={result} title="Raw response" defaultCollapsed />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Query panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Examples</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {EXAMPLE_QUERIES.map((eq) => (
                  <li key={eq.label}>
                    <button
                      onClick={() => loadQuery(eq.q)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {eq.label}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Stored queries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stored Queries</CardTitle>
                {isListFetching && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Loading…</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isListError && (
                <div className="px-4 py-3">
                  <Alert variant="error">{formatError(listError)}</Alert>
                </div>
              )}
              {!isListError && uniqueQueries.length === 0 && !isListFetching && (
                <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 italic">No stored queries.</p>
              )}
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {uniqueQueries.map((sq) => (
                  <li
                    key={sq.name}
                    className={`px-4 py-3 transition-colors ${selectedQuery?.name === sq.name ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() => loadStoredMutation.mutate({ name: sq.name, version: sq.version })}
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-100 truncate font-medium" title={sq.name}>
                          {sq.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">v{sq.version}</p>
                      </button>
                      <button
                        className="shrink-0 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-0.5"
                        title="Show versions"
                        onClick={() =>
                          setSelectedQuery((prev) => (prev?.name === sq.name ? null : sq))
                        }
                      >
                        {selectedQuery?.name === sq.name ? '▲' : '▼'}
                      </button>
                    </div>

                    {/* Expanded: versions list */}
                    {selectedQuery?.name === sq.name && (
                      <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                        {isVersionsFetching ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500">Loading versions…</p>
                        ) : (
                          <ul className="space-y-1">
                            {versions.map((v) => (
                              <li
                                key={v.version}
                                className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                    v{v.version}
                                  </span>
                                  {v.saved && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                      {formatTimestamp(v.saved)}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => loadStoredMutation.mutate({ name: sq.name, version: v.version })}
                                  className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Load
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex gap-2 items-center pt-1">
                          <input
                            placeholder="New version (e.g. 1.0.1)"
                            value={newVersionInput}
                            onChange={(e) => setNewVersionInput(e.target.value)}
                            className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => {
                              saveMutation.mutate(
                                { name: sq.name, q: query, version: newVersionInput.trim() },
                                { onSuccess: () => setNewVersionInput('') }
                              )
                            }}
                            disabled={saveMutation.isPending || !newVersionInput.trim()}
                            className="shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium disabled:opacity-40"
                          >
                            Store version
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
