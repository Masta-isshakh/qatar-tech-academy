import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  /*
   * A single negative lookahead, which is what Next actually compiles reliably:
   * skip API routes, Next internals, and anything with a file extension
   * (robots.txt, sitemap.xml, /images/*). Everything else gets locale handling.
   */
  matcher: '/((?!api|_next|_vercel|.*\..*).*)',
}
