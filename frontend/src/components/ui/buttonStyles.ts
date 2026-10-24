import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const baseStyles =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-card hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-card hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  danger: 'bg-red-600 text-white shadow-card hover:bg-red-700 active:bg-red-800',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

/**
 * Returns the class string for a button. Use it to give router <Link>s
 * the exact same appearance as a <Button>.
 */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full',
    className,
  )
}