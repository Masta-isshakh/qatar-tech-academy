'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export type FaqItem = { q: string; a: string }

export function FaqAccordion({ items, idPrefix = 'faq' }: { items: FaqItem[]; idPrefix?: string }) {
  if (items.length === 0) return null

  return (
    <Accordion
      type="single"
      collapsible
      className="border-border-subtle bg-background rounded-2xl border px-6"
    >
      {items.map((item, i) => (
        <AccordionItem key={`${idPrefix}-${i}`} value={`${idPrefix}-${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
