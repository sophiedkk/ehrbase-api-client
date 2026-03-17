import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
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
import { TableScroller } from '../components/shared/TableScroller'
import { runAql, type AqlResult } from '../api/aql'
import { listStoredQueries, getStoredQuery, type StoredQuery } from '../api/storedQuery'

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

  const [query, setQuery] = useState(EXAMPLE_QUERIES[0].q)
  const [result, setResult] = useState<AqlResult | null>(null)


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

const runMutation = useMutation({
    mutationFn: () => runAql(client, query),
    onSuccess: (data) => setResult(data),
  })

  const loadStoredMutation = useMutation({
    mutationFn: ({ name, version }: { name: string; version: string }) =>
      getStoredQuery(client, name, version),
    onSuccess: (sq) => loadQuery(sq.q),
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
                  <TableScroller>
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
                  </TableScroller>
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
                  <li key={sq.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <button
                      className="w-full text-left px-4 py-3"
                      onClick={() => loadStoredMutation.mutate({ name: sq.name, version: sq.version })}
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-100 truncate font-medium" title={sq.name}>
                        {sq.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">v{sq.version}</p>
                    </button>
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
