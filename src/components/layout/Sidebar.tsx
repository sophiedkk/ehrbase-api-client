import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useActiveEHR } from '../../context/ActiveEHRContext'
import { useActiveComposition } from '../../context/ActiveCompositionContext'
import { useTheme } from '../../context/ThemeContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/ehr', label: 'EHR', icon: '👤' },
  { to: '/templates', label: 'Templates', icon: '📄' },
  { to: '/compositions', label: 'Compositions', icon: '📋' },
  { to: '/aql', label: 'AQL', icon: '🔍' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { activeEHR, setActiveEHR } = useActiveEHR()
  const { activeComposition, setActiveComposition } = useActiveComposition()
  const { theme, toggleTheme } = useTheme()
  const ehrId = activeEHR?.ehr_id?.value
  const compositionId = activeComposition?.compositionId
  const [copiedEhr, setCopiedEhr] = useState(false)
  const [copiedComp, setCopiedComp] = useState(false)

  async function copyEhrId() {
    if (!ehrId) return
    await navigator.clipboard.writeText(ehrId)
    setCopiedEhr(true)
    setTimeout(() => setCopiedEhr(false), 1500)
  }

  async function copyCompositionId() {
    if (!compositionId) return
    await navigator.clipboard.writeText(compositionId)
    setCopiedComp(true)
    setTimeout(() => setCopiedComp(false), 1500)
  }

  const content = (
    <aside className="w-64 lg:w-48 shrink-0 bg-gray-900 h-full flex flex-col overflow-y-auto">
      {/* Logo */}
      <NavLink
        to="/"
        onClick={onClose}
        className="px-3 py-3 border-b border-gray-700 shrink-0 flex items-center gap-2 hover:bg-gray-800 transition-colors"
      >
        <span className="text-xl">🏥</span>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">EHRBase</p>
          <p className="text-gray-400 text-xs">Client</p>
        </div>
      </NavLink>

      {/* Nav */}
      <nav className="px-2 py-2 space-y-0.5 shrink-0">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              ].join(' ')
            }
          >
            <span className="text-base leading-none w-5 text-center shrink-0">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Active EHR */}
      <div className="px-2 pt-2 pb-2 shrink-0">
        <div
          className={`rounded-lg px-2.5 py-2 ${ehrId ? 'bg-gray-800 cursor-pointer group' : 'bg-gray-800/40'}`}
          onClick={ehrId ? copyEhrId : undefined}
          title={ehrId ? (copiedEhr ? 'Copied!' : 'Click to copy EHR ID') : undefined}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-400">Active EHR</p>
            {ehrId && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                  {copiedEhr ? '✓' : '⎘'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveEHR(null) }}
                  className="text-gray-600 hover:text-gray-400 text-xs leading-none"
                  title="Clear active EHR"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {ehrId ? (
            <p className={`font-mono text-xs break-all leading-relaxed transition-colors ${copiedEhr ? 'text-green-300' : 'text-green-400 group-hover:text-green-300'}`}>
              {copiedEhr ? 'Copied!' : ehrId}
            </p>
          ) : (
            <p className="text-xs text-gray-600 italic">None selected</p>
          )}
        </div>
      </div>

      {/* Active Composition */}
      <div className="px-2 pb-2 shrink-0">
        <div
          className={`rounded-lg px-2.5 py-2 ${compositionId ? 'bg-gray-800 cursor-pointer group' : 'bg-gray-800/40'}`}
          onClick={compositionId ? copyCompositionId : undefined}
          title={compositionId ? (copiedComp ? 'Copied!' : 'Click to copy Composition ID') : undefined}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-400">Active Composition</p>
            {compositionId && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                  {copiedComp ? '✓' : '⎘'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveComposition(null) }}
                  className="text-gray-600 hover:text-gray-400 text-xs leading-none"
                  title="Clear active composition"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {compositionId ? (
            <p className={`font-mono text-xs break-all leading-relaxed transition-colors ${copiedComp ? 'text-purple-300' : 'text-purple-400 group-hover:text-purple-300'}`}>
              {copiedComp ? 'Copied!' : compositionId}
            </p>
          ) : (
            <p className="text-xs text-gray-600 italic">None selected</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-700 mt-auto shrink-0 flex items-center justify-between gap-2">
        <p className="text-gray-600 text-xs whitespace-nowrap">openEHR REST API v1</p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/sophiedkk/ehrbase-api-client"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="View on GitHub"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
          <button
            onClick={toggleTheme}
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        {content}
      </div>

      {/* Mobile: slide-in drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className={`absolute inset-y-0 left-0 transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {content}
        </div>
      </div>
    </>
  )
}
