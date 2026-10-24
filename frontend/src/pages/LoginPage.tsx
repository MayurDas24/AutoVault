import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { getErrorMessage } from '../lib/api/errors'
import { validateLogin } from '../lib/validation'
import type { FieldErrors, LoginValues } from '../lib/validation'

interface RegisteredState {
  registered: boolean
  email: string
}

function readRegisteredState(value: unknown): RegisteredState {
  if (typeof value !== 'object' || value === null) {
    return { registered: false, email: '' }
  }

  const { registered, email } = value as Record<string, unknown>

  return {
    registered: registered === true,
    email: typeof email === 'string' ? email : '',
  }
}

export function LoginPage() {
  const { login, notice, clearNotice } = useAuth()
  const location = useLocation()
  const registered = readRegisteredState(location.state)

  const [email, setEmail] = useState(registered.email)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<keyof LoginValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    clearNotice()
    setFormError(null)

    const nextErrors = validateLogin({ email, password })
    setErrors(nextErrors)

    if (nextErrors.email) {
      emailRef.current?.focus()
      return
    }
    if (nextErrors.password) {
      passwordRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      // On success the guest-only route redirects away from this page.
    } catch (error) {
      setFormError(getErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Welcome back. Enter your details to manage your inventory.
      </p>

      <div className="mt-6 space-y-4">
        {registered.registered ? (
          <Alert variant="success">Account created. Sign in to continue.</Alert>
        ) : null}
        {notice ? <Alert variant="warning">{notice}</Alert> : null}
        {formError ? <Alert variant="error">{formError}</Alert> : null}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to AutoVault?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </Card>
  )
}