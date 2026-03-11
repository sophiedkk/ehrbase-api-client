import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { JsonViewer } from '../components/shared/JsonViewer'
import { XmlViewer } from '../components/shared/XmlViewer'
import { useServerConfig } from '../context/ServerConfigContext'
import { createApiClient, formatError } from '../api/client'
import {
  listTemplates,
  uploadTemplate,
  getTemplate,
  getTemplateExample,
  EXAMPLE_FORMATS,
} from '../api/template'
import type { ExampleFormat } from '../api/template'
import type { TemplateListItem } from '../types/openehr'

export function TemplatePage() {
  const { config } = useServerConfig()
  const qc = useQueryClient()
  const client = createApiClient(config)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateListItem | null>(null)
  const [templateXml, setTemplateXml] = useState<string | null>(null)
  const [exampleResult, setExampleResult] = useState<{
    data: unknown
    type: 'json' | 'xml'
    format: string
  } | null>(null)

  const {
    data: templates,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['templates', config.baseUrl],
    queryFn: () => listTemplates(client),
    retry: false,
  })

  const uploadMutation = useMutation({
    mutationFn: () => uploadTemplate(client, fileContent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      setSelectedFile(null)
      setFileContent('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  const getXmlMutation = useMutation({
    mutationFn: (templateId: string) => getTemplate(client, templateId),
    onSuccess: (data) => setTemplateXml(data),
  })

  const exampleMutation = useMutation({
    mutationFn: ({ templateId, format }: { templateId: string; format: ExampleFormat }) =>
      getTemplateExample(client, templateId, format),
    onSuccess: (result, { format }) => setExampleResult({ ...result, format: format.label }),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFileContent(ev.target?.result as string)
    reader.readAsText(file)
  }

  function handleSelectTemplate(t: TemplateListItem) {
    setSelectedTemplate(t)
    setTemplateXml(null)
    setExampleResult(null)
  }

  return (
    <div>
      <PageHeader
        title="Template Management"
        description="Upload OPT files, browse templates, and generate example compositions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Upload */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Upload OPT Template</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload an Operational Template (OPT) XML file to register it with EHRBase.
            </p>

            <div
              className="flex-1 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".opt,.xml"
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">📄 {selectedFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click to select an OPT file</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">or drag and drop (.opt, .xml)</p>
                </div>
              )}
            </div>

            {fileContent && <XmlViewer data={fileContent} title="Preview" defaultCollapsed />}

            <Button
              onClick={() => uploadMutation.mutate()}
              loading={uploadMutation.isPending}
              disabled={!fileContent}
              className="w-full"
            >
              Upload Template
            </Button>

            {uploadMutation.isError && (
              <Alert variant="error" onDismiss={() => uploadMutation.reset()}>
                {formatError(uploadMutation.error)}
              </Alert>
            )}
            {uploadMutation.isSuccess && (
              <Alert variant="success" onDismiss={() => uploadMutation.reset()}>
                Template uploaded successfully!
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Template list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Templates</CardTitle>
              {templates && <Badge variant="blue">{templates.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && <div className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
            {isError && (
              <div className="px-6 py-4">
                <Alert variant="error">{formatError(error)}</Alert>
              </div>
            )}
            {templates?.length === 0 && (
              <div className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">No templates found.</div>
            )}
            {templates && templates.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[26rem]">
                {templates.map((t) => (
                  <li
                    key={t.template_id}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedTemplate?.template_id === t.template_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleSelectTemplate(t)}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.template_id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.concept}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected template actions */}
      {selectedTemplate && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Template: {selectedTemplate.template_id}</CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => getXmlMutation.mutate(selectedTemplate.template_id)}
                loading={getXmlMutation.isPending}
              >
                Download OPT XML
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Concept</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedTemplate.concept}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Archetype ID</p>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                  {selectedTemplate.archetype_id}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Created</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedTemplate.created_timestamp}</p>
              </div>
            </div>

            {/* Format selector */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Generate Example</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_FORMATS.map((fmt) => {
                  const isActive = exampleResult?.format === fmt.label
                  const isLoading =
                    exampleMutation.isPending && exampleMutation.variables?.format.id === fmt.id
                  return (
                    <button
                      key={fmt.id}
                      disabled={exampleMutation.isPending}
                      onClick={() =>
                        exampleMutation.mutate({
                          templateId: selectedTemplate.template_id,
                          format: fmt,
                        })
                      }
                      className={[
                        'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
                      ].join(' ')}
                    >
                      {isLoading ? '…' : fmt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {exampleMutation.isError && (
              <Alert variant="error" onDismiss={() => exampleMutation.reset()}>
                {formatError(exampleMutation.error)}
              </Alert>
            )}

            {exampleResult != null &&
              (exampleResult.type === 'xml' ? (
                <XmlViewer
                  data={exampleResult.data as string}
                  title={`Example — ${exampleResult.format}`}
                />
              ) : (
                <JsonViewer data={exampleResult.data} title={`Example — ${exampleResult.format}`} />
              ))}

            {getXmlMutation.isError && (
              <Alert variant="error">{formatError(getXmlMutation.error)}</Alert>
            )}
            {templateXml && <XmlViewer data={templateXml} title="OPT XML" />}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
