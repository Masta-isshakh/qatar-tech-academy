'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { closeLabel: string }
>(({ className, children, closeLabel, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="bg-charcoal/70 fixed inset-0 z-50 backdrop-blur-sm" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'bg-background shadow-lift fixed top-1/2 left-1/2 z-50 w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-4',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="bg-background/90 text-muted hover:text-foreground absolute end-3 top-3 rounded-full p-2"
        aria-label={closeLabel}
      >
        <X className="size-5" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = 'DialogContent'
