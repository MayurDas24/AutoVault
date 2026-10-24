import { useRef } from 'react'
import { Alert } from './Alert'
import { Button } from './Button'
import { Dialog } from './Dialog'

export interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
}

/** Confirmation for destructive actions. Focus starts on Cancel. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog
      title={title}
      description={description}
      onClose={onCancel}
      dismissible={!isLoading}
      initialFocusRef={cancelRef}
    >
      {error ? (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      ) : null}
      <div className="flex justify-end gap-3">
        <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}