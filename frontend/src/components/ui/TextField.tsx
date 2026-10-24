import { useId, useState } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface TextFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'id'> {
  label: string
  id?: string
  error?: string
  hint?: string
}

export function TextField({
  label,
  id,
  error,
  hint,
  type = 'text',
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative mt-1.5">
        <input
          id={inputId}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'block h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-card transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            error ? 'border-red-400' : 'border-slate-300 hover:border-slate-400',
            isPassword && 'pr-10',
            className,
          )}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-lg text-slate-400 transition-colors hover:text-slate-600"
          >
            {revealed ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}