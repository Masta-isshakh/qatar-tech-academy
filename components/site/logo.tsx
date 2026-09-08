import Image from 'next/image'
import { cn } from '@/lib/utils'

// Rendered box for the 2079×756 artwork; next/image serves a 2× variant for
// high-density screens.
const WIDTH = 132
const HEIGHT = 48

/**
 * The academy wordmark. `logo.png` (charcoal text) is for light surfaces and
 * `logo-white.png` (the file as supplied) for dark ones; both come out of
 * `npm run images`. The header passes `priority` so the logo is in the
 * preload set and never pops in after the text.
 *
 * Both images are decorative here (`alt=""`): whichever is displayed depends on
 * the theme, so the accessible name lives on the wrapping link or the caller,
 * not on one of two swapped images.
 */
export function Logo({
  className,
  onDark = false,
  priority = false,
}: {
  className?: string
  onDark?: boolean
  priority?: boolean
}) {
  if (onDark) {
    return (
      <Image
        src="/images/logo-white.png"
        alt=""
        aria-hidden
        width={WIDTH}
        height={HEIGHT}
        priority={priority}
        className={cn('h-12 w-auto', className)}
      />
    )
  }

  return (
    <span className={cn('block', className)} aria-hidden>
      <Image
        src="/images/logo.png"
        alt=""
        width={WIDTH}
        height={HEIGHT}
        priority={priority}
        className="h-12 w-auto dark:hidden"
      />
      <Image
        src="/images/logo-white.png"
        alt=""
        width={WIDTH}
        height={HEIGHT}
        className="hidden h-12 w-auto dark:block"
      />
    </span>
  )
}
