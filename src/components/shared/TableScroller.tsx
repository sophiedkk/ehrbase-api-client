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
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
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
