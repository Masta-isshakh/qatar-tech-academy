'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('nav')
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // The server cannot know the resolved theme, so render the icon only after mount.
  useEffect(() => setMounted(true), [])

  return (
    <button
      type="button"
      aria-label={t('toggleTheme')}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'border-border-subtle hover:bg-surface inline-grid size-10 place-items-center rounded-full border transition-colors',
        className
      )}
    >
      {mounted && resolvedTheme === 'dark' ? (
        <Sun className="size-4.5" aria-hidden />
      ) : (
        <Moon className="size-4.5" aria-hidden />
      )}
    </button>
  )
}
