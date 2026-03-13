import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { JsonViewer } from '../components/shared/JsonViewer'
import { XmlViewer } from '../components/shared/XmlViewer'
import { useServerConfig } from '../context/ServerConfigContext'
import { useActiveEHR } from '../context/ActiveEHRContext'
import { useActiveComposition } from '../context/ActiveCompositionContext'
import { createApiClient, formatError } from '../api/client'
import {
  createComposition,
  getComposition,
  listCompositions,
  COMPOSITION_FORMATS,
} from '../api/composition'
import type { CompositionFormat } from '../api/composition'
import { listTemplates, getTemplateExample, EXAMPLE_FORMATS } from '../api/template'

const FORMAT_TO_EXAMPLE: Record<string, (typeof EXAMPLE_FORMATS)[number]> = {
  JSON: EXAMPLE_FORMATS.find((f) => f.id === 'RAW')!,
  STRUCTURED: EXAMPLE_FORMATS.find((f) => f.id === 'STRUCTURED')!,
  FLAT: EXAMPLE_FORMATS.find((f) => f.id === 'FLAT')!,
  XML: EXAMPLE_FORMATS.find((f) => f.id === 'XML')!,
}

function FormatSelector({
  value,
  onChange,
}: {
  value: CompositionFormat
  onChange: (f: CompositionFormat) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COMPOSITION_FORMATS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f)}
          className={[
            'px-3 py-1 rounded-lg text-sm font-medium border transition-colors',
            f.id === value.id
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
          ].join(' ')}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

