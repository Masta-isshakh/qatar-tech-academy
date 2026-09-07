import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/site/section'

export default async function LocaleNotFound() {
  const t = await getTranslations('common')

  return (
    <Section>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="ltr-nums text-6xl font-extrabold text-primary/25">404</p>
        <h1 className="text-3xl">{t('notFound')}</h1>
        <p className="max-w-prose text-muted">{t('notFoundBody')}</p>
        <Button asChild className="mt-2">
          <Link href="/">{t('backHome')}</Link>
        </Button>
      </div>
    </Section>
  )
}
