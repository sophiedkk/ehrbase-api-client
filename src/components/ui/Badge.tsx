import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'gray' | 'blue' | 'green' | 'red' | 'yellow'
}

const variants = {
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  green: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  red: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