export function CompositionPage() {
  const { config } = useServerConfig()
  const { activeEHR } = useActiveEHR()
  const { activeComposition, setActiveComposition } = useActiveComposition()
  const activeEhrId = activeEHR?.ehr_id?.value ?? ''
  const client = createApiClient(config)

  const [postFormat, setPostFormat] = useState<CompositionFormat>(COMPOSITION_FORMATS[0])
  const [getFormat, setGetFormat] = useState<CompositionFormat>(COMPOSITION_FORMATS[0])

  const [postEhrId, setPostEhrId] = useState(activeEhrId)
  const [compositionBody, setCompositionBody] = useState('')
  const [bodyError, setBodyError] = useState<string | null>(null)
  const [postResult, setPostResult] = useState<{
    compositionId: string
    response: unknown
    responseType: 'json' | 'xml'
  } | null>(null)

  const [getEhrId, setGetEhrId] = useState(activeEhrId)
  const [getCompositionId, setGetCompositionId] = useState(activeComposition?.compositionId ?? '')

  useEffect(() => {
    if (activeComposition?.compositionId) {
      setGetCompositionId(activeComposition.compositionId)
      setGetEhrId(activeComposition.ehrId)
    }
  }, [activeComposition])
  const [fetchedComposition, setFetchedComposition] = useState<{
    data: unknown
    type: 'json' | 'xml'
  } | null>(null)

  const [listEhrId, setListEhrId] = useState(activeEhrId)
  const [exampleTemplateId, setExampleTemplateId] = useState('')

  const { data: templates } = useQuery({
    queryKey: ['templates', config.baseUrl],
    queryFn: () => listTemplates(client),
    retry: false,
  })

  const loadExampleMutation = useMutation({
    mutationFn: (templateId: string) =>
      getTemplateExample(client, templateId, FORMAT_TO_EXAMPLE[postFormat.id]),
    onSuccess: ({ data, type }) => {
      setCompositionBody(type === 'xml' ? (data as string) : JSON.stringify(data, null, 2))
      setBodyError(null)
    },
  })

  const postMutation = useMutation({
    mutationFn: () => createComposition(client, postEhrId.trim(), compositionBody, postFormat),
    onSuccess: (data) => {
      setPostResult(data)
      if (data.compositionId) {
        setActiveComposition({ compositionId: data.compositionId, ehrId: postEhrId.trim() })
      }
    },
  })

  const getMutation = useMutation({
    mutationFn: () => getComposition(client, getEhrId.trim(), getCompositionId.trim(), getFormat),
    onSuccess: (data) => {
      setFetchedComposition(data)
      setActiveComposition({ compositionId: getCompositionId.trim(), ehrId: getEhrId.trim() })
    },
  })

  const listMutation = useMutation({
    mutationFn: () => listCompositions(client, listEhrId.trim()),
  })

  function handleBodyChange(value: string) {
    setCompositionBody(value)
    if (postFormat.editorType === 'json') {
      try {
        JSON.parse(value)
        setBodyError(null)
      } catch {
        setBodyError('Invalid JSON')
      }
    } else {
      setBodyError(null)
    }
  }

  function handleFormatChange(f: CompositionFormat) {
    setPostFormat(f)
    setCompositionBody('')
    setBodyError(null)
    postMutation.reset()
    loadExampleMutation.reset()
    setPostResult(null)
  }

  function handlePost() {
    if (postFormat.editorType === 'json') {
      try {
        JSON.parse(compositionBody)
      } catch {
        setBodyError('Invalid JSON — please fix before posting')
        return
      }
    }
    setBodyError(null)
    postMutation.mutate()
  }

  const isPostDisabled = !postEhrId.trim() || !compositionBody.trim() || !!bodyError
  const rows = listMutation.data ?? []

  return (
    <div>
      <PageHeader
        title="Composition Management"
        description="Post and retrieve clinical compositions"
      />

      <div className="space-y-6">
        {/* Post composition */}
        <Card>
          <CardHeader>
            <CardTitle>Post Composition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Format</p>
              <FormatSelector value={postFormat} onChange={handleFormatChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="EHR ID"
                placeholder="e.g. 7d44b88c-4199-4bad-97dc-d78268e01398"
                value={postEhrId}
                onChange={(e) => setPostEhrId(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Load from Template Example
                </label>
                <div className="flex gap-2 min-w-0">
                  <select
                    className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
                    value={exampleTemplateId}
                    onChange={(e) => setExampleTemplateId(e.target.value)}
                  >
                    <option value="">Select a template…</option>
                    {templates?.map((t) => (
                      <option key={t.template_id} value={t.template_id}>
                        {t.template_id}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={!exampleTemplateId}
                    loading={loadExampleMutation.isPending}
                    onClick={() => loadExampleMutation.mutate(exampleTemplateId)}
                  >
                    Load
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Composition ({postFormat.label})
                {bodyError && <span className="ml-2 text-xs text-red-600 dark:text-red-400">{bodyError}</span>}
              </label>
              <textarea
                rows={12}
                spellCheck={false}
                className={[
                  'block w-full rounded-lg border px-3 py-2 text-xs font-mono text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  bodyError
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700',
                ].join(' ')}
                placeholder={
                  postFormat.editorType === 'xml'
                    ? '<?xml version="1.0" encoding="UTF-8"?>\n<composition ...>'
                    : '{ "_type": "COMPOSITION", ... }'
                }
                value={compositionBody}
                onChange={(e) => handleBodyChange(e.target.value)}
              />
            </div>

            <Button
              onClick={handlePost}
              loading={postMutation.isPending}
              disabled={isPostDisabled}
              className="w-full"
            >
              Post Composition
            </Button>

            {postMutation.isError && (
              <Alert variant="error" onDismiss={() => postMutation.reset()}>
                {formatError(postMutation.error)}
              </Alert>
            )}
            {loadExampleMutation.isError && (
              <Alert variant="error" onDismiss={() => loadExampleMutation.reset()}>
                {formatError(loadExampleMutation.error)}
              </Alert>
            )}

            {postResult && (
              <div className="space-y-3">
                <Alert variant="success">Composition posted and set as active.</Alert>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Composition ID</p>
                  <p className="font-mono text-sm text-purple-900 dark:text-purple-200 break-all font-semibold">
                    {postResult.compositionId}
                  </p>
                </div>
                {postResult.response != null &&
                  (postResult.responseType === 'xml' ? (
                    <XmlViewer
                      data={postResult.response as string}
                      title="Response"
                      defaultCollapsed
                    />
                  ) : (
                    <JsonViewer data={postResult.response} title="Response" defaultCollapsed />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Get composition */}
          <Card>
            <CardHeader>
              <CardTitle>Get Composition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Format</p>
                <FormatSelector
                  value={getFormat}
                  onChange={(f) => {
                    setGetFormat(f)
                    setFetchedComposition(null)
                    getMutation.reset()
                  }}
                />
              </div>
              <Input
                label="EHR ID"
                placeholder="EHR UUID"
                value={getEhrId}
                onChange={(e) => setGetEhrId(e.target.value)}
              />
              <Input
                label="Composition ID / Versioned UID"
                placeholder="e.g. 8849182c-82ad-4088-a07f-48ead4180515::local.ehrbase.org::1"
                value={getCompositionId}
                onChange={(e) => setGetCompositionId(e.target.value)}
              />
              <Button
                onClick={() => getMutation.mutate()}
                loading={getMutation.isPending}
                disabled={!getEhrId.trim() || !getCompositionId.trim()}
                className="w-full"
              >
                Retrieve Composition
              </Button>
              {getMutation.isError && (
                <Alert variant="error" onDismiss={() => getMutation.reset()}>
                  {formatError(getMutation.error)}
                </Alert>
              )}
              {fetchedComposition != null &&
                (fetchedComposition.type === 'xml' ? (
                  <XmlViewer data={fetchedComposition.data as string} title="Composition" />
                ) : (
                  <JsonViewer data={fetchedComposition.data} title="Composition" />
                ))}
            </CardContent>
          </Card>

          {/* List compositions */}
          <Card>
            <CardHeader>
              <CardTitle>List Compositions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="EHR ID"
                placeholder="EHR UUID"
                value={listEhrId}
                onChange={(e) => setListEhrId(e.target.value)}
              />
              <Button
                onClick={() => listMutation.mutate()}
                loading={listMutation.isPending}
                disabled={!listEhrId.trim()}
                className="w-full"
              >
                List Compositions
              </Button>

              {listMutation.isError && (
                <Alert variant="error" onDismiss={() => listMutation.reset()}>
                  {formatError(listMutation.error)}
                </Alert>
              )}

              {listMutation.isSuccess && rows.length === 0 && (
                <Alert variant="info">No compositions found for this EHR.</Alert>
              )}

              {rows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Results</span>
                    <Badge variant="blue">{rows.length}</Badge>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-80 overflow-y-auto">
                    {rows.map((row: unknown, i) => {
                      const r = row as string[]
                      const uid = r[0]
                      return (
                        <div
                          key={i}
                          className="px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                          onClick={() => {
                            setGetCompositionId(uid)
                            setGetEhrId(listEhrId.trim())
                            setActiveComposition({ compositionId: uid, ehrId: listEhrId.trim() })
                          }}
                        >
                          <p className="font-mono text-xs text-purple-700 dark:text-purple-400 break-all">{uid}</p>
                          {r[1] && <p className="text-gray-700 dark:text-gray-300 mt-0.5">{r[1]}</p>}
                          {r[2] && <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{r[2]}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
