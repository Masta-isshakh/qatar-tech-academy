'use client'

import { useTranslations } from 'next-intl'
import { MessageCircle } from 'lucide-react'
import { whatsappLink } from '@/lib/site'
import { trackEvent } from '@/components/providers/analytics'

export function WhatsAppFloat() {
  const t = useTranslations('nav')
  const tc = useTranslations('contact')

  return (
    <a
      href={whatsappLink(tc('whatsappMessage'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp')}
      onClick={() => trackEvent('whatsapp_click', { placement: 'float' })}
      className="shadow-lift fixed end-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105 focus-visible:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      <MessageCircle className="size-7" aria-hidden />
    </a>
  )
}
