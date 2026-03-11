import type { ReactNode } from 'react'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: ReactNode
  onDismiss?: () => void
}

const styles = {
  info: { wrap: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300', icon: '💡' },
  success: { wrap: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300', icon: '✓' },
  warning: { wrap: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300', icon: '⚠' },
  error: { wrap: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300', icon: '✕' },
}

export function Alert({ variant = 'info', title, children, onDismiss }: AlertProps) {
  const s = styles[variant]
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${s.wrap}`}>
      <span className="mt-0.5 shrink-0 font-bold">{s.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="break-words">{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  )
}
