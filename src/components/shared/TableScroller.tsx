import { useRef, useState, useLayoutEffect, useEffect, type ReactNode } from 'react'

export function TableScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  function update() {
    const el = ref.current
    if (!el) return
    setShowLeft(el.scrollLeft > 0)
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useLayoutEffect(() => { update() })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="relative">
      <div className={`absolute left-0 inset-y-0 w-8 pointer-events-none z-10 transition-opacity duration-150 ${showLeft ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
      <div ref={ref} className="overflow-x-auto">
        {children}
      </div>
      <div className={`absolute right-0 inset-y-0 w-8 pointer-events-none z-10 transition-opacity duration-150 ${showRight ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)' }} />
    </div>
  )
}
