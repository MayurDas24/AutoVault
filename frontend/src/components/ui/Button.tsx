import type { ComponentPropsWithRef, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { buttonStyles } from './buttonStyles'
import type { ButtonSize, ButtonVariant } from './buttonStyles'

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  variant,
  size,
  fullWidth,
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}