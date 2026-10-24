import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { getErrorMessage, isApiError } from '../lib/api/errors'
import { validateRegister } from '../lib/validation'
import type { FieldErrors, RegisterValues } from '../lib/validation'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<keyof RegisterValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setFormError(null)

    const nextErrors = validateRegister({ name, email, password, confirmPassword })
    setErrors(nextErrors)

    if (nextErrors.name) return void nameRef.current?.focus()
    if (nextErrors.email) return void emailRef.current?.focus()
    if (nextErrors.password) return void passwordRef.current?.focus()
    if (nextErrors.confirmPassword) return void confirmRef.current?.focus()

    setIsSubmitting(true)

    try {
      // Only name, email and password are sent: accounts are always customers.
      await register({ name: name.trim(), email: email.trim(), password })
      navigate('/login', {
        replace: true,
        state: { registered: true, email: email.trim() },
      })
    } catch (error) {
      if (isApiError(error) && error.code === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ email: error.message })
        emailRef.current?.focus()
      } else {
        setFormError(getErrorMessage(error))
      }
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Register to browse inventory and record purchases.
      </p>

      {formError ? (
        <div className="mt-6">
          <Alert variant="error">{formError}</Alert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <TextField
          ref={nameRef}
          label="Full name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          disabled={isSubmitting}
        />
        <TextField
          ref={emailRef}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          disabled={isSubmitting}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          hint="At least 12 characters."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          disabled={isSubmitting}
        />
        <TextField
          ref={confirmRef}
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </Card>
  )
}