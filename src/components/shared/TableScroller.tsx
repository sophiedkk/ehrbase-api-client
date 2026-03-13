import { useState, useEffect, type ReactNode } from 'react'

function isDark() {
  return document.documentElement.classList.contains('dark')
}

export function TableScroller({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(isDark)

  useEffect(() => {
    const mo = new MutationObserver(() => setDark(isDark()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  const bg = dark ? '#1f2937' : '#ffffff'
  const shadow = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

  return (
    <div
      className="overflow-x-auto"
      style={{
        // Two "local" gradients act as covers — they scroll with the content,
        // masking the shadow at whichever edge has no more content.
        // Two "scroll" gradients stay fixed at the element edges as the visible shadows.
        backgroundImage: [
          `linear-gradient(to right, ${bg}, transparent)`,
          `linear-gradient(to left,  ${bg}, transparent)`,
          `linear-gradient(to right, ${shadow}, transparent)`,
          `linear-gradient(to left,  ${shadow}, transparent)`,
        ].join(', '),
        backgroundSize:       '3rem 100%, 3rem 100%, 1.5rem 100%, 1.5rem 100%',
        backgroundPosition:   'left, right, left, right',
        backgroundRepeat:     'no-repeat',
        backgroundAttachment: 'local, local, scroll, scroll',
      }}
    >
      {children}
    </div>
  )
}
