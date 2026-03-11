import { useState } from 'react'
import { Button } from '../ui/Button'

interface JsonViewerProps {
  data: unknown
  title?: string
  defaultCollapsed?: boolean
}

export function JsonViewer({ data, title, defaultCollapsed = false }: JsonViewerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify(data, null, 2)

  async function copy() {
    await navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <span className={`transition-transform ${collapsed ? '' : 'rotate-90'}`}>▶</span>
          {title ?? 'Response'}
        </button>
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      {!collapsed && (
        <pre className="p-4 text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 overflow-auto max-h-96 font-mono">
          {json}
        </pre>
      )}
    </div>
  )
}
