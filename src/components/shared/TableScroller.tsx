import { useRef, useState, useEffect, useLayoutEffect, type ReactNode } from 'react'

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

  // No dependency array — runs synchronously after every render, before paint.
  // This reliably catches overflow caused by parent re-renders (e.g. data loading in),
  // in both dev and production builds.
  useLayoutEffect(() => {
    update()
  })

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
      {showLeft && (
        <div className="absolute left-0 inset-y-0 w-10 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10 pointer-events-none" />
      )}
      <div ref={ref} className="overflow-x-auto">
        {children}
      </div>
      {showRight && (
        <div className="absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10 pointer-events-none" />
      )}
    </div>
  )
}
