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

export function Sidebar() {
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

  return (
    <aside className="w-48 shrink-0 bg-gray-900 h-screen sticky top-0 flex flex-col overflow-y-auto">
      {/* Logo */}
      <NavLink to="/" className="px-3 py-3 border-b border-gray-700 shrink-0 flex items-center gap-2 hover:bg-gray-800 transition-colors">
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

      {/* Spacer pushes active indicators to the bottom */}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveEHR(null)
                  }}
                  className="text-gray-600 hover:text-gray-400 text-xs leading-none"
                  title="Clear active EHR"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {ehrId ? (
            <p
              className={`font-mono text-xs break-all leading-relaxed transition-colors ${copiedEhr ? 'text-green-300' : 'text-green-400 group-hover:text-green-300'}`}
            >
              {copiedEhr ? 'Copied!' : ehrId}
            </p>
          ) : (
            <p className="text-xs text-gray-600 italic">None selected</p>
          )}
        </div>
      </div>

      {/* Active Composition indicator */}
      <div className="px-2 pb-2 shrink-0">
        <div
          className={`rounded-lg px-2.5 py-2 ${compositionId ? 'bg-gray-800 cursor-pointer group' : 'bg-gray-800/40'}`}
          onClick={compositionId ? copyCompositionId : undefined}
          title={
            compositionId ? (copiedComp ? 'Copied!' : 'Click to copy Composition ID') : undefined
          }
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-400">Active Composition</p>
            {compositionId && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                  {copiedComp ? '✓' : '⎘'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveComposition(null)
                  }}
                  className="text-gray-600 hover:text-gray-400 text-xs leading-none"
                  title="Clear active composition"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {compositionId ? (
            <p
              className={`font-mono text-xs break-all leading-relaxed transition-colors ${copiedComp ? 'text-purple-300' : 'text-purple-400 group-hover:text-purple-300'}`}
            >
              {copiedComp ? 'Copied!' : compositionId}
            </p>
          ) : (
            <p className="text-xs text-gray-600 italic">None selected</p>
          )}
        </div>
      </div>

      {/* Footer with theme toggle */}
      <div className="px-3 py-2 border-t border-gray-700 mt-auto shrink-0 flex items-center justify-between">
        <p className="text-gray-600 text-xs">openEHR REST API v1</p>
        <button
          onClick={toggleTheme}
          className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </aside>
  )
}
