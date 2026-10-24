import { useEffect, useId, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface DialogProps {
  title: string
  description?: string
  onClose: () => void
  /** When false (e.g. while saving), Escape, backdrop clicks and the close button do nothing. */
  dismissible?: boolean
  /** Element to focus when the dialog opens. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>
  children: ReactNode
}

/**
 * Modal dialog: rendered in a portal, traps Tab focus, closes on Escape,
 * locks page scroll and restores focus to the opener when it unmounts.
 * Mount it only while it should be open.
 */
export function Dialog({
  title,
  description,
  onClose,
  dismissible = true,
  initialFocusRef,
  children,
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)

  useEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  }, [onClose, dismissible])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow

    const initial =
      initialFocusRef?.current ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel
    initial.focus()
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (!panel) return

      if (event.key === 'Escape') {
        if (dismissibleRef.current) {
          event.stopPropagation()
          onCloseRef.current()
        }
        return
      }

      if (event.key !== 'Tab') return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (!first || !last) {
        event.preventDefault()
        panel.focus()
        return
      }

      const active = document.activeElement
      const outside = !panel.contains(active)

      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [initialFocusRef])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-midnight-950/60 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl bg-white shadow-card-hover outline-none"
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}