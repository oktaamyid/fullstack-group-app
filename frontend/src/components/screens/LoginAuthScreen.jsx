import { useMemo, useState } from 'react'
import { AuthLayout } from '../layouts/AuthLayout'
import { FormField } from '../ui/FormField'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { useI18n } from '../../i18n/useI18n'

const defaultForm = {
  name: '',
  email: '',
  password: '',
}

export function LoginAuthScreen({ onAuthSuccess, mainLogo, mascotImage }) {
  const { t, language } = useI18n()
  const tr = (en, id) => (language === 'id-ID' ? id : en)
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(defaultForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegister = mode === 'register'

  const submitLabel = useMemo(() => {
    return isRegister ? t('createAccount', 'Create Account') : t('signIn', 'Sign In')
  }, [isRegister, t])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const switchMode = () => {
    setErrorMessage('')
    setForm(defaultForm)
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!form.email || !form.password || (isRegister && !form.name)) {
      setErrorMessage(t('pleaseCompleteRequiredFields', 'Please complete all required fields.'))
      return
    }

    setIsSubmitting(true)

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.data?.detail || data?.message || tr('Authentication failed.', 'Autentikasi gagal.'))
      }

      const token = data?.data?.token
      const user = data?.data?.user

      if (!token || !user) {
        throw new Error(tr('Invalid auth response from server.', 'Respons autentikasi dari server tidak valid.'))
      }

      onAuthSuccess({ token, user })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout maxWidth="max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="hidden rounded-2xl border border-[#1c1c13] bg-[#6366f1] p-6 text-white shadow-[4px_4px_0_#1c1c13] lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="rounded-full border border-white/70 bg-white/10 px-3 py-1 text-xs font-black tracking-widest uppercase">{tr('Desktop Access', 'Akses Desktop')}</p>
            <h2 className="mt-4 text-4xl font-black leading-tight">LIVO Finance Management</h2>
            <p className="mt-3 text-sm text-white/90">{tr('Track spending, split bills, and wishlist goals with one finance workspace.', 'Pantau pengeluaran, split bill, dan target wishlist dalam satu workspace finansial.')}</p>
          </div>
          <div className="mt-6 rounded-2xl border border-white/70 bg-white p-4">
            <img src={mainLogo} alt="LIVO Logo" className="h-24 w-auto" />
          </div>
        </section>

        <div className="rounded-2xl border border-[#1c1c13] bg-[#fff9dc] p-4 text-[#1c1c13] lg:p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="h-28 w-28 overflow-hidden rounded-full border border-[#1c1c13] bg-[#fbbf24] shadow-[4px_4px_0_#1c1c13]">
              <img src={mainLogo} alt="LIVO Logo" className="h-full w-full object-cover" />
            </div>
          </div>

          <h1 className="m-0 text-2xl font-extrabold">{isRegister ? t('createAccount', 'Create Account') : t('welcomeBack', 'Welcome Back')}</h1>
          <p className="mt-1 text-sm text-[#464554]">
            {isRegister ? t('startYourBudgetJourney', 'Start your budget journey.') : t('signInToContinue', 'Sign in to continue managing your budget.')}
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          {isRegister ? (
            <FormField
              label={t('fullName', 'Full Name')}
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder={t('yourName', 'Your name')}
              required
            />
          ) : null}

          <FormField
            label={t('emailAddress', 'Email Address')}
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder={tr('yourmail@gmail.com', 'emailkamu@gmail.com')}
            required
          />

          <FormField
            label={t('password', 'Password')}
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
            required
          />

          {errorMessage ? (
            <Alert type="error">{errorMessage}</Alert>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            fullWidth
            className="bg-[#6366f1] text-white shadow-[3px_3px_0_#1c1c13]"
          >
            {isSubmitting ? t('submitting', 'Submitting...') : submitLabel}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#464554]">
          <span>{isRegister ? t('alreadyHaveAccount', 'Already have an account?') : t('needAccount', 'Need an account?')}</span>
          <button type="button" onClick={switchMode} className="rounded-full border border-[#1c1c13] bg-white px-3 py-1 font-bold">
            {isRegister ? t('login', 'Login') : t('register', 'Register')}
          </button>
        </div>
        </div>
      </div>
    </AuthLayout>
  )
}
