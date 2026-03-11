import { useRef, useCallback } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'

const TOKEN_STYLES: Record<string, string> = {
  keyword: 'text-blue-600 dark:text-blue-400',
  function: 'text-violet-600 dark:text-violet-400',
  string: 'text-green-700 dark:text-green-400',
  number: 'text-orange-600 dark:text-orange-400',
  operator: 'text-gray-600 dark:text-gray-400',
  punctuation: 'text-gray-500 dark:text-gray-500',
  comment: 'text-gray-400 dark:text-gray-500 italic',
}

function highlight(code: string): string {
  const grammar = Prism.languages.sql
  const tokens = Prism.tokenize(code, grammar)

  function renderTokens(tokens: (string | Prism.Token)[]): string {
    return tokens
      .map((token) => {
        if (typeof token === 'string') {
          return escapeHtml(token)
        }
        const cls = TOKEN_STYLES[token.type] ?? 'text-gray-800 dark:text-gray-200'
        const content = Array.isArray(token.content)
          ? renderTokens(token.content as (string | Prism.Token)[])
          : escapeHtml(String(token.content))
        return `<span class="${cls}">${content}</span>`
      })
      .join('')
  }

  return renderTokens(tokens)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

interface AqlEditorProps {
  value: string
  onChange: (value: string) => void
  rows?: number
}

const SHARED =
  'absolute inset-0 w-full h-full m-0 border-0 bg-transparent px-3 py-2 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words overflow-auto resize-none'

export function AqlEditor({ value, onChange, rows = 10 }: AqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)

  const syncScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  const minHeight = `${rows * 26 + 16}px`

  return (
    <div
      className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden"
      style={{ minHeight }}
    >
      <pre
        ref={preRef}
        aria-hidden
        className={SHARED + ' pointer-events-none text-gray-900 dark:text-gray-100'}
        dangerouslySetInnerHTML={{ __html: highlight(value) + '\n' }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        spellCheck={false}
        className={SHARED + ' text-transparent caret-black dark:caret-white focus:outline-none'}
        style={{ minHeight }}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
      />
    </div>
  )
}
