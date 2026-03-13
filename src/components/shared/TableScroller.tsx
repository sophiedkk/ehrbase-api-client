import { useRef, useState, useEffect, type ReactNode } from 'react'

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

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // rAF ensures layout is fully calculated before the first check
    const rafId = requestAnimationFrame(update)

    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })

    // Observe both the container and its content (the table) so any
    // size change — container narrowing or table widening — triggers a check
    const ro = new ResizeObserver(update)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)

    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro.disconnect()
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
