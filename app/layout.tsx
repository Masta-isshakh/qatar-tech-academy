import type { ReactNode } from 'react'

/**
 * Every route lives under `app/[locale]`, which renders <html> and <body> so it
 * can set `lang` and `dir` per locale. This root layout is a pass-through, as
 * next-intl's App Router setup prescribes.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
