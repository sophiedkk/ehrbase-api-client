import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { useServerConfig } from '../context/ServerConfigContext'
import { createApiClient, formatError } from '../api/client'
import { listTemplates } from '../api/template'
import type { ServerConfig } from '../types/openehr'

export function SettingsPage() {
  const { config, setConfig } = useServerConfig()
  const [form, setForm] = useState<ServerConfig>(config)
  const [saved, setSaved] = useState(false)

  const testMutation = useMutation({
    mutationFn: () => listTemplates(createApiClient(form)),
  })

  function handleSave() {
    setConfig(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleChange(field: keyof ServerConfig, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  return (
    <div>
      <PageHeader title="Settings" description="Configure your EHRBase server connection" />

      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Server Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Base URL"
              placeholder="http://localhost:8080/ehrbase/rest/openehr/v1"
              value={form.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              hint="The full path to the openEHR REST API v1 endpoint"
            />
            <Input
              label="Username"
              placeholder="ehrbase-user"
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} className="flex-1">
                Save Settings
              </Button>
              <Button
                variant="secondary"
                onClick={() => testMutation.mutate()}
                loading={testMutation.isPending}
              >
                Test Connection
              </Button>
            </div>

            {saved && <Alert variant="success">Settings saved!</Alert>}
            {testMutation.isError && (
              <Alert variant="error" onDismiss={() => testMutation.reset()}>
                Connection failed: {formatError(testMutation.error)}
              </Alert>
            )}
            {testMutation.isSuccess && (
              <Alert variant="success" onDismiss={() => testMutation.reset()}>
                Connected successfully! Found {testMutation.data?.length ?? 0} template(s).
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common EHRBase URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Default Docker', url: 'http://localhost:8080/ehrbase/rest/openehr/v1' },
              {
                label: 'EHRbase cloud',
                url: 'https://sandbox.ehrbase.org/ehrbase/rest/openehr/v1',
              },
            ].map(({ label, url }) => (
              <div
                key={url}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs font-mono text-gray-500">{url}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleChange('baseUrl', url)}>
                  Use
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
