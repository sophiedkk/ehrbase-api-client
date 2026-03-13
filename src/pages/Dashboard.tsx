import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useServerConfig } from '../context/ServerConfigContext'
import { createApiClient } from '../api/client'
import { listTemplates } from '../api/template'
import { formatTimestamp } from '../utils/date'

export function Dashboard() {
  const { config } = useServerConfig()
  const client = createApiClient(config)

  const {
    data: templates,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['templates', config.baseUrl],
    queryFn: () => listTemplates(client),
    retry: false,
  })

  const serverStatus = isLoading ? 'checking' : isError ? 'offline' : 'online'

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your EHRBase server connection and resources"
      />

      {/* Server status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link to="/settings" className="block h-full">
          <Card className="h-full hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Server Status</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{serverStatus}</p>
              </div>
              <Badge
                variant={
                  serverStatus === 'online'
                    ? 'green'
                    : serverStatus === 'offline'
                      ? 'red'
                      : 'yellow'
                }
              >
                {serverStatus}
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Link to="/templates" className="block h-full">
          <Card className="h-full hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Templates</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {isLoading ? '…' : (templates?.length ?? 0)}
                </p>
              </div>
              <span className="text-2xl">📄</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/settings" className="block h-full">
          <Card className="h-full hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">Server URL</p>
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{config.baseUrl}</p>
              </div>
              <span className="text-2xl shrink-0">🔗</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { to: '/ehr', icon: '👤', label: 'Create EHR', desc: 'Register a new patient' },
              { to: '/templates', icon: '📄', label: 'Upload Template', desc: 'Add an OPT file' },
              {
                to: '/templates',
                icon: '🔍',
                label: 'Template Example',
                desc: 'Generate example data',
              },
              {
                to: '/compositions',
                icon: '📋',
                label: 'Post Composition',
                desc: 'Add clinical data',
              },
            ].map(({ to, icon, label, desc }) => (
              <Link key={label} to={to}>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent templates */}
      {templates && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Templates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Template ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Concept
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {[...templates]
                  .sort(
                    (a, b) =>
                      new Date(b.created_timestamp).getTime() -
                      new Date(a.created_timestamp).getTime()
                  )
                  .slice(0, 5)
                  .map((t) => (
                    <tr key={t.template_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-3 font-mono text-xs text-blue-700 dark:text-blue-400">{t.template_id}</td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{t.concept}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatTimestamp(t.created_timestamp)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
